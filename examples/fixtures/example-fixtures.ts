/**
 * Example Fixtures
 * Extends framework fixtures with project-specific fixtures
 */

import { Page } from '@playwright/test';
import { test as base, ApiClient, createApiClient } from '../../src';
import {
  LoginWorkflow,
  ProductSearchWorkflow,
  CheckoutWorkflow,
  ApiIntegrationWorkflow,
} from '../workflows/example-workflows';
import {
  LoginPage,
  HomePage,
  ProductListPage,
  CheckoutPage,
  OrderConfirmationPage,
} from '../pages/example-pages';

/**
 * Extended fixtures for the test project
 */
interface TestFixtures {
  // Workflows
  loginWorkflow: LoginWorkflow;
  productSearchWorkflow: ProductSearchWorkflow;
  checkoutWorkflow: CheckoutWorkflow;
  apiIntegrationWorkflow: ApiIntegrationWorkflow;

  // Pages
  loginPage: LoginPage;
  homePage: HomePage;
  productListPage: ProductListPage;
  checkoutPage: CheckoutPage;
  confirmationPage: OrderConfirmationPage;

  // Authenticated state
  authenticatedPage: Page;
}

/**
 * Worker fixtures
 */
interface WorkerFixtures {
  adminApiClient: ApiClient;
}

/**
 * Test instance with all fixtures
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Workflow fixtures
  loginWorkflow: async ({ page }, use) => {
    const workflow = new LoginWorkflow(page);
    await use(workflow);
  },

  productSearchWorkflow: async ({ page }, use) => {
    const workflow = new ProductSearchWorkflow(page);
    await use(workflow);
  },

  checkoutWorkflow: async ({ page }, use) => {
    const workflow = new CheckoutWorkflow(page);
    await use(workflow);
  },

  apiIntegrationWorkflow: async ({ page, apiClient }, use) => {
    const workflow = new ApiIntegrationWorkflow(page, apiClient);
    await use(workflow);
  },

  // Page fixtures
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  productListPage: async ({ page }, use) => {
    const productListPage = new ProductListPage(page);
    await use(productListPage);
  },

  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },

  confirmationPage: async ({ page }, use) => {
    const confirmationPage = new OrderConfirmationPage(page);
    await use(confirmationPage);
  },

  // Authenticated page (pre-logged in)
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context with authentication state
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:3000',
            localStorage: [
              { name: 'authToken', value: 'test-token-for-authenticated-tests' },
            ],
          },
        ],
      },
    });

    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Worker-scoped admin API client
  adminApiClient: [
    async ({}, use: (r: ApiClient) => Promise<void>) => {
      const client = createApiClient();
      // Initialize the Playwright API context
      await client.initialize();
      // Set admin credentials
      client.setAuthToken(process.env.ADMIN_API_TOKEN ?? 'admin-token');
      await use(client);
      // Dispose of the context after tests
      await client.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
