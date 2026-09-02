import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 568 },
] as const;

const REPRESENTATIVE_ROUTES = [
  "/",
  "/typing-test",
  "/dictation/english",
  "/transcription-practice",
  "/noise-challenge",
  "/career",
  "/daily-arena",
  "/friends",
  "/teams",
  "/custom",
  "/assessments",
  "/progress",
  "/privacy",
] as const;

test.describe("PR4 independent responsive and accessibility review", () => {
  test("representative route families fit every required viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "The matrix runs once to avoid duplicate viewport evidence");

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const route of REPRESENTATIVE_ROUTES) {
        await page.goto(route);
        await expect(page.locator("main h1").first(), `${viewport.width}x${viewport.height} ${route}`).toBeVisible();
        const dimensions = await page.locator("html").evaluate((html) => ({
          clientWidth: html.clientWidth,
          scrollWidth: html.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        }));
        expect(dimensions.scrollWidth, `${route} html overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(dimensions.clientWidth);
        expect(dimensions.bodyScrollWidth, `${route} body overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(dimensions.clientWidth);
      }
    }
  });

  test("query-bearing utility states are noindex", async ({ page }) => {
    await page.goto("/typing-test?duration=15");
    await expect(page.locator('meta[data-query-state-robots="true"]')).toHaveAttribute("content", "noindex,nofollow");
  });

  test("EN/ID switch updates visible copy and the document language", async ({ page }) => {
    await page.goto("/daily-arena");
    await page.getByRole("button", { name: /switch to indonesian/i }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page.getByRole("heading", { name: /tantangan/i }).first()).toBeVisible();
    await expect(page.getByText(/Satu tantangan standar/i)).toBeVisible();
  });

  test("reduced motion media preference disables changed transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const rulePresent = await page.evaluate(() => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let cssText = "";
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          cssText += Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
        } catch {
          // Cross-origin stylesheets are not expected in the static export.
        }
      }
      return media && cssText.includes("transition-duration: 0.01ms") && cssText.includes("animation-duration: 0.01ms");
    });
    expect(rulePresent).toBe(true);
  });

  test("keyboard reaches desktop navigation, workspace disclosures, and filters", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop control evidence runs once in the desktop project");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const firstDesktopMenu = page.locator('nav[aria-label="Primary"] button').first();
    await firstDesktopMenu.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu").first()).toBeVisible();
    await expect(page.getByRole("menu").first()).toContainText("Typing Test");

    const disclosure = page.locator("details").first();
    await disclosure.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(disclosure.locator("p")).toBeVisible();

    await page.goto("/transcription-library");
    const indonesiaFilter = page.getByRole("button", { name: "Indonesia", exact: true });
    await indonesiaFilter.focus();
    await page.keyboard.press("Enter");
    await expect(indonesiaFilter).toHaveAttribute("aria-pressed", "true");
  });

  test("active practice suppresses route-level ads for typing and audio modes", async ({ page }) => {
    await page.goto("/typing-test?duration=15");
    await expect(page.locator('[data-ad-slot="typing-test"]')).toBeVisible();
    await page.getByLabel(/type here/i).pressSequentially("a");
    await expect(page.locator('[data-ad-slot="typing-test"]')).toHaveCount(0);

    await page.goto("/dictation/english");
    await expect(page.locator('[data-ad-slot="dictation-en"]')).toBeVisible();
    await page.getByRole("button", { name: /play dictation audio/i }).click();
    await expect(page.locator('[data-ad-slot="dictation-en"]')).toHaveCount(0);

    await page.goto("/transcription-practice");
    await expect(page.locator('[data-ad-slot="transcription"]')).toBeVisible();
    await page.getByRole("button", { name: /play clip/i }).click();
    await expect(page.locator('[data-ad-slot="transcription"]')).toHaveCount(0);

    await page.goto("/noise-challenge");
    await expect(page.locator('[data-ad-slot="noise-challenge"]')).toBeVisible();
    await page.getByRole("button", { name: /play dictation audio/i }).click();
    await expect(page.locator('[data-ad-slot="noise-challenge"]')).toHaveCount(0);

    await page.goto("/daily-arena");
    await expect(page.locator('[data-ad-slot="daily-arena"]')).toBeVisible();
    await page.getByLabel(/type here/i).pressSequentially("a");
    await expect(page.locator('[data-ad-slot="daily-arena"]')).toHaveCount(0);
  });

  test("mobile drawer locks scroll, wraps focus, closes from backdrop, and restores focus", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Drawer evidence runs in the mobile project");
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menu" });
    await menuButton.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    const closeButton = page.getByRole("button", { name: "Close navigation menu" });
    await expect(drawer).toBeVisible();
    await expect(closeButton).toBeFocused();
    expect(await page.locator("body").evaluate((body) => body.style.overflow)).toBe("hidden");

    const focusables = drawer.locator("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])");
    const first = focusables.first();
    const last = focusables.last();
    await last.focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();

    await page.getByRole("button", { name: "Close menu backdrop" }).click({ position: { x: 4, y: 4 } });
    await expect(drawer).toBeHidden();
    await expect(menuButton).toBeFocused();
    expect(await page.locator("body").evaluate((body) => body.style.overflow)).toBe("");
  });
});
