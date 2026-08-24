import { defineConfig, devices } from "@playwright/test";

// E2E smoke suite. Requires a production export first: `npm run build`
// (the config serves out/ via scripts/serve-static.mjs on :4173).
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node scripts/serve-static.mjs",
    url: "http://localhost:4173/",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
