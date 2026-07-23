const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/browser",
  timeout: 15_000,
  expect: {
    timeout: 6_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "line",
  use: {
    baseURL: "http://127.0.0.1:4000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bundle exec jekyll serve --no-watch --host 127.0.0.1 --port 4000",
    url: "http://127.0.0.1:4000",
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      JEKYLL_ENV: "production",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
