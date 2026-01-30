/**
 * SauceDemo Shopping Workflow
 */

import { Page } from '@playwright/test';
import { Logger } from '../../../src/utils/logger';
import { InventoryPage, CartPage } from '../pages';

/**
 * Shopping Workflow
 */
export class ShoppingWorkflow {
  private page: Page;
  private logger: Logger;
  private inventoryPage: InventoryPage;
  private cartPage: CartPage;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.inventoryPage = new InventoryPage(page);
    this.cartPage = new CartPage(page);
  }

  /**
   * Add single product to cart
   */
  async addProductToCart(productName: string): Promise<void> {
    this.logger.step(1, `Add product to cart: ${productName}`);
    await this.inventoryPage.addProductToCart(productName);
  }

  /**
   * Add multiple products to cart
   */
  async addProductsToCart(productNames: string[]): Promise<void> {
    this.logger.step(1, `Adding ${productNames.length} products to cart`);
    
    for (const product of productNames) {
      await this.inventoryPage.addProductToCart(product);
    }
  }

  /**
   * Remove product from cart
   */
  async removeProductFromCart(productName: string): Promise<void> {
    this.logger.step(1, `Remove product from cart: ${productName}`);
    await this.inventoryPage.removeProductFromCart(productName);
  }

  /**
   * Get cart count
   */
  async getCartCount(): Promise<number> {
    return await this.inventoryPage.getCartItemCount();
  }

  /**
   * Navigate to cart and verify items
   */
  async goToCartAndVerify(expectedItems: string[]): Promise<boolean> {
    this.logger.step(1, 'Navigate to cart');
    await this.inventoryPage.goToCart();
    await this.cartPage.waitForPageLoad();

    this.logger.step(2, 'Verify cart items');
    const cartItems = await this.cartPage.getItemNames();
    
    return expectedItems.every((item) => cartItems.includes(item));
  }

  /**
   * Sort products and get names
   */
  async sortProductsAndGetNames(sortOption: 'az' | 'za' | 'lohi' | 'hilo'): Promise<string[]> {
    this.logger.step(1, `Sort products by: ${sortOption}`);
    await this.inventoryPage.sortBy(sortOption);
    
    return await this.inventoryPage.getProductNames();
  }

  /**
   * Sort products and get prices
   */
  async sortProductsAndGetPrices(sortOption: 'az' | 'za' | 'lohi' | 'hilo'): Promise<number[]> {
    this.logger.step(1, `Sort products by: ${sortOption}`);
    await this.inventoryPage.sortBy(sortOption);
    
    return await this.inventoryPage.getProductPrices();
  }

  /**
   * View product details
   */
  async viewProduct(productName: string): Promise<void> {
    this.logger.step(1, `View product: ${productName}`);
    await this.inventoryPage.viewProductDetails(productName);
  }
}
