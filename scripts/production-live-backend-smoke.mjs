#!/usr/bin/env node
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = (process.env.BASE_URL ?? "https://typingarena.click").replace(/\/$/, "");
const outputDir = process.env.OUTPUT_DIR ?? "artifacts/journey-v4/production";
await fs.mkdir(outputDir, { recursive: true });

const report = {
  baseUrl,
  testedAt: new Date().toISOString(),
  checks: [],
  operations: [],
  pageErrors: [],
  expectedConsoleErrors: [],
  consoleErrors: [],
  backendErrors: [],
};

function safeMessage(value) {
  return String(value)
    .replace(/https?:\/\/\S+/g, "[url]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "[opaque]")
    .replace(/[0-9a-f]{32,}/gi, "[opaque]")
    .slice(0, 240);
}

function safeRoute(route) {
  try {
    const url = new URL(route, baseUrl);
    for (const key of ["manage", "invite", "test", "challenge"]) {
      if (url.searchParams.has(key)) url.searchParams.set(key, "[opaque]");
    }
    if (url.hash) url.hash = "#[opaque]";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "[route]";
  }
}

function pass(name, detail = "") {
  report.checks.push({ name, passed: true, detail });
}

function assertCheck(name, condition, detail = "") {
  report.checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
}

const contexts = [];
async function newContext() {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 1440, height: 900 },
  });
  await context.addInitScript(() => localStorage.setItem("ta:analytics_consent", "denied"));
  contexts.push(context);
  return context;
}

async function newPage(context, route) {
  const page = await context.newPage();
  const diagnosticRoute = safeRoute(route);
  page.on("pageerror", (error) => report.pageErrors.push({ route: diagnosticRoute, message: safeMessage(error.message) }));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const detail = { route: diagnosticRoute, message: safeMessage(message.text()) };
    if (diagnosticRoute.startsWith("/assessments?invite=") && /status of 400/i.test(message.text())) report.expectedConsoleErrors.push(detail);
    else report.consoleErrors.push(detail);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    try {
      const url = new URL(response.url());
      if (/supabase/i.test(url.hostname)) report.backendErrors.push({ route: diagnosticRoute, status: response.status(), path: url.pathname });
    } catch {
      // Ignore non-URL response data.
    }
  });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  return page;
}

async function waitTeamList(page) {
  await page.getByRole("heading", { name: /Practice groups you can open/i }).waitFor({ state: "visible", timeout: 20_000 });
}

function teamRow(page, name) {
  return page.getByText(name, { exact: true }).locator("..");
}

async function readRenderedManagementLink(page) {
  const linkText = await page.getByText(/Keep this management link private:/).last().innerText();
  const match = linkText.match(/https:\/\/[^\s]+/);
  if (!match) throw new Error("management link was not rendered");
  return match[0];
}

async function readManagementLink(page, buttonName) {
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  const clipboardMatch = clipboard.match(/https:\/\/[^\s]+/);
  if (clipboardMatch) return clipboardMatch[0];
  return readRenderedManagementLink(page);
}

async function acceptNextDialog(page) {
  page.once("dialog", (dialog) => void dialog.accept());
}

async function deleteTeamIfVisible(page, name) {
  try {
    await page.goto(`${baseUrl}/teams`, { waitUntil: "domcontentloaded" });
    await waitTeamList(page);
    const nameNode = page.getByText(name, { exact: true });
    if ((await nameNode.count()) === 0) return false;
    const row = nameNode.locator("..");
    await row.getByText("Settings", { exact: true }).click();
    const deleteButton = row.getByRole("button", { name: "Delete team", exact: true });
    if ((await deleteButton.count()) === 0) return false;
    await acceptNextDialog(page);
    await deleteButton.click();
    await nameNode.waitFor({ state: "hidden", timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

async function localPractice() {
  const context = await newContext();
  const page = await newPage(context, "/?duration=15");
  const supabaseRequests = [];
  page.on("request", (request) => {
    try {
      if (/supabase/i.test(new URL(request.url()).hostname)) supabaseRequests.push(true);
    } catch {
      // Ignore non-URL request data.
    }
  });
  const input = page.getByLabel(/Type here/i);
  await input.click();
  await input.pressSequentially("the quick brown fox jumps over the lazy dog ", { delay: 4 });
  await page.locator("[data-typing-result]").waitFor({ state: "visible", timeout: 20_000 });
  assertCheck("Ordinary Home practice completes locally", await page.locator("[data-typing-result]").isVisible());
  assertCheck("Ordinary Home practice makes no shared-backend request", supabaseRequests.length === 0, `${supabaseRequests.length} request(s)`);
  report.operations.push("ordinary local Home practice completed with shared backend untouched");
}

async function teamRoundTrip() {
  const teamName = `Release smoke team ${Date.now().toString(36)}`;
  const assignmentTitle = `Release smoke assignment ${Date.now().toString(36)}`;
  const ownerContext = await newContext();
  const owner = await newPage(ownerContext, "/teams");
  let memberContext;
  let member;
  let recoveryContext;
  let recovery;
  let teamCreated = false;
  let managementLink = null;
  try {
    const teamInput = owner.getByPlaceholder("e.g. Data Entry Cohort A");
    await teamInput.fill(teamName);
    await owner.getByRole("button", { name: "Create team", exact: true }).click();
    await owner.getByText(teamName, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    teamCreated = true;
    const ownerRow = teamRow(owner, teamName);
    const joinCode = (await ownerRow.locator("span.font-mono").innerText()).trim();
    assertCheck("Team create returns a join code", /^[A-Z0-9]{6,12}$/.test(joinCode));
    await ownerRow.getByText("Settings", { exact: true }).click();
    managementLink = await readRenderedManagementLink(owner);
    const teamId = new URL(managementLink).searchParams.get("manage");
    assertCheck("Team management link identifies the created resource", Boolean(teamId));

    await ownerRow.getByRole("button", { name: "Open", exact: true }).click();
    await owner.getByRole("tab", { name: "assignments", exact: true }).click();
    await owner.getByRole("textbox", { name: "assignment title" }).fill(assignmentTitle);
    await owner.getByRole("spinbutton", { name: "assignment duration seconds" }).fill("15");
    await owner.getByRole("button", { name: "Publish", exact: true }).click();
    await owner.getByText(assignmentTitle, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    pass("Team owner publishes a real assignment");

    memberContext = await newContext();
    member = await newPage(memberContext, "/teams");
    await member.getByLabel("team code").fill(joinCode);
    await member.getByRole("button", { name: "Join with code", exact: true }).click();
    await member.getByText(teamName, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    pass("Second anonymous session joins the team by code");
    await teamRow(member, teamName).getByRole("button", { name: "Open", exact: true }).click();
    await member.getByRole("tab", { name: "assignments", exact: true }).click();
    await member.getByText(assignmentTitle, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    await member.getByRole("button", { name: "Start assignment →", exact: true }).click();
    const assignmentInput = member.getByLabel(/Type here/i);
    await assignmentInput.click();
    await assignmentInput.pressSequentially("the quick brown fox jumps over the lazy dog ", { delay: 100 });
    try {
      await member.getByText(/COMPLETED · score /).waitFor({ state: "visible", timeout: 45_000 });
    } catch (error) {
      const alerts = await member.locator('[role="alert"]').allInnerTexts();
      report.operations.push(`assignment completion alert: ${safeMessage(alerts.join(" | ") || "none")}`);
      throw error;
    }
    const completedText = await member.getByText(/COMPLETED · score /).innerText();
    assertCheck("Assignment completion displays a server-derived score", /COMPLETED · score \d+(?:\.\d+)?/.test(completedText));
    report.operations.push("Team assignment completed from a real timed exercise");

    await owner.goto(`${baseUrl}/teams`, { waitUntil: "domcontentloaded" });
    await waitTeamList(owner);
    await teamRow(owner, teamName).getByRole("button", { name: "Open", exact: true }).click();
    await owner.getByRole("tab", { name: "results", exact: true }).click();
    await owner.getByText("1/2 complete", { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    pass("Owner dashboard aggregates the member completion");

    recoveryContext = await newContext();
    recovery = await newPage(recoveryContext, new URL(managementLink).pathname + new URL(managementLink).search + new URL(managementLink).hash);
    try {
      await recovery.getByText(teamName, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    } catch (error) {
      const alerts = await recovery.locator('[role="alert"]').allInnerTexts();
      report.operations.push(`team recovery error: ${safeMessage(alerts.join(" | ") || error.message)}`);
      throw error;
    }
    pass("Clean session recovers the exact Team resource by management link");
    const recoveryRow = teamRow(recovery, teamName);
    await recoveryRow.getByText("Settings", { exact: true }).click();
    const rotatedLink = await readManagementLink(recovery, "Copy management link");
    assertCheck("Management-link rotation issues a fresh capability", rotatedLink !== managementLink);
    await acceptNextDialog(recovery);
    await recoveryRow.getByRole("button", { name: "Revoke links", exact: true }).click();
    await recovery.getByText(/Keep this management link private:/).waitFor({ state: "hidden", timeout: 10_000 });
    pass("Rotated Team management link is revocable");
    await acceptNextDialog(recovery);
    await recoveryRow.getByRole("button", { name: "Delete team", exact: true }).click();
    await recovery.getByText(teamName, { exact: true }).waitFor({ state: "hidden", timeout: 20_000 });
    teamCreated = false;
    pass("Disposable Team and assignment data are deleted after the live round-trip");
    report.operations.push("Team management capability rotated, revoked, and resource deleted");
  } finally {
    if (teamCreated) {
      await deleteTeamIfVisible(recovery, teamName);
      await deleteTeamIfVisible(owner, teamName);
      await deleteTeamIfVisible(member, teamName);
    }
  }
}

async function assessmentRoundTrip() {
  const assessmentTitle = `Release smoke assessment ${Date.now().toString(36)}`;
  const creatorContext = await newContext();
  const creator = await newPage(creatorContext, "/assessments");
  let managementLink = null;
  let inviteCode = null;
  let recoveryContext;
  let recovery;
  try {
    const titleInput = creator.getByLabel("assessment title");
    await titleInput.fill(assessmentTitle);
    const moduleChecks = creator.locator('fieldset input[type="checkbox"]');
    await moduleChecks.nth(0).uncheck();
    await creator.getByRole("button", { name: "Create + generate invite link", exact: true }).click();
    await creator.getByText(assessmentTitle, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    const row = creator.getByText(assessmentTitle, { exact: true }).locator("..");
    inviteCode = (await row.locator("code").innerText()).trim();
    assertCheck("Assessment create returns an invite code", /^[A-Z0-9]{6,16}$/.test(inviteCode));
    managementLink = await readRenderedManagementLink(creator);
    pass("Assessment create issues a management capability");

    const candidateContext = await newContext();
    const candidate = await newPage(candidateContext, `/assessments?invite=${encodeURIComponent(inviteCode)}`);
    await candidate.getByRole("heading", { name: assessmentTitle, exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    await candidate.getByText("1", { exact: true }).first().waitFor({ state: "visible" });
    pass("Candidate resolves the saved non-default module sequence");
    await candidate.getByRole("button", { name: "Begin assessment →", exact: true }).click();
    const candidateInput = candidate.getByLabel(/Type here/i);
    await candidateInput.click();
    await candidateInput.pressSequentially("1234567890 1234567890 ", { delay: 120 });
    await candidate.getByRole("heading", { name: /Assessment complete/i }).waitFor({ state: "visible", timeout: 45_000 });
    pass("Candidate completes and submits the assessment through the public invite");

    await creator.getByRole("button", { name: "Results →", exact: true }).click();
    await creator.getByRole("heading", { name: "Candidate summaries", exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    await creator.locator("ul li").first().waitFor({ state: "visible", timeout: 20_000 });
    assertCheck("Only the organizer sees the candidate summary", (await creator.locator("ul li").count()) === 1);
    report.operations.push("Assessment candidate submission appeared only in organizer summaries");

    recoveryContext = await newContext();
    recovery = await newPage(recoveryContext, new URL(managementLink).pathname + new URL(managementLink).search + new URL(managementLink).hash);
    await recovery.getByText(assessmentTitle, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    pass("Clean session recovers the exact Assessment resource by management link");
    const recoveryRow = recovery.getByText(assessmentTitle, { exact: true }).locator("..");
    const rotatedLink = await readManagementLink(recovery, "Copy management link");
    assertCheck("Assessment management-link rotation issues a fresh capability", rotatedLink !== managementLink);
    await acceptNextDialog(recovery);
    await recoveryRow.getByRole("button", { name: "Revoke management links", exact: true }).click();
    await recovery.getByText(/Keep this management link private:/).waitFor({ state: "hidden", timeout: 10_000 });
    pass("Assessment management capability is revocable");
    await acceptNextDialog(recovery);
    await recoveryRow.getByRole("button", { name: "Revoke", exact: true }).click();
    await recovery.getByText("revoked", { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    const revokedCandidateContext = await newContext();
    const revokedCandidate = await newPage(revokedCandidateContext, `/assessments?invite=${encodeURIComponent(inviteCode)}`);
    await revokedCandidate.getByRole("heading", { name: /Invite revoked|Invite invalid/i }).waitFor({ state: "visible", timeout: 20_000 });
    assertCheck("Revoked assessment invite fails closed", (await revokedCandidate.getByText(/modules/i).count()) === 0);
    pass("Assessment invite revocation is visible to candidates");

    await recovery.goto(`${baseUrl}/progress`, { waitUntil: "domcontentloaded" });
    await recovery.getByRole("button", { name: "Delete shared data", exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    await acceptNextDialog(recovery);
    await recovery.getByRole("button", { name: "Delete shared data", exact: true }).click();
    try {
      await recovery.getByText(/Shared data deleted from this device identity/i).waitFor({ state: "visible", timeout: 20_000 });
    } catch (error) {
      const statuses = await recovery.locator('[role="status"]').allInnerTexts();
      const alerts = await recovery.locator('[role="alert"]').allInnerTexts();
      report.operations.push(`shared deletion result: ${safeMessage([...statuses, ...alerts, error.message].join(" | "))}`);
      throw error;
    }
    pass("Organizer privacy deletion removes the disposable shared Assessment data");
    const postDeleteContext = await newContext();
    const postDeleteCandidate = await newPage(postDeleteContext, `/assessments?invite=${encodeURIComponent(inviteCode)}`);
    await postDeleteCandidate.getByRole("heading", { name: /Invite invalid|Invite revoked/i }).waitFor({ state: "visible", timeout: 20_000 });
    pass("Deleted Assessment invite no longer resolves");
    report.operations.push("Assessment invite revoked and shared organizer data deleted");
  } finally {
    // The organizer privacy deletion above is the cleanup path. No direct
    // database access is used if a UI step fails.
  }
}

const browser = await chromium.launch();
try {
  await localPractice();
  await teamRoundTrip();
  await assessmentRoundTrip();
  assertCheck("Live backend flow has no uncaught page errors", report.pageErrors.length === 0, `${report.pageErrors.length} page error(s)`);
  assertCheck("Live backend flow has no unexpected console errors", report.consoleErrors.length === 0, `${report.consoleErrors.length} console error(s)`);
} finally {
  for (const context of contexts) await context.close();
  await browser.close();
  await fs.writeFile(`${outputDir}/live-backend-report.json`, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`live backend checks: ${report.checks.filter((item) => item.passed).length} passed`);
console.log(`live backend operations: ${report.operations.length}`);
console.log(`page errors: ${report.pageErrors.length}; console errors: ${report.consoleErrors.length}`);
console.log(`backend error responses: ${report.backendErrors.length}`);
