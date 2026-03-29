import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  use: { ...devices['Desktop Chrome'] }
});
