/**
 * SauceDemo Checkout Workflow
 */

import { Page } from '@playwright/test';
import { Logger } from '../../../src/utils/logger';
import {
  CartPage,
  CheckoutStepOnePage,
  CheckoutStepTwoPage,
  CheckoutCompletePage,
} from '../pages';

/**
 * Customer information interface
 */
export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * Order summary interface
 */
export interface OrderSummary {
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Checkout Workflow
 */
export class CheckoutWorkflow {
  private page: Page;
  private logger: Logger;
  private cartPage: CartPage;
  private checkoutStepOne: CheckoutStepOnePage;
  private checkoutStepTwo: CheckoutStepTwoPage;
  private checkoutComplete: CheckoutCompletePage;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.cartPage = new CartPage(page);
    this.checkoutStepOne = new CheckoutStepOnePage(page);
    this.checkoutStepTwo = new CheckoutStepTwoPage(page);
    this.checkoutComplete = new CheckoutCompletePage(page);
  }

  /**
   * Start checkout from cart
   */
  async startCheckout(): Promise<void> {
    this.logger.step(1, 'Start checkout from cart');
    await this.cartPage.checkout();
    await this.checkoutStepOne.waitForPageLoad();
  }

  /**
   * Fill customer information
   */
  async fillCustomerInfo(info: CustomerInfo): Promise<void> {
    this.logger.step(2, 'Fill customer information');
    await this.checkoutStepOne.fillCustomerInfo(
      info.firstName,
      info.lastName,
      info.postalCode
    );
  }

  /**
   * Continue to order overview
   */
  async continueToOverview(): Promise<void> {
    this.logger.step(3, 'Continue to order overview');
    await this.checkoutStepOne.continue();
    await this.checkoutStepTwo.waitForPageLoad();
  }

  /**
   * Get order summary
   */
  async getOrderSummary(): Promise<OrderSummary> {
    this.logger.step(4, 'Get order summary');
    return {
      subtotal: await this.checkoutStepTwo.getSubtotal(),
      tax: await this.checkoutStepTwo.getTax(),
      total: await this.checkoutStepTwo.getTotal(),
    };
  }

  /**
   * Complete order
   */
  async completeOrder(): Promise<void> {
    this.logger.step(5, 'Complete order');
    await this.checkoutStepTwo.finish();
    await this.checkoutComplete.waitForPageLoad();
  }

  /**
   * Verify order completion
   */
  async verifyOrderComplete(): Promise<boolean> {
    this.logger.step(6, 'Verify order completion');
    return await this.checkoutComplete.isOrderComplete();
  }

  /**
   * Complete full checkout process
   */
  async completeFullCheckout(customerInfo: CustomerInfo): Promise<{
    success: boolean;
    summary: OrderSummary;
  }> {
    await this.startCheckout();
    await this.fillCustomerInfo(customerInfo);
    await this.continueToOverview();
    const summary = await this.getOrderSummary();
    await this.completeOrder();
    const success = await this.verifyOrderComplete();

    return { success, summary };
  }

  /**
   * Cancel checkout
   */
  async cancelCheckout(): Promise<void> {
    this.logger.step(1, 'Cancel checkout');
    await this.checkoutStepOne.cancel();
  }
}
