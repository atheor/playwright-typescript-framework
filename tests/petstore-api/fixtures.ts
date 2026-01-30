/**
 * Petstore API Fixtures
 */

import { test as base } from '@playwright/test';
import { createApiClient, ApiClient } from '../../src';
import { PetActions, StoreActions, UserActions } from './actions';

/**
 * Petstore API test fixtures
 */
interface PetstoreFixtures {
  apiClient: ApiClient;
  petActions: PetActions;
  storeActions: StoreActions;
  userActions: UserActions;
}

/**
 * Extended test with Petstore fixtures
 */
export const test = base.extend<PetstoreFixtures>({
  apiClient: async ({}, use: (r: ApiClient) => Promise<void>) => {
    const client = createApiClient({
      baseUrl: 'https://petstore.swagger.io/v2',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    // Initialize the Playwright API context
    await client.initialize();
    await use(client);
    // Dispose of the context after tests
    await client.dispose();
  },

  petActions: async ({ apiClient }, use) => {
    await use(new PetActions(apiClient));
  },

  storeActions: async ({ apiClient }, use) => {
    await use(new StoreActions(apiClient));
  },

  userActions: async ({ apiClient }, use) => {
    await use(new UserActions(apiClient));
  },
});

export { expect } from '@playwright/test';
