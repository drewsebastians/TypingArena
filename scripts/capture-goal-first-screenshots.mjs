#!/usr/bin/env node
import fs from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://localhost:4173";
const targets = [
  ["home-desktop-1440x900.png", "/", 1440, 900],
  ["home-desktop-1280x800.png", "/", 1280, 800],
  ["home-tablet-768x1024.png", "/", 768, 1024],
  ["home-mobile-390x844.png", "/", 390, 844],
  ["home-mobile-375x667.png", "/", 375, 667],
  ["home-stress-320x568.png", "/", 320, 568],
  ["typing-desktop-1440x900.png", "/typing-test", 1440, 900],
  ["typing-mobile-390x844.png", "/typing-test", 390, 844],
  ["dictation-desktop-1440x900.png", "/dictation", 1440, 900],
  ["dictation-mobile-390x844.png", "/dictation", 390, 844],
  ["transcription-desktop-1440x900.png", "/transcription-practice", 1440, 900],
  ["transcription-mobile-390x844.png", "/transcription-practice", 390, 844],
  ["progress-desktop-1440x900.png", "/progress", 1440, 900],
  ["progress-mobile-390x844.png", "/progress", 390, 844],
  ["daily-desktop-1440x900.png", "/daily-arena", 1440, 900],
  ["teams-desktop-1440x900.png", "/teams", 1440, 900],
  ["assessments-desktop-1440x900.png", "/assessments", 1440, 900],
];

const outputDir = "artifacts/goal-first/wave1/after";
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, route, width, height] of targets) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => localStorage.setItem("ta:analytics_consent", "denied"));
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outputDir}/${name}` });
    await context.close();
    console.log(`captured ${name}`);
  }
} finally {
  await browser.close();
}
