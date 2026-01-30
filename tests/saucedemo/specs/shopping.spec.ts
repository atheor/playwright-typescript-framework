/**
 * SauceDemo Shopping Tests
 */

import { test, expect } from '../fixtures';

test.describe('Shopping Feature', () => {
  // Login before each test
  test.beforeEach(async ({ loginWorkflow }) => {
    await loginWorkflow.loginAsStandardUser();
  });

  test.describe('Product Listing', () => {
    test('should display products on inventory page', async ({ inventoryPage }) => {
      const productCount = await inventoryPage.getProductCount();
      
      expect(productCount).toBeGreaterThan(0);
    });

    test('should display 6 products', async ({ inventoryPage }) => {
      const productCount = await inventoryPage.getProductCount();
      
      expect(productCount).toBe(6);
    });
  });

  test.describe('Product Sorting', () => {
    test('should sort products by name A-Z', async ({ shoppingWorkflow }) => {
      const names = await shoppingWorkflow.sortProductsAndGetNames('az');
      const sortedNames = [...names].sort();
      
      expect(names).toEqual(sortedNames);
    });

    test('should sort products by name Z-A', async ({ shoppingWorkflow }) => {
      const names = await shoppingWorkflow.sortProductsAndGetNames('za');
      const sortedNames = [...names].sort().reverse();
      
      expect(names).toEqual(sortedNames);
    });

    test('should sort products by price low to high', async ({ shoppingWorkflow }) => {
      const prices = await shoppingWorkflow.sortProductsAndGetPrices('lohi');
      const sortedPrices = [...prices].sort((a, b) => a - b);
      
      expect(prices).toEqual(sortedPrices);
    });

    test('should sort products by price high to low', async ({ shoppingWorkflow }) => {
      const prices = await shoppingWorkflow.sortProductsAndGetPrices('hilo');
      const sortedPrices = [...prices].sort((a, b) => b - a);
      
      expect(prices).toEqual(sortedPrices);
    });
  });

  test.describe('Add to Cart', () => {
    test('should add single product to cart', async ({ shoppingWorkflow }) => {
      await shoppingWorkflow.addProductToCart('Sauce Labs Backpack');
      
      const cartCount = await shoppingWorkflow.getCartCount();
      expect(cartCount).toBe(1);
    });

    test('should add multiple products to cart', async ({ shoppingWorkflow }) => {
      const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];
      await shoppingWorkflow.addProductsToCart(products);
      
      const cartCount = await shoppingWorkflow.getCartCount();
      expect(cartCount).toBe(3);
    });

    test('should verify items in cart', async ({ shoppingWorkflow }) => {
      const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
      await shoppingWorkflow.addProductsToCart(products);
      
      const itemsVerified = await shoppingWorkflow.goToCartAndVerify(products);
      expect(itemsVerified).toBe(true);
    });
  });

  test.describe('Remove from Cart', () => {
    test('should remove product from cart', async ({ shoppingWorkflow }) => {
      await shoppingWorkflow.addProductToCart('Sauce Labs Backpack');
      expect(await shoppingWorkflow.getCartCount()).toBe(1);
      
      await shoppingWorkflow.removeProductFromCart('Sauce Labs Backpack');
      expect(await shoppingWorkflow.getCartCount()).toBe(0);
    });
  });

  test.describe('Cart Management', () => {
    test('should continue shopping from cart', async ({ shoppingWorkflow, cartPage, inventoryPage }) => {
      await shoppingWorkflow.addProductToCart('Sauce Labs Backpack');
      await shoppingWorkflow.goToCartAndVerify(['Sauce Labs Backpack']);
      
      await cartPage.continueShopping();
      expect(await inventoryPage.isCurrentPage()).toBe(true);
    });

    test('should remove item from cart page', async ({ shoppingWorkflow, cartPage }) => {
      await shoppingWorkflow.addProductToCart('Sauce Labs Backpack');
      await shoppingWorkflow.goToCartAndVerify(['Sauce Labs Backpack']);
      
      await cartPage.removeItem('Sauce Labs Backpack');
      
      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBe(0);
    });
  });
});
