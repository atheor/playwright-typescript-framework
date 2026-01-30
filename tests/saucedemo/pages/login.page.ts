/**
 * SauceDemo Login Page
 * https://www.saucedemo.com/
 */

import { Page, Locator } from '@playwright/test';
import { BasePage, Button, TextField } from '../../../src';

export class LoginPage extends BasePage {
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    super(page, {
      path: '/',
      titlePattern: /Swag Labs/,
    });

    this.usernameField = page.locator('[data-test="username"]');
    this.passwordField = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.logo = page.locator('.login_logo');
  }

  /**
   * Enter username
   */
  async enterUsername(username: string): Promise<void> {
    await TextField(this.usernameField).withName('Username').fill(username);
  }

  /**
   * Enter password
   */
  async enterPassword(password: string): Promise<void> {
    await TextField(this.passwordField).withName('Password').fill(password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await Button(this.loginButton).withName('Login Button').click();
  }

  /**
   * Perform login with credentials
   */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  /**
   * Check if error is displayed
   */
  async isErrorDisplayed(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }
}
