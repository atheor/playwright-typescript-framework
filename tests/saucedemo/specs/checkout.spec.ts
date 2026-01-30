/**
 * SauceDemo Checkout Tests
 */

import { test, expect } from '../fixtures';
import { CustomerInfo } from '../workflows';

test.describe('Checkout Feature', () => {
  const customerInfo: CustomerInfo = {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345',
  };

  // Login and add items before each test
  test.beforeEach(async ({ loginWorkflow, shoppingWorkflow }) => {
    await loginWorkflow.loginAsStandardUser();
    await shoppingWorkflow.addProductToCart('Sauce Labs Backpack');
    await shoppingWorkflow.goToCartAndVerify(['Sauce Labs Backpack']);
  });

  test.describe('Complete Checkout Flow', () => {
    test('should complete checkout successfully', async ({ checkoutWorkflow }) => {
      const result = await checkoutWorkflow.completeFullCheckout(customerInfo);
      
      expect(result.success).toBe(true);
      expect(result.summary.total).toBeGreaterThan(0);
    });

    test('should display correct order total', async ({ checkoutWorkflow }) => {
      await checkoutWorkflow.startCheckout();
      await checkoutWorkflow.fillCustomerInfo(customerInfo);
      await checkoutWorkflow.continueToOverview();
      
      const summary = await checkoutWorkflow.getOrderSummary();
      
      // Backpack is $29.99, tax should be around 8%
      expect(summary.subtotal).toBe(29.99);
      expect(summary.tax).toBeGreaterThan(0);
      expect(summary.total).toBeCloseTo(summary.subtotal + summary.tax, 2);
    });
  });

  test.describe('Checkout Validation', () => {
    test('should require first name', async ({ checkoutWorkflow, checkoutStepOnePage }) => {
      await checkoutWorkflow.startCheckout();
      await checkoutStepOnePage.fillCustomerInfo('', 'Doe', '12345');
      await checkoutStepOnePage.continue();
      
      const error = await checkoutStepOnePage.getErrorMessage();
      expect(error).toContain('First Name is required');
    });

    test('should require last name', async ({ checkoutWorkflow, checkoutStepOnePage }) => {
      await checkoutWorkflow.startCheckout();
      await checkoutStepOnePage.fillCustomerInfo('John', '', '12345');
      await checkoutStepOnePage.continue();
      
      const error = await checkoutStepOnePage.getErrorMessage();
      expect(error).toContain('Last Name is required');
    });

    test('should require postal code', async ({ checkoutWorkflow, checkoutStepOnePage }) => {
      await checkoutWorkflow.startCheckout();
      await checkoutStepOnePage.fillCustomerInfo('John', 'Doe', '');
      await checkoutStepOnePage.continue();
      
      const error = await checkoutStepOnePage.getErrorMessage();
      expect(error).toContain('Postal Code is required');
    });
  });

  test.describe('Cancel Checkout', () => {
    test('should cancel checkout and return to cart', async ({ checkoutWorkflow, cartPage }) => {
      await checkoutWorkflow.startCheckout();
      await checkoutWorkflow.cancelCheckout();
      
      expect(await cartPage.isCurrentPage()).toBe(true);
    });
  });

  test.describe('Multiple Items Checkout', () => {
    test('should checkout with multiple items', async ({ loginWorkflow, shoppingWorkflow, checkoutWorkflow }) => {
      // Add more items
      await shoppingWorkflow.addProductToCart('Sauce Labs Bike Light');
      await shoppingWorkflow.addProductToCart('Sauce Labs Bolt T-Shirt');
      await shoppingWorkflow.goToCartAndVerify([
        'Sauce Labs Backpack',
        'Sauce Labs Bike Light',
        'Sauce Labs Bolt T-Shirt',
      ]);
      
      const result = await checkoutWorkflow.completeFullCheckout(customerInfo);
      
      expect(result.success).toBe(true);
      // Backpack $29.99 + Bike Light $9.99 + T-Shirt $15.99 = $55.97
      expect(result.summary.subtotal).toBeCloseTo(55.97, 2);
    });
  });
});
