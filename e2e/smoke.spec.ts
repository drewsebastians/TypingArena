import { expect, test } from "@playwright/test";

// Core user flows against the production static export.
// Shared-competition features degrade honestly in this environment because no
// backend is configured — those degradations are asserted too.

test.describe("typing tests — timed semantics", () => {
  const WORDS = "the quick brown fox jumps over the lazy dog ".repeat(25);

  test("goal-first home exposes six goals and a real first workspace", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /what do you want to improve today/i })).toBeVisible();
    await expect(page.locator("[data-goal-id]")).toHaveCount(6);
    await expect(page.getByLabel(/Type here/)).toBeVisible();
    await page.locator('[data-goal-id="listen-better"]').click();
    await expect(page.locator("audio")).toHaveCount(1);
    await page.locator('[data-goal-id="transcribe-accurately"]').click();
    await expect(page.getByRole("button", { name: /play clip/i })).toBeVisible();
  });

  for (const duration of [15, 30]) {
    test(`${duration}s sprint runs the full clock and produces a result`, async ({ page }) => {
      await page.goto(`/typing-test?duration=${duration}`);
      const input = page.getByLabel(/Type here/);
      await input.click();
      // Type steadily; passages must keep flowing until the full clock.
      const start = Date.now();
      await input.pressSequentially(WORDS, { delay: Math.max(1, (duration * 1000 - 1500) / WORDS.length) });
      await expect(page.getByRole("heading", { name: /your result/i })).toBeVisible({ timeout: 20_000 });
      const elapsedWall = Date.now() - start;
      expect(elapsedWall).toBeGreaterThanOrEqual(duration * 1000 - 2500);
    });
  }

  test("5-minute mode is offered and starts its endurance clock", async ({ page }) => {
    await page.goto("/typing-test");
    await page.getByRole("group", { name: "test duration" }).getByText("5 min").click();
    const input = page.getByLabel(/Type here/);
    await input.click();
    await input.pressSequentially("hello world ", { delay: 20 });
    await expect(page.getByText("300s", { exact: true })).toBeVisible(); // full 300s on the HUD
  });

  test("accuracy does not penalize untouched future text", async ({ page }) => {
    await page.goto("/typing-test?duration=15");
    const input = page.getByLabel(/Type here/);
    await input.click();
    // Type the FIRST characters of whatever passage was issued (deterministic
    // per exerciseId) so they are all correct by construction.
    const passage = (await page.locator("p[aria-hidden=true]").textContent()) ?? "";
    await input.pressSequentially(passage.slice(0, 4), { delay: 80 });
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
  });

  test("paste is blocked inside the active area", async ({ page }) => {
    await page.goto("/typing-test?duration=15");
    await page.getByRole("group", { name: "test duration" }).waitFor();
    const input = page.getByLabel(/Type here/);
    await input.click();
    await input.pressSequentially("abc", { delay: 10 });
    await input.evaluate((el) => {
      el.dispatchEvent(
        new ClipboardEvent("paste", { bubbles: true, cancelable: true }),
      );
    });
    await expect(page.getByText(/paste blocked/i)).toBeVisible();
  });

  test("ads disappear as soon as a timed task becomes active", async ({ page }) => {
    await page.goto("/typing-test?duration=15");
    const input = page.getByLabel(/Type here/);
    await expect(page.locator('[data-ad-slot="typing-test"]')).toBeVisible();
    await input.pressSequentially("a", { delay: 10 });
    await expect(page.locator('[data-ad-slot="typing-test"]')).toHaveCount(0);
  });

  test("indonesian tool pages are localized", async ({ page }) => {
    await page.goto("/tes-mengetik");
    await expect(page.getByRole("heading", { name: /tes mengetik cepat/i })).toBeVisible();
  });
});

test.describe("audio modes — static assets", () => {
  test("dictation plays a real static audio file with controls", async ({ page }) => {
    await page.goto("/dictation/english");
    const audio = page.locator("audio");
    await expect(audio).toHaveCount(1);
    const src = await audio.getAttribute("src");
    expect(src).toMatch(/^\/audio\/dictation\/dict-en-\d+\.wav$/);
    await expect(audio).toHaveAttribute("preload", "metadata");

    // The file itself resolves.
    const resp = await page.request.get(src!);
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toContain("audio");
  });

  test("indonesian dictation uses an id clip", async ({ page }) => {
    await page.goto("/dictation/indonesian");
    const src = await page.locator("audio").getAttribute("src");
    expect(src).toMatch(/^\/audio\/dictation\/dict-id-/);
  });

  test("dictation ad boundary disappears while the audio task is active", async ({ page }) => {
    await page.goto("/dictation/english");
    await expect(page.locator('[data-ad-slot="dictation-en"]')).toBeVisible();
    await page.getByRole("button", { name: /play dictation audio/i }).click();
    await expect(page.locator('[data-ad-slot="dictation-en"]')).toHaveCount(0);
  });

  test("transcription offers multi-clip EN/ID workspace", async ({ page }) => {
    await page.goto("/transcription-practice");
    await expect(page.getByRole("heading", { name: /transcription sprint/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /play clip/i })).toBeVisible();
    await expect(page.locator("textarea")).toBeVisible();
    await page.getByRole("button", { name: "Bahasa Indonesia" }).click();
    const src = await page.locator("audio").getAttribute("src");
    expect(src).toMatch(/^\/audio\/transcription\/trans-id-/);
  });
});

test.describe("public route contract", () => {
  const routes = [
    "/",
    "/typing-test",
    "/typing-test/1-minute",
    "/typing-test/5-minute",
    "/typing-test/indonesian",
    "/tes-mengetik",
    "/data-entry-test",
    "/punctuation-typing-test",
    "/dictation",
    "/dictation/english",
    "/dictation/indonesian",
    "/noise-challenge",
    "/transcription-practice",
    "/transcription-library",
    "/career",
    "/daily-arena",
    "/leaderboard",
    "/seasons",
    "/friends",
    "/multiplayer",
    "/teams",
    "/custom",
    "/assessments",
    "/progress",
    "/privacy",
  ];

  test("every public route has a visible primary heading", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1").first(), route).toBeVisible();
    }
  });
});

test.describe("shared competition — honest degradation without backend", () => {
  test("daily arena renders today's challenge and an honest board state", async ({ page }) => {
    await page.goto("/daily-arena");
    await expect(page.getByRole("heading", { name: /challenge/i })).toBeVisible();
    // Either sign-in prompt or unconfigured notice — never fake rows.
    const notice = page.getByText(/shared board|sign in|backend/i);
    await expect(notice.first()).toBeVisible();
  });

  test("leaderboard shows setup notice instead of fabricated players", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByText(/backend/i).first()).toBeVisible();
    await expect(page.getByText("@typemaster")).toHaveCount(0);
    await expect(page.getByText("@sarah_t")).toHaveCount(0);
  });

  test("friend challenges require central storage and say so", async ({ page }) => {
    await page.goto("/friends");
    await expect(page.getByText(/cross-device challenges need the shared backend/i)).toBeVisible();
  });
});

test.describe("progress & privacy", () => {
  test("progress shows empty history honestly", async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/progress");
    await expect(page.getByText("0", { exact: true }).first()).toBeVisible();
  });

  test("robots disallows progress; sitemap excludes it", async ({ page }) => {
    const robots = await (await page.request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /progress");
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/progress</loc>");
    expect(sitemap).not.toContain("example.com");
  });

  test("privacy page documents data practices", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  });
});

test.describe("roadmap features — honest states without backend", () => {
  test("career mode lists all five tracks and is startable", async ({ page }) => {
    await page.goto("/career");
    await expect(page.getByRole("heading", { name: /career mode/i })).toBeVisible();
    for (const track of ["Data Entry", "Office / Admin", "Numbers & Codes", "Punctuation Precision", "Transcription"]) {
      // Track names are card headings — role-scoped so hidden mobile nav
      // links with the same text never shadow them.
      await expect(page.getByRole("heading", { name: track, exact: true }).first()).toBeVisible();
    }
    // Assessment runner starts with the standard typing engine.
    await page.getByRole("button", { name: /start assessment/i }).first().click();
    await expect(page.getByLabel(/Type here/)).toBeVisible();
  });

  test("seasons shows monthly ladder with archive list", async ({ page }) => {
    await page.goto("/seasons");
    await expect(page.getByRole("heading", { name: /ranked seasons/i })).toBeVisible();
    await expect(page.getByText(/live/).first()).toBeVisible(); // current season marker
  });

  test("multiplayer degrades honestly without backend", async ({ page }) => {
    await page.goto("/multiplayer");
    if (await page.getByText(/shared backend/i).count()) {
      await expect(page.getByText(/shared backend/i).first()).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: /create room/i })).toBeVisible();
    }
  });

  test("teams page explains requirements honestly", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByRole("heading", { name: /teams & classrooms|tim & kelas/i })).toBeVisible();
  });

  test("custom tests explain practice-only policy", async ({ page }) => {
    await page.goto("/custom");
    await expect(page.getByRole("heading", { name: /custom tests/i })).toBeVisible();
  });

  test("employer assessments page renders creator/notice", async ({ page }) => {
    await page.goto("/assessments");
    await expect(page.getByRole("heading", { name: /skills assessments/i })).toBeVisible();
  });

  test("transcription library lists filterable clips", async ({ page }) => {
    await page.goto("/transcription-library");
    await expect(page.getByRole("heading", { name: /transcription library/i })).toBeVisible();
    const cards = page.locator("main button.rounded-xl, main .grid > button");
    const before = await cards.count();
    expect(before).toBeGreaterThanOrEqual(4);
    await page.getByRole("button", { name: "Indonesia", exact: true }).click();
    const after = await cards.count();
    expect(after).toBeLessThanOrEqual(before);
    expect(after).toBeGreaterThanOrEqual(3);
  });
});

test.describe("keyboard accessibility sanity", () => {
  test("mobile navigation traps focus and restores it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile drawer behavior is covered by the mobile project");
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menu" });
    await menuButton.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(drawer).toContainText("Typing Test");
    expect(await page.locator("#mobile-drawer").evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("practice surfaces contain no legacy auth controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/sign\s*in|sign\s*up|log\s*in/i)).toHaveCount(0);
    await page.goto("/progress");
    await expect(page.getByText(/sign\s*in|sign\s*up|log\s*in/i)).toHaveCount(0);
  });

  test("320px shell has no horizontal overflow and keeps locale reactive", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const dimensions = await page.locator("html").evaluate((html) => ({
      clientWidth: html.clientWidth,
      scrollWidth: html.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    const menuBox = await page.getByRole("button", { name: "Menu" }).boundingBox();
    expect(menuBox?.width).toBeGreaterThanOrEqual(44);
    expect(menuBox?.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: /Switch to Indonesian/i }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
  });

  test("result CTAs are reachable by keyboard", async ({ page }) => {
    await page.goto("/typing-test?duration=15");
    const input = page.getByLabel(/Type here/);
    await input.click();
    const words = "the quick brown fox jumps over the lazy dog ".repeat(30);
    await input.pressSequentially(words, { delay: (14_000) / words.length });
    await expect(page.getByRole("heading", { name: /your result/i })).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Tab"); // focus moves into result actions
    const focused = page.evaluate(() => document.activeElement?.textContent ?? "");
    expect((await focused).length).toBeGreaterThan(0);
  });
});

