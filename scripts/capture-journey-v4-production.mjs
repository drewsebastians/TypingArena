#!/usr/bin/env node
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = (process.env.BASE_URL ?? "https://typingarena.click").replace(/\/$/, "");
const outputDir = process.env.OUTPUT_DIR ?? "artifacts/journey-v4/production";

await fs.mkdir(outputDir, { recursive: true });

const report = {
  baseUrl,
  capturedAt: new Date().toISOString(),
  screenshots: [],
  checks: [],
  providerRequestsBeforeConsent: [],
  providerRequestsAfterConsent: [],
  pageErrors: [],
  expectedConsoleErrors: [],
  consoleErrors: [],
};

function check(name, passed, detail = "") {
  report.checks.push({ name, passed, detail });
  if (!passed) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
}

function providerHost(url) {
  try {
    const host = new URL(url).hostname;
    return /posthog|google-analytics|googletagmanager|doubleclick|adsbygoogle/i.test(host) ? host : null;
  } catch {
    return null;
  }
}

async function openPage(width, height, { consent = "denied", route = "/" } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript((choice) => {
    if (choice === "fresh") localStorage.removeItem("ta:analytics_consent");
    if (choice === "denied") localStorage.setItem("ta:analytics_consent", "denied");
  }, consent);
  const page = await context.newPage();
  page.on("pageerror", (error) => report.pageErrors.push({ route, message: error.message.slice(0, 240) }));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const detail = { route, message: message.text().slice(0, 240) };
    if (route.startsWith("/assessments?invite=NOT-VALID") && /status of 400/i.test(message.text())) report.expectedConsoleErrors.push(detail);
    else report.consoleErrors.push(detail);
  });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  return { context, page };
}

async function capture(name, route, width, height, setup, consent = "denied") {
  const { context, page } = await openPage(width, height, { consent, route });
  try {
    if (setup) await setup(page);
    await page.screenshot({ path: `${outputDir}/${name}`, animations: "disabled" });
    report.screenshots.push({ name, route, width, height });
  } finally {
    await context.close();
  }
}

async function assertHome(page) {
  await page.getByRole("heading", { name: /Type what you see or hear/i }).waitFor({ state: "visible" });
  check("Home real typing workspace visible", await page.locator("[data-home-workspace]").isVisible());
  check("Home has no goal gate", (await page.locator("[data-goal-id]").count()) === 0);
  check("Home workspace embeds no audio engine", (await page.locator("[data-home-workspace] audio").count()) === 0);
  check("Home workspace has a real input", (await page.getByLabel(/Type here/i).count()) === 1);
}

async function captureHomeInitial(name, width, height) {
  await capture(name, "/", width, height, assertHome);
}

async function captureHomeResult() {
  const { context, page } = await openPage(1440, 900, { consent: "denied", route: "/?duration=15" });
  try {
    await assertHome(page);
    const input = page.getByLabel(/Type here/i);
    await input.click();
    await input.pressSequentially("the quick brown fox jumps over the lazy dog ", { delay: 4 });
    await page.locator("[data-typing-result]").waitFor({ state: "visible", timeout: 20_000 });
    check("Result has one primary continuation", (await page.locator("[data-primary-continuation]").count()) === 1);
    check("Result has one secondary continuation", (await page.locator("[data-secondary-continuation]").count()) === 1);
    check("Result removes duplicate next-step card", (await page.locator("[data-next-step]").count()) === 0);
    await page.locator("[data-result-actions]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outputDir}/home-result-desktop-1440x900.png`, animations: "disabled" });
    report.screenshots.push({ name: "home-result-desktop-1440x900.png", route: "/?duration=15", width: 1440, height: 900 });
  } finally {
    await context.close();
  }
}

async function auditActiveTaskAdBoundary() {
  const { context, page } = await openPage(1440, 900, { consent: "denied", route: "/typing-test?duration=15" });
  try {
    const input = page.getByLabel(/Type here/i);
    await page.locator('[data-ad-slot="typing-test"]').waitFor({ state: "visible", timeout: 10_000 });
    check("Typing ad slot is available before the task starts", await page.locator('[data-ad-slot="typing-test"]').isVisible());
    await input.click();
    await input.pressSequentially("a", { delay: 10 });
    await page.locator('[data-ad-slot="typing-test"]').waitFor({ state: "hidden", timeout: 10_000 });
    check("Typing ad slot disappears while the task is active", (await page.locator('[data-ad-slot="typing-test"]').count()) === 0);
  } finally {
    await context.close();
  }
}

async function consentAudit() {
  const providerRequests = [];
  const { context, page } = await openPage(1440, 900, { consent: "fresh", route: "/privacy" });
  page.on("request", (request) => {
    const host = providerHost(request.url());
    if (host) providerRequests.push(host);
  });
  try {
    await page.getByRole("heading", { name: /Privacy/i }).waitFor({ state: "visible" });
    const banner = page.getByRole("dialog", { name: "Analytics privacy choice" });
    await banner.waitFor({ state: "visible" });
    report.providerRequestsBeforeConsent = [...new Set(providerRequests)];
    check("Consent banner appears on a fresh visit", await banner.isVisible());
    check("No analytics/ad provider loads before consent", report.providerRequestsBeforeConsent.length === 0, report.providerRequestsBeforeConsent.join(", "));
    await page.screenshot({ path: `${outputDir}/privacy-consent-desktop-1440x900.png`, animations: "disabled" });
    report.screenshots.push({ name: "privacy-consent-desktop-1440x900.png", route: "/privacy", width: 1440, height: 900 });
    await banner.getByRole("button", { name: "Allow" }).click();
    await page.waitForTimeout(700);
    report.providerRequestsAfterConsent = [...new Set(providerRequests)];
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch();
try {
  await captureHomeInitial("home-initial-desktop-1440x900.png", 1440, 900);
  await captureHomeInitial("home-initial-mobile-390x844.png", 390, 844);
  await captureHomeInitial("home-initial-stress-320x568.png", 320, 568);
  await captureHomeResult();
  await auditActiveTaskAdBoundary();
  await capture("daily-arena-desktop-1440x900.png", "/daily-arena", 1440, 900, async (page) => {
    await page.getByRole("heading", { name: /Challenge/i }).waitFor({ state: "visible" });
  });
  await capture("progress-desktop-1440x900.png", "/progress", 1440, 900, async (page) => {
    await page.getByRole("heading", { name: /Progress/i }).waitFor({ state: "visible" });
  });
  await capture("teams-desktop-1440x900.png", "/teams", 1440, 900, async (page) => {
    await page.getByRole("heading", { name: /Teams/i }).waitFor({ state: "visible" });
  });
  await capture("assessment-candidate-invalid-mobile-390x844.png", "/assessments?invite=NOT-VALID", 390, 844, async (page) => {
    await page.getByRole("heading", { name: /Invite invalid|Invite expired|Invite revoked/i }).waitFor({ state: "visible", timeout: 10_000 });
    check("Invalid candidate invite fails closed", (await page.getByText(/modules/i).count()) === 0);
  });
  await consentAudit();
  check("No uncaught production page errors", report.pageErrors.length === 0, `${report.pageErrors.length} page errors`);
  check("No production console errors", report.consoleErrors.length === 0, `${report.consoleErrors.length} console errors`);
} finally {
  await browser.close();
  await fs.writeFile(`${outputDir}/browser-report.json`, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`production browser evidence: ${report.screenshots.length} screenshots`);
console.log(`browser checks: ${report.checks.filter((item) => item.passed).length} passed`);
console.log(`provider requests before consent: ${report.providerRequestsBeforeConsent.join(", ") || "none"}`);
console.log(`provider requests after consent: ${report.providerRequestsAfterConsent.join(", ") || "none/optional keys absent"}`);
console.log(`expected invalid-invite console responses: ${report.expectedConsoleErrors.length}`);
