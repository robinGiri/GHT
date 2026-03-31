import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5174",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "mobile-chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        userAgent:
          "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
  ],
});
