import { defineConfig, devices } from '@playwright/test';
import { FrameworkConfig } from '../../src';

// Initialize framework configuration
FrameworkConfig.initialize({
  environment: 'local',
  baseUrl: 'https://www.saucedemo.com',
  timeouts: {
    default: 30000,
    navigation: 60000,
    element: 10000,
    api: 30000,
    ftp: 60000,
    assertion: 5000,
  },
  retries: {
    elementAction: 3,
    apiRequest: 2,
    ftpOperation: 2,
    retryDelay: 1000,
  },
  browser: {
    browserType: 'chromium',
    headless: true,
    slowMo: 0,
    viewportWidth: 1920,
    viewportHeight: 1080,
    recordVideo: false,
    screenshotOnFailure: true,
    traceOnFailure: true,
  },
  logging: {
    level: 'info',
    console: true,
    file: true,
    filePath: './logs/saucedemo.log',
    timestamps: true,
    stackTraces: true,
  },
  screenshotsDir: './test-results/screenshots',
  videosDir: './test-results/videos',
  reportsDir: './test-results/reports',
});

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/html-report' }],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: './test-results',
});
