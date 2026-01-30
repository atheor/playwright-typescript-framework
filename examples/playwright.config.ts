import { defineConfig, devices } from '@playwright/test';
import { FrameworkConfig } from '../src';

// Initialize framework configuration
FrameworkConfig.initialize({
  environment: (process.env.TEST_ENV as 'local' | 'dev' | 'staging' | 'prod') ?? 'local',
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
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
  api: {
    baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000/api',
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    enableLogging: true,
    validateSsl: false,
  },
  logging: {
    level: 'info',
    console: true,
    file: true,
    filePath: './logs/test.log',
    timestamps: true,
    stackTraces: true,
  },
  actionLogging: true,
  screenshotsDir: './test-results/screenshots',
  videosDir: './test-results/videos',
  reportsDir: './test-results/reports',
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/html-report' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    baseURL: FrameworkConfig.getConfig().baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // API tests only (no browser)
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        // No browser needed for API tests
      },
    },
  ],
  outputDir: './test-results',
});
