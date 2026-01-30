/**
 * SauceDemo Inventory (Products) Page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage, Button, Dropdown } from '../../../src';

export class InventoryPage extends BasePage {
  readonly title: Locator;
  readonly inventoryItems: Locator;
  readonly sortDropdown: Locator;
  readonly shoppingCartBadge: Locator;
  readonly shoppingCartLink: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/inventory.html',
      titlePattern: /Swag Labs/,
    });

    this.title = page.locator('.title');
    this.inventoryItems = page.locator('.inventory_item');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.shoppingCartBadge = page.locator('.shopping_cart_badge');
    this.shoppingCartLink = page.locator('.shopping_cart_link');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  /**
   * Get page title text
   */
  async getTitle(): Promise<string> {
    return (await this.title.textContent()) ?? '';
  }

  /**
   * Get number of products displayed
   */
  async getProductCount(): Promise<number> {
    return await this.inventoryItems.count();
  }

  /**
   * Sort products by option
   */
  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await Dropdown(this.sortDropdown).withName('Sort').selectByValue(option);
  }

  /**
   * Get all product names
   */
  async getProductNames(): Promise<string[]> {
    const names = this.page.locator('.inventory_item_name');
    return await names.allTextContents();
  }

  /**
   * Get all product prices
   */
  async getProductPrices(): Promise<number[]> {
    const prices = this.page.locator('.inventory_item_price');
    const priceTexts = await prices.allTextContents();
    return priceTexts.map((p) => parseFloat(p.replace('$', '')));
  }

  /**
   * Add product to cart by name
   */
  async addProductToCart(productName: string): Promise<void> {
    const product = this.inventoryItems.filter({ hasText: productName });
    const addButton = product.locator('button[data-test^="add-to-cart"]');
    await Button(addButton).withName(`Add ${productName} to cart`).click();
  }

  /**
   * Remove product from cart by name
   */
  async removeProductFromCart(productName: string): Promise<void> {
    const product = this.inventoryItems.filter({ hasText: productName });
    const removeButton = product.locator('button[data-test^="remove"]');
    await Button(removeButton).withName(`Remove ${productName} from cart`).click();
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    if (await this.shoppingCartBadge.isVisible()) {
      const count = await this.shoppingCartBadge.textContent();
      return parseInt(count ?? '0', 10);
    }
    return 0;
  }

  /**
   * Go to shopping cart
   */
  async goToCart(): Promise<void> {
    await Button(this.shoppingCartLink).withName('Shopping Cart').click();
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await Button(this.burgerMenuButton).withName('Menu').click();
    await this.logoutLink.waitFor({ state: 'visible' });
    await Button(this.logoutLink).withName('Logout').click();
  }

  /**
   * Click on a product to view details
   */
  async viewProductDetails(productName: string): Promise<void> {
    const productLink = this.page.locator('.inventory_item_name', { hasText: productName });
    await Button(productLink).withName(`View ${productName}`).click();
  }
}
