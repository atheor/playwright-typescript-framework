/**
 * Example Tests - Checkout Feature
 */

import { test, expect } from '../../fixtures/example-fixtures';
import { testData } from '../../../src';
import { ShippingData, PaymentData } from '../../workflows/example-workflows';

/**
 * Test Suite: Checkout Feature
 */
test.describe('Checkout Feature', () => {
  // Generate test data
  const userData = testData.user();
  const addressData = testData.address();
  const paymentInfo = testData.payment();

  const shippingData: ShippingData = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    address: addressData.street,
    city: addressData.city,
    state: addressData.state,
    zipCode: addressData.zipCode,
    country: addressData.country,
  };

  const paymentData: PaymentData = {
    cardNumber: paymentInfo.cardNumber,
    cardHolder: paymentInfo.cardHolder,
    expiryDate: paymentInfo.expiryDate,
    cvv: paymentInfo.cvv,
  };

  test.describe('Complete Checkout Flow', () => {
    test('User can complete checkout with valid data', async ({ checkoutWorkflow }) => {
      // Arrange
      const items = ['Product 1', 'Product 2'];

      // Act
      const result = await checkoutWorkflow.completeCheckout(
        items,
        shippingData,
        paymentData
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.orderNumber).not.toBeNull();
    });
  });

  test.describe('Checkout Steps', () => {
    test('User can add items to cart', async ({ checkoutWorkflow }) => {
      // Arrange
      const items = ['Product 1', 'Product 2'];

      // Act
      await checkoutWorkflow.addItemsToCart(items);

      // Assert - would verify cart contents
    });

    test('User can fill shipping details', async ({ checkoutWorkflow }) => {
      // Arrange
      const items = ['Product 1'];

      // Act
      await checkoutWorkflow.addItemsToCart(items);
      await checkoutWorkflow.proceedToCheckout();
      await checkoutWorkflow.fillShippingDetails(shippingData);

      // Assert - would verify shipping details saved
    });

    test('User can complete payment', async ({ checkoutWorkflow }) => {
      // Arrange
      const items = ['Product 1'];

      // Act
      await checkoutWorkflow.addItemsToCart(items);
      await checkoutWorkflow.proceedToCheckout();
      await checkoutWorkflow.fillShippingDetails(shippingData);
      await checkoutWorkflow.completePayment(paymentData);

      // Assert
      const result = await checkoutWorkflow.verifyOrderConfirmation();
      expect(result.success).toBe(true);
    });
  });
});
