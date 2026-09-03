#!/usr/bin/env node
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://localhost:4173";
const outputDir = process.env.OUTPUT_DIR ?? "artifacts/journey-v4/follow-up";

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();

async function openPage(width, height, route) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("ta:analytics_consent", "denied");
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(350);
  return { context, page };
}

async function capture(name, route, width, height, setup) {
  const { context, page } = await openPage(width, height, route);
  try {
    if (setup) await setup(page);
    await page.screenshot({ path: `${outputDir}/${name}`, animations: "disabled" });
    console.log(`captured ${name}`);
  } finally {
    await context.close();
  }
}

async function captureActive(name, width, height) {
  await capture(name, "/", width, height, async (page) => {
    const input = page.getByLabel(/Type here/i);
    await input.click();
    await input.pressSequentially("the quick brown fox", { delay: 12 });
    await page.waitForTimeout(150);
  });
}

async function captureResult(name, width, height) {
  await capture(name, "/?duration=15", width, height, async (page) => {
    const input = page.getByLabel(/Type here/i);
    await input.click();
    await input.pressSequentially("the quick brown fox jumps over the lazy dog ", { delay: 4 });
    await page.locator("[data-typing-result]").waitFor({ state: "visible", timeout: 20_000 });
    await page.locator("[data-result-actions]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  });
}

try {
  await capture("home-initial-desktop-1440x900.png", "/", 1440, 900);
  await capture("home-initial-mobile-390x844.png", "/", 390, 844);
  await capture("home-initial-stress-320x568.png", "/", 320, 568);
  await captureActive("home-active-desktop-1440x900.png", 1440, 900);
  await captureActive("home-active-mobile-390x844.png", 390, 844);
  await captureResult("home-result-desktop-1440x900.png", 1440, 900);
  await captureResult("home-result-mobile-390x844.png", 390, 844);
  await captureResult("home-result-stress-320x568.png", 320, 568);
  await capture("navigation-practice-desktop-1440x900.png", "/typing-test", 1440, 900);
  await capture("navigation-practice-mobile-390x844.png", "/typing-test", 390, 844);
  await capture("navigation-stress-320x568.png", "/", 320, 568, async (page) => {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).waitFor({ state: "visible" });
  });
  await capture("dictation-desktop-1440x900.png", "/dictation/english", 1440, 900);
  await capture("dictation-mobile-390x844.png", "/dictation/english", 390, 844);
  await capture("transcription-library-desktop-1440x900.png", "/transcription-library", 1440, 900);
  await capture("transcription-library-mobile-390x844.png", "/transcription-library", 390, 844);
  await capture("transcription-desktop-1440x900.png", "/transcription-practice", 1440, 900);
  await capture("transcription-mobile-390x844.png", "/transcription-practice", 390, 844);
  await capture("career-desktop-1440x900.png", "/career", 1440, 900);
  await capture("career-mobile-390x844.png", "/career", 390, 844);
  await capture("daily-arena-desktop-1440x900.png", "/daily-arena", 1440, 900);
  await capture("daily-arena-mobile-390x844.png", "/daily-arena", 390, 844);
  await capture("leaderboard-desktop-1440x900.png", "/leaderboard", 1440, 900);
  await capture("leaderboard-mobile-390x844.png", "/leaderboard", 390, 844);
  await capture("teams-desktop-1440x900.png", "/teams", 1440, 900);
  await capture("teams-mobile-390x844.png", "/teams", 390, 844);
  await capture("teams-settings-equivalent-stress-320x568.png", "/teams", 320, 568);
  await capture("custom-tests-desktop-1440x900.png", "/custom", 1440, 900);
  await capture("custom-tests-mobile-390x844.png", "/custom", 390, 844);
  await capture("assessment-creator-desktop-1440x900.png", "/assessments", 1440, 900);
  await capture("assessment-candidate-invalid-mobile-390x844.png", "/assessments?invite=NOT-VALID", 390, 844);
  await capture("assessment-candidate-stress-320x568.png", "/assessments?invite=NOT-VALID", 320, 568);
  await capture("privacy-desktop-1440x900.png", "/privacy", 1440, 900);
  await capture("privacy-mobile-390x844.png", "/privacy", 390, 844);
} finally {
  await browser.close();
}
