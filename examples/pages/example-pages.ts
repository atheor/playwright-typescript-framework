/**
 * Example Page Objects
 * Demonstrates the Page Object pattern using the framework
 */

import { Page, Locator } from '@playwright/test';
import { BasePage, Button, TextField, Dropdown, Checkbox, Link, Table } from '../../src';

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  // Page elements
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/login',
      titlePattern: /Login/,
    });

    this.usernameField = page.locator('#username');
    this.passwordField = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.rememberMeCheckbox = page.locator('#remember-me');
    this.forgotPasswordLink = page.locator('a[href*="forgot"]');
    this.errorMessage = page.locator('.error-message');
  }

  /**
   * Enter login credentials
   */
  async enterCredentials(username: string, password: string): Promise<void> {
    await TextField(this.usernameField).withName('Username').fill(username);
    await TextField(this.passwordField).withName('Password').fill(password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await Button(this.loginButton).withName('Login Button').click();
  }

  /**
   * Set remember me option
   */
  async setRememberMe(checked: boolean): Promise<void> {
    await Checkbox(this.rememberMeCheckbox)
      .withName('Remember Me')
      .setChecked(checked);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await Link(this.forgotPasswordLink).withName('Forgot Password').click();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Perform complete login
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.enterCredentials(username, password);
    if (rememberMe) {
      await this.setRememberMe(true);
    }
    await this.clickLogin();
  }
}

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly logoutButton: Locator;
  readonly userMenu: Locator;
  readonly searchField: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/home',
      titlePattern: /Home|Dashboard/,
    });

    this.welcomeMessage = page.locator('.welcome-message');
    this.logoutButton = page.locator('#logout');
    this.userMenu = page.locator('.user-menu');
    this.searchField = page.locator('#search');
    this.searchButton = page.locator('.search-button');
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage(): Promise<string | null> {
    return await this.welcomeMessage.textContent();
  }

  /**
   * Click logout
   */
  async logout(): Promise<void> {
    await Button(this.logoutButton).withName('Logout').click();
  }

  /**
   * Search
   */
  async search(query: string): Promise<void> {
    await TextField(this.searchField).fill(query);
    await Button(this.searchButton).click();
  }
}

/**
 * Product List Page Object
 */
export class ProductListPage extends BasePage {
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly filterDropdown: Locator;
  readonly sortDropdown: Locator;
  readonly priceRangeMin: Locator;
  readonly priceRangeMax: Locator;
  readonly applyFiltersButton: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/products',
      titlePattern: /Products/,
    });

    this.productGrid = page.locator('.product-grid');
    this.productCards = page.locator('.product-card');
    this.filterDropdown = page.locator('#category-filter');
    this.sortDropdown = page.locator('#sort-by');
    this.priceRangeMin = page.locator('#price-min');
    this.priceRangeMax = page.locator('#price-max');
    this.applyFiltersButton = page.locator('#apply-filters');
    this.resultCount = page.locator('.result-count');
  }

  /**
   * Get number of products displayed
   */
  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  /**
   * Filter by category
   */
  async filterByCategory(category: string): Promise<void> {
    await Dropdown(this.filterDropdown)
      .withName('Category Filter')
      .selectByLabel(category);
  }

  /**
   * Sort products
   */
  async sortBy(option: string): Promise<void> {
    await Dropdown(this.sortDropdown)
      .withName('Sort Dropdown')
      .selectByLabel(option);
  }

  /**
   * Set price range filter
   */
  async setPriceRange(min: number, max: number): Promise<void> {
    await TextField(this.priceRangeMin).fill(min.toString());
    await TextField(this.priceRangeMax).fill(max.toString());
    await Button(this.applyFiltersButton).click();
  }

  /**
   * Click on a product by name
   */
  async clickProduct(productName: string): Promise<void> {
    const product = this.page.locator('.product-card', { hasText: productName });
    await Button(product).withName(`Product: ${productName}`).click();
  }

  /**
   * Get all product names
   */
  async getProductNames(): Promise<string[]> {
    const names = this.page.locator('.product-card .product-name');
    return await names.allTextContents();
  }
}

/**
 * Checkout Page Object
 */
export class CheckoutPage extends BasePage {
  // Shipping info
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly addressField: Locator;
  readonly cityField: Locator;
  readonly stateDropdown: Locator;
  readonly zipCodeField: Locator;
  readonly countryDropdown: Locator;

  // Payment info
  readonly cardNumberField: Locator;
  readonly cardHolderField: Locator;
  readonly expiryDateField: Locator;
  readonly cvvField: Locator;

  // Actions
  readonly continueButton: Locator;
  readonly placeOrderButton: Locator;
  readonly cancelButton: Locator;

  // Summary
  readonly orderSummary: Locator;
  readonly orderTotal: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/checkout',
      titlePattern: /Checkout/,
    });

    // Shipping
    this.firstNameField = page.locator('#firstName');
    this.lastNameField = page.locator('#lastName');
    this.addressField = page.locator('#address');
    this.cityField = page.locator('#city');
    this.stateDropdown = page.locator('#state');
    this.zipCodeField = page.locator('#zipCode');
    this.countryDropdown = page.locator('#country');

    // Payment
    this.cardNumberField = page.locator('#cardNumber');
    this.cardHolderField = page.locator('#cardHolder');
    this.expiryDateField = page.locator('#expiryDate');
    this.cvvField = page.locator('#cvv');

    // Actions
    this.continueButton = page.locator('#continue');
    this.placeOrderButton = page.locator('#place-order');
    this.cancelButton = page.locator('#cancel');

    // Summary
    this.orderSummary = page.locator('.order-summary');
    this.orderTotal = page.locator('.order-total');
  }

  /**
   * Fill shipping information
   */
  async fillShippingInfo(data: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }): Promise<void> {
    await TextField(this.firstNameField).fill(data.firstName);
    await TextField(this.lastNameField).fill(data.lastName);
    await TextField(this.addressField).fill(data.address);
    await TextField(this.cityField).fill(data.city);
    await Dropdown(this.stateDropdown).selectByLabel(data.state);
    await TextField(this.zipCodeField).fill(data.zipCode);
    await Dropdown(this.countryDropdown).selectByLabel(data.country);
  }

  /**
   * Fill payment information
   */
  async fillPaymentInfo(data: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  }): Promise<void> {
    await TextField(this.cardNumberField).fill(data.cardNumber);
    await TextField(this.cardHolderField).fill(data.cardHolder);
    await TextField(this.expiryDateField).fill(data.expiryDate);
    await TextField(this.cvvField).fill(data.cvv);
  }

  /**
   * Continue to next step
   */
  async continue(): Promise<void> {
    await Button(this.continueButton).click();
  }

  /**
   * Place order
   */
  async placeOrder(): Promise<void> {
    await Button(this.placeOrderButton).click();
  }

  /**
   * Get order total
   */
  async getOrderTotal(): Promise<string | null> {
    return await this.orderTotal.textContent();
  }
}

/**
 * Order Confirmation Page Object
 */
export class OrderConfirmationPage extends BasePage {
  readonly confirmationMessage: Locator;
  readonly orderNumber: Locator;
  readonly orderDetails: Locator;
  readonly continueShoppingButton: Locator;
  readonly viewOrderHistoryLink: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/order-confirmation',
      titlePattern: /Order Confirmation|Thank You/,
    });

    this.confirmationMessage = page.locator('.confirmation-message');
    this.orderNumber = page.locator('.order-number');
    this.orderDetails = page.locator('.order-details');
    this.continueShoppingButton = page.locator('#continue-shopping');
    this.viewOrderHistoryLink = page.locator('a[href*="order-history"]');
  }

  /**
   * Get order number
   */
  async getOrderNumber(): Promise<string | null> {
    return await this.orderNumber.textContent();
  }

  /**
   * Check if order was successful
   */
  async isOrderSuccessful(): Promise<boolean> {
    const message = await this.confirmationMessage.textContent();
    return message?.toLowerCase().includes('thank you') ?? false;
  }

  /**
   * Continue shopping
   */
  async continueShopping(): Promise<void> {
    await Button(this.continueShoppingButton).click();
  }
}
