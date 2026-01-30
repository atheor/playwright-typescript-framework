/**
 * Framework Fixtures
 * Custom Playwright fixtures for dependency injection
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { FrameworkConfig } from '../config';
import { ApiClient, createApiClient } from '../../api/clients/api-client';
import { GraphQLClient, createGraphQLClient } from '../../api/clients/graphql-client';
import { FtpClient, createFtpClient } from '../../protocols/ftp/ftp-client';
import { TestDataBuilder, testData } from '../../utils/test-data-builder';
import { Logger } from '../../utils/logger';
import { UIActions, createUIActions } from '../../ui/actions/ui-actions';

/**
 * Custom fixture types
 */
export interface FrameworkFixtures {
  /** API client for REST requests */
  apiClient: ApiClient;
  /** GraphQL client */
  graphqlClient: GraphQLClient;
  /** FTP client */
  ftpClient: FtpClient;
  /** Test data builder */
  testData: TestDataBuilder;
  /** Logger instance */
  logger: Logger;
  /** UI Actions helper */
  uiActions: UIActions;
  /** Authenticated API client */
  authenticatedApiClient: ApiClient;
}

/**
 * Worker-scoped fixtures (shared across tests in a worker)
 */
export interface WorkerFixtures {
  /** Shared API client per worker */
  sharedApiClient: ApiClient;
}

/**
 * Create base test with framework fixtures
 */
export const test = base.extend<FrameworkFixtures, WorkerFixtures>({
  // API Client fixture
  apiClient: async ({}, use: (r: ApiClient) => Promise<void>) => {
    const client = createApiClient();
    await client.initialize();
    await use(client);
    await client.dispose();
  },

  // GraphQL Client fixture
  graphqlClient: async ({}, use: (r: GraphQLClient) => Promise<void>) => {
    const client = createGraphQLClient();
    await client.initialize();
    await use(client);
    await client.dispose();
  },

  // FTP Client fixture
  ftpClient: async ({}, use) => {
    const client = createFtpClient();
    await use(client);
    // Cleanup: disconnect after test
    await client.disconnect();
  },

  // Test Data Builder fixture
  testData: async ({}, use) => {
    await use(testData);
  },

  // Logger fixture
  logger: async ({}, use) => {
    const loggerInstance = Logger.getInstance();
    await use(loggerInstance);
  },

  // UI Actions fixture
  uiActions: async ({ page }, use) => {
    const actions = createUIActions(page);
    await use(actions);
  },

  // Authenticated API Client fixture
  authenticatedApiClient: async ({}, use: (r: ApiClient) => Promise<void>) => {
    const client = createApiClient();
    await client.initialize();
    // Override in test project to add authentication
    await use(client);
    await client.dispose();
  },

  // Worker-scoped shared API client
  sharedApiClient: [
    async ({}, use: (r: ApiClient) => Promise<void>) => {
      const client = createApiClient();
      await client.initialize();
      await use(client);
      await client.dispose();
    },
    { scope: 'worker' },
  ],
});

/**
 * Export expect from base test
 */
export { expect } from '@playwright/test';

/**
 * Fixture factory types for extending in test projects
 */
export type PageFixtureFactory<T> = (page: Page) => T;
export type ApiFixtureFactory<T> = (client: ApiClient) => T;
export type ContextFixtureFactory<T> = (context: BrowserContext) => T;

/**
 * Helper to create page object fixture
 */
export function createPageFixture<T>(
  factory: PageFixtureFactory<T>
): (args: { page: Page }) => Promise<T> {
  return async ({ page }) => factory(page);
}

/**
 * Helper to create workflow fixture
 */
export function createWorkflowFixture<T>(
  factory: (page: Page, apiClient: ApiClient) => T
): (args: { page: Page; apiClient: ApiClient }) => Promise<T> {
  return async ({ page, apiClient }) => factory(page, apiClient);
}

/**
 * Hook for before each test
 */
export function beforeEachHook(
  callback: (args: { page: Page; context: BrowserContext }) => Promise<void>
): void {
  test.beforeEach(callback);
}

/**
 * Hook for after each test
 */
export function afterEachHook(
  callback: (args: { page: Page; context: BrowserContext }) => Promise<void>
): void {
  test.afterEach(callback);
}

/**
 * Test with screenshot on failure
 */
export const testWithScreenshot = test.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);
    
    // Take screenshot on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `${FrameworkConfig.getConfig().screenshotsDir}/failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({
        name: 'failure-screenshot',
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  },
});

/**
 * Test with video recording
 */
export const testWithVideo = test.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      recordVideo: {
        dir: FrameworkConfig.getConfig().videosDir,
      },
    });
    await use(context);
    await context.close();
  },
});

/**
 * Test with tracing
 */
export const testWithTracing = test.extend({
  context: async ({ browser }, use, testInfo) => {
    const context = await browser.newContext();
    
    // Start tracing
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
    
    await use(context);
    
    // Save trace on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      const tracePath = `${FrameworkConfig.getConfig().reportsDir}/trace-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.zip`;
      await context.tracing.stop({ path: tracePath });
      testInfo.attachments.push({
        name: 'trace',
        path: tracePath,
        contentType: 'application/zip',
      });
    } else {
      await context.tracing.stop();
    }
    
    await context.close();
  },
});
