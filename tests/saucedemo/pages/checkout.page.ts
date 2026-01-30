/**
 * SauceDemo Checkout Pages
 */

import { Page, Locator } from '@playwright/test';
import { BasePage, Button, TextField } from '../../../src';

/**
 * Checkout Step One - Customer Information
 */
export class CheckoutStepOnePage extends BasePage {
  readonly title: Locator;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly postalCodeField: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/checkout-step-one.html',
      titlePattern: /Swag Labs/,
    });

    this.title = page.locator('.title');
    this.firstNameField = page.locator('[data-test="firstName"]');
    this.lastNameField = page.locator('[data-test="lastName"]');
    this.postalCodeField = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  /**
   * Fill customer information
   */
  async fillCustomerInfo(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await TextField(this.firstNameField).withName('First Name').fill(firstName);
    await TextField(this.lastNameField).withName('Last Name').fill(lastName);
    await TextField(this.postalCodeField).withName('Postal Code').fill(postalCode);
  }

  /**
   * Continue to next step
   */
  async continue(): Promise<void> {
    await Button(this.continueButton).withName('Continue').click();
  }

  /**
   * Cancel checkout
   */
  async cancel(): Promise<void> {
    await Button(this.cancelButton).withName('Cancel').click();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}

/**
 * Checkout Step Two - Order Overview
 */
export class CheckoutStepTwoPage extends BasePage {
  readonly title: Locator;
  readonly cartItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/checkout-step-two.html',
      titlePattern: /Swag Labs/,
    });

    this.title = page.locator('.title');
    this.cartItems = page.locator('.cart_item');
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel = page.locator('.summary_tax_label');
    this.totalLabel = page.locator('.summary_total_label');
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
  }

  /**
   * Get subtotal amount
   */
  async getSubtotal(): Promise<number> {
    const text = (await this.subtotalLabel.textContent()) ?? '';
    return parseFloat(text.replace('Item total: $', ''));
  }

  /**
   * Get tax amount
   */
  async getTax(): Promise<number> {
    const text = (await this.taxLabel.textContent()) ?? '';
    return parseFloat(text.replace('Tax: $', ''));
  }

  /**
   * Get total amount
   */
  async getTotal(): Promise<number> {
    const text = (await this.totalLabel.textContent()) ?? '';
    return parseFloat(text.replace('Total: $', ''));
  }

  /**
   * Finish checkout
   */
  async finish(): Promise<void> {
    await Button(this.finishButton).withName('Finish').click();
  }

  /**
   * Cancel checkout
   */
  async cancel(): Promise<void> {
    await Button(this.cancelButton).withName('Cancel').click();
  }
}

/**
 * Checkout Complete Page
 */
export class CheckoutCompletePage extends BasePage {
  readonly title: Locator;
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/checkout-complete.html',
      titlePattern: /Swag Labs/,
    });

    this.title = page.locator('.title');
    this.completeHeader = page.locator('.complete-header');
    this.completeText = page.locator('.complete-text');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  /**
   * Get completion header text
   */
  async getCompleteHeader(): Promise<string> {
    return (await this.completeHeader.textContent()) ?? '';
  }

  /**
   * Get completion message
   */
  async getCompleteText(): Promise<string> {
    return (await this.completeText.textContent()) ?? '';
  }

  /**
   * Go back to products
   */
  async backToProducts(): Promise<void> {
    await Button(this.backHomeButton).withName('Back Home').click();
  }

  /**
   * Check if order was successful
   */
  async isOrderComplete(): Promise<boolean> {
    const header = await this.getCompleteHeader();
    return header.toLowerCase().includes('thank you');
  }
}
