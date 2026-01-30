import { defineConfig } from '@playwright/test';
import { FrameworkConfig } from '../../src';

// Initialize framework configuration for API testing
FrameworkConfig.initialize({
  environment: 'local',
  baseUrl: 'https://petstore.swagger.io/v2',
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
    apiRequest: 3,
    ftpOperation: 2,
    retryDelay: 1000,
  },
  api: {
    baseUrl: 'https://petstore.swagger.io/v2',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    enableLogging: true,
    validateSsl: true,
  },
  logging: {
    level: 'info',
    console: true,
    file: true,
    filePath: './logs/petstore-api.log',
    timestamps: true,
    stackTraces: true,
  },
  screenshotsDir: './test-results/screenshots',
  videosDir: './test-results/videos',
  reportsDir: './test-results/reports',
});

export default defineConfig({
  testDir: './specs',
  fullyParallel: false, // API tests might have dependencies
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Sequential execution for API tests
  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/html-report' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    // No browser needed for API tests
  },
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: './test-results',
});
