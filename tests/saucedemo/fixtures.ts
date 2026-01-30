/**
 * SauceDemo Fixtures
 */

import { test as base } from '@playwright/test';
import { LoginWorkflow, ShoppingWorkflow, CheckoutWorkflow } from './workflows';
import { LoginPage, InventoryPage, CartPage, CheckoutStepOnePage, CheckoutStepTwoPage, CheckoutCompletePage } from './pages';

/**
 * SauceDemo test fixtures
 */
interface SauceDemoFixtures {
  // Workflows
  loginWorkflow: LoginWorkflow;
  shoppingWorkflow: ShoppingWorkflow;
  checkoutWorkflow: CheckoutWorkflow;

  // Pages
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
}

/**
 * Extended test with SauceDemo fixtures
 */
export const test = base.extend<SauceDemoFixtures>({
  // Workflow fixtures
  loginWorkflow: async ({ page }, use) => {
    await use(new LoginWorkflow(page));
  },

  shoppingWorkflow: async ({ page }, use) => {
    await use(new ShoppingWorkflow(page));
  },

  checkoutWorkflow: async ({ page }, use) => {
    await use(new CheckoutWorkflow(page));
  },

  // Page fixtures
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutStepOnePage: async ({ page }, use) => {
    await use(new CheckoutStepOnePage(page));
  },

  checkoutStepTwoPage: async ({ page }, use) => {
    await use(new CheckoutStepTwoPage(page));
  },

  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
});

export { expect } from '@playwright/test';
