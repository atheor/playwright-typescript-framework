/**
 * SauceDemo Cart Page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage, Button } from '../../../src';

export class CartPage extends BasePage {
  readonly title: Locator;
  readonly cartItems: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/cart.html',
      titlePattern: /Swag Labs/,
    });

    this.title = page.locator('.title');
    this.cartItems = page.locator('.cart_item');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  /**
   * Get number of items in cart
   */
  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Get all item names in cart
   */
  async getItemNames(): Promise<string[]> {
    const names = this.page.locator('.inventory_item_name');
    return await names.allTextContents();
  }

  /**
   * Remove item from cart by name
   */
  async removeItem(itemName: string): Promise<void> {
    const item = this.cartItems.filter({ hasText: itemName });
    const removeButton = item.locator('button[data-test^="remove"]');
    await Button(removeButton).withName(`Remove ${itemName}`).click();
  }

  /**
   * Continue shopping
   */
  async continueShopping(): Promise<void> {
    await Button(this.continueShoppingButton).withName('Continue Shopping').click();
  }

  /**
   * Proceed to checkout
   */
  async checkout(): Promise<void> {
    await Button(this.checkoutButton).withName('Checkout').click();
  }

  /**
   * Check if item is in cart
   */
  async hasItem(itemName: string): Promise<boolean> {
    const names = await this.getItemNames();
    return names.includes(itemName);
  }
}
