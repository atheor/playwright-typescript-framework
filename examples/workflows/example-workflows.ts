/**
 * Example Workflows
 * Demonstrates the Workflow layer pattern
 */

import { Page } from '@playwright/test';
import { ApiClient } from '../../src';
import { Logger } from '../../src/utils/logger';
import {
  LoginPage,
  HomePage,
  ProductListPage,
  CheckoutPage,
  OrderConfirmationPage,
} from '../pages/example-pages';

/**
 * Shipping data interface
 */
export interface ShippingData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Payment data interface
 */
export interface PaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

/**
 * Login Workflow
 * Encapsulates all login-related business behaviors
 */
export class LoginWorkflow {
  private page: Page;
  private logger: Logger;
  private loginPage: LoginPage;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.loginPage = new LoginPage(page);
  }

  /**
   * Login with credentials
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    this.logger.step(1, 'Navigate to login page');
    await this.loginPage.navigate();

    this.logger.step(2, 'Enter credentials and submit');
    await this.loginPage.login(username, password, rememberMe);
  }

  /**
   * Login and verify success
   */
  async loginAndVerifySuccess(username: string, password: string): Promise<void> {
    await this.login(username, password);

    this.logger.step(3, 'Verify login success');
    const homePage = new HomePage(this.page);
    await homePage.waitForPageLoad();
    
    // Verify we're on the home page
    const isOnHomePage = await homePage.isCurrentPage();
    if (!isOnHomePage) {
      throw new Error('Login failed - not redirected to home page');
    }
  }

  /**
   * Login and verify failure
   */
  async loginAndVerifyFailure(username: string, password: string): Promise<string | null> {
    await this.login(username, password);

    this.logger.step(3, 'Verify login failure');
    return await this.loginPage.getErrorMessage();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(): Promise<void> {
    this.logger.step(1, 'Navigate to login page');
    await this.loginPage.navigate();

    this.logger.step(2, 'Click forgot password');
    await this.loginPage.clickForgotPassword();
  }
}

/**
 * Product Search Workflow
 * Encapsulates product search and filtering behaviors
 */
export class ProductSearchWorkflow {
  private page: Page;
  private logger: Logger;
  private productListPage: ProductListPage;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.productListPage = new ProductListPage(page);
  }

  /**
   * Navigate to products page
   */
  async navigateToProducts(): Promise<void> {
    this.logger.step(1, 'Navigate to products page');
    await this.productListPage.navigate();
  }

  /**
   * Search and filter products
   */
  async searchAndFilter(options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<number> {
    await this.navigateToProducts();

    if (options.category) {
      this.logger.step(2, `Filter by category: ${options.category}`);
      await this.productListPage.filterByCategory(options.category);
    }

    if (options.minPrice !== undefined && options.maxPrice !== undefined) {
      this.logger.step(3, `Set price range: ${options.minPrice} - ${options.maxPrice}`);
      await this.productListPage.setPriceRange(options.minPrice, options.maxPrice);
    }

    if (options.sortBy) {
      this.logger.step(4, `Sort by: ${options.sortBy}`);
      await this.productListPage.sortBy(options.sortBy);
    }

    return await this.productListPage.getProductCount();
  }

  /**
   * Select a product
   */
  async selectProduct(productName: string): Promise<void> {
    this.logger.step(1, `Select product: ${productName}`);
    await this.productListPage.clickProduct(productName);
  }

  /**
   * Get all product names
   */
  async getAllProductNames(): Promise<string[]> {
    return await this.productListPage.getProductNames();
  }
}

/**
 * Checkout Workflow
 * Encapsulates the complete checkout process
 */
export class CheckoutWorkflow {
  private page: Page;
  private logger: Logger;
  private productListPage: ProductListPage;
  private checkoutPage: CheckoutPage;
  private confirmationPage: OrderConfirmationPage;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.productListPage = new ProductListPage(page);
    this.checkoutPage = new CheckoutPage(page);
    this.confirmationPage = new OrderConfirmationPage(page);
  }

  /**
   * Add items to cart
   */
  async addItemsToCart(items: string[]): Promise<void> {
    this.logger.step(1, `Adding ${items.length} items to cart`);
    
    await this.productListPage.navigate();
    
    for (const item of items) {
      await this.productListPage.clickProduct(item);
      // Assumes clicking product adds to cart or navigates to product page
      // In real implementation, would need to handle "Add to Cart" button
    }
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    this.logger.step(2, 'Proceeding to checkout');
    await this.checkoutPage.navigate();
  }

  /**
   * Fill shipping details
   */
  async fillShippingDetails(data: ShippingData): Promise<void> {
    this.logger.step(3, 'Filling shipping details');
    await this.checkoutPage.fillShippingInfo(data);
    await this.checkoutPage.continue();
  }

  /**
   * Complete payment
   */
  async completePayment(data: PaymentData): Promise<void> {
    this.logger.step(4, 'Completing payment');
    await this.checkoutPage.fillPaymentInfo(data);
    await this.checkoutPage.placeOrder();
  }

  /**
   * Verify order confirmation
   */
  async verifyOrderConfirmation(): Promise<{
    success: boolean;
    orderNumber: string | null;
  }> {
    this.logger.step(5, 'Verifying order confirmation');
    
    const success = await this.confirmationPage.isOrderSuccessful();
    const orderNumber = await this.confirmationPage.getOrderNumber();

    return { success, orderNumber };
  }

  /**
   * Complete full checkout process
   */
  async completeCheckout(
    items: string[],
    shippingData: ShippingData,
    paymentData: PaymentData
  ): Promise<{ success: boolean; orderNumber: string | null }> {
    await this.addItemsToCart(items);
    await this.proceedToCheckout();
    await this.fillShippingDetails(shippingData);
    await this.completePayment(paymentData);
    return await this.verifyOrderConfirmation();
  }
}

/**
 * API Integration Workflow
 * Combines UI and API testing
 */
export class ApiIntegrationWorkflow {
  private page: Page;
  private apiClient: ApiClient;
  private logger: Logger;

  constructor(page: Page, apiClient: ApiClient) {
    this.page = page;
    this.apiClient = apiClient;
    this.logger = Logger.getInstance();
  }

  /**
   * Login via API and set session
   */
  async loginViaApi(username: string, password: string): Promise<void> {
    this.logger.step(1, 'Login via API');
    
    const response = await this.apiClient.post<{ token: string }>('/auth/login', {
      username,
      password,
    });

    this.logger.step(2, 'Set authentication token in browser');
    await this.page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, response.data.token);

    this.apiClient.setAuthToken(response.data.token);
  }

  /**
   * Create test data via API
   */
  async createTestProduct(productData: {
    name: string;
    price: number;
    category: string;
  }): Promise<string> {
    this.logger.step(1, 'Create product via API');
    
    const response = await this.apiClient.post<{ id: string }>('/products', productData);
    return response.data.id;
  }

  /**
   * Verify data consistency between UI and API
   */
  async verifyProductInUI(productId: string): Promise<boolean> {
    this.logger.step(1, 'Get product data from API');
    const apiResponse = await this.apiClient.get<{ name: string }>(`/products/${productId}`);

    this.logger.step(2, 'Navigate to product in UI');
    const productPage = new ProductListPage(this.page);
    await productPage.navigate();

    this.logger.step(3, 'Verify product exists in UI');
    const productNames = await productPage.getProductNames();
    return productNames.includes(apiResponse.data.name);
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(productIds: string[]): Promise<void> {
    this.logger.step(1, 'Cleaning up test data');
    
    for (const id of productIds) {
      await this.apiClient.delete(`/products/${id}`);
    }
  }
}
