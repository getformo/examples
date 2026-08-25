import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./harness-server.ts",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // Synpress's page fixture navigates to "/" before a test body runs, so the
    // harness must already be served here. globalSetup starts it.
    baseURL: `http://127.0.0.1:${process.env.HARNESS_PORT || 8766}`,
    // Chrome 130 requires headed mode for extension notification windows. CI
    // supplies an isolated virtual display with xvfb-run.
    headless: false,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
});
