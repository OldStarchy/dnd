import react from "@vitejs/plugin-react";
import { playwright } from "vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          include: ["src/**/*.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
              { browser: "chromium" },
              //webkit only works in headless mode
              { browser: "webkit" },
            ],
          },
        },
      },
    ],
  },
});
