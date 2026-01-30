/**
 * SauceDemo Login Workflow
 */

import { Page } from '@playwright/test';
import { Logger } from '../../../src/utils/logger';
import { LoginPage, InventoryPage } from '../pages';

/**
 * Test credentials for SauceDemo
 */
export const SauceDemoCredentials = {
  STANDARD_USER: { username: 'standard_user', password: 'secret_sauce' },
  LOCKED_OUT_USER: { username: 'locked_out_user', password: 'secret_sauce' },
  PROBLEM_USER: { username: 'problem_user', password: 'secret_sauce' },
  PERFORMANCE_GLITCH_USER: { username: 'performance_glitch_user', password: 'secret_sauce' },
  ERROR_USER: { username: 'error_user', password: 'secret_sauce' },
  VISUAL_USER: { username: 'visual_user', password: 'secret_sauce' },
};

/**
 * Login Workflow
 */
export class LoginWorkflow {
  private page: Page;
  private logger: Logger;
  private loginPage: LoginPage;
  private inventoryPage: InventoryPage;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.loginPage = new LoginPage(page);
    this.inventoryPage = new InventoryPage(page);
  }

  /**
   * Login with credentials
   */
  async login(username: string, password: string): Promise<void> {
    this.logger.step(1, 'Navigate to login page');
    await this.loginPage.navigate();

    this.logger.step(2, 'Enter credentials and submit');
    await this.loginPage.login(username, password);
  }

  /**
   * Login and verify success
   */
  async loginAndVerifySuccess(username: string, password: string): Promise<void> {
    await this.login(username, password);

    this.logger.step(3, 'Verify login success - redirected to inventory');
    await this.inventoryPage.waitForPageLoad();
  }

  /**
   * Login as standard user
   */
  async loginAsStandardUser(): Promise<void> {
    const { username, password } = SauceDemoCredentials.STANDARD_USER;
    await this.loginAndVerifySuccess(username, password);
  }

  /**
   * Login and expect failure
   */
  async loginAndExpectFailure(username: string, password: string): Promise<string> {
    await this.login(username, password);

    this.logger.step(3, 'Verify login failure - error message displayed');
    return await this.loginPage.getErrorMessage();
  }

  /**
   * Logout from application
   */
  async logout(): Promise<void> {
    this.logger.step(1, 'Logout from application');
    await this.inventoryPage.logout();
    await this.loginPage.waitForPageLoad();
  }
}
