/**
 * Base Page
 * Abstract base class for all page objects
 */

import { Page, Locator, BrowserContext } from '@playwright/test';
import { FrameworkConfig } from '../../core/config';
import { NavigationException } from '../../core/exceptions';
import { Logger } from '../../utils/logger';
import { waitForPageReady } from '../../utils/wait.utils';

export interface PageOptions {
  /** Page URL path (relative to base URL) */
  path?: string;
  /** Page title pattern */
  titlePattern?: string | RegExp;
  /** Load timeout */
  loadTimeout?: number;
}

/**
 * Abstract base class for page objects
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;
  protected readonly options: Required<PageOptions>;

  constructor(page: Page, options: PageOptions = {}) {
    this.page = page;
    this.logger = Logger.getInstance();
    this.options = {
      path: options.path ?? '',
      titlePattern: options.titlePattern ?? /.*/,
      loadTimeout: options.loadTimeout ?? FrameworkConfig.getTimeouts().navigation,
    };
  }

  /**
   * Get the page instance
   */
  public getPage(): Page {
    return this.page;
  }

  /**
   * Get browser context
   */
  public getContext(): BrowserContext {
    return this.page.context();
  }

  /**
   * Get full URL for this page
   */
  public getFullUrl(): string {
    const baseUrl = FrameworkConfig.getConfig().baseUrl;
    return `${baseUrl}${this.options.path}`;
  }

  /**
   * Navigate to this page
   */
  public async navigate(params?: Record<string, string>): Promise<this> {
    let url = this.getFullUrl();

    // Replace URL parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value);
        url = url.replace(`{${key}}`, value);
      });
    }

    this.logger.info(`Navigating to: ${url}`);

    try {
      await this.page.goto(url, { timeout: this.options.loadTimeout });
      await this.waitForPageLoad();
    } catch (error) {
      throw new NavigationException(url, (error as Error).message);
    }

    return this;
  }

  /**
   * Wait for page to fully load
   */
  public async waitForPageLoad(): Promise<void> {
    await waitForPageReady(this.page, {
      timeout: this.options.loadTimeout,
      waitForNetworkIdle: false,
    });
  }

  /**
   * Wait for page to be idle (no network activity)
   */
  public async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle', {
      timeout: this.options.loadTimeout,
    });
  }

  /**
   * Check if currently on this page
   */
  public async isCurrentPage(): Promise<boolean> {
    const currentUrl = this.page.url();
    const expectedPath = this.options.path;
    return currentUrl.includes(expectedPath);
  }

  /**
   * Get page title
   */
  public async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  public getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  public async reload(): Promise<this> {
    this.logger.info('Reloading page');
    await this.page.reload({ timeout: this.options.loadTimeout });
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Go back
   */
  public async goBack(): Promise<this> {
    this.logger.info('Going back');
    await this.page.goBack({ timeout: this.options.loadTimeout });
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Go forward
   */
  public async goForward(): Promise<this> {
    this.logger.info('Going forward');
    await this.page.goForward({ timeout: this.options.loadTimeout });
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Take screenshot
   */
  public async screenshot(name?: string): Promise<Buffer> {
    const screenshotName = name ?? `${this.constructor.name}-${Date.now()}`;
    const path = `${FrameworkConfig.getConfig().screenshotsDir}/${screenshotName}.png`;
    
    this.logger.debug(`Taking screenshot: ${path}`);
    return await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Scroll to top of page
   */
  public async scrollToTop(): Promise<this> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    return this;
  }

  /**
   * Scroll to bottom of page
   */
  public async scrollToBottom(): Promise<this> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    return this;
  }

  /**
   * Scroll to element
   */
  public async scrollToElement(locator: Locator): Promise<this> {
    await locator.scrollIntoViewIfNeeded();
    return this;
  }

  /**
   * Wait for specific element
   */
  public async waitForElement(
    locator: Locator,
    state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible'
  ): Promise<Locator> {
    await locator.waitFor({ state, timeout: FrameworkConfig.getTimeouts().element });
    return locator;
  }

  /**
   * Get text content of element
   */
  public async getElementText(locator: Locator): Promise<string | null> {
    return await locator.textContent();
  }

  /**
   * Check if element is visible
   */
  public async isElementVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Wait for URL change
   */
  public async waitForUrlChange(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, {
      timeout: this.options.loadTimeout,
    });
  }

  /**
   * Execute JavaScript on page
   */
  public async evaluate<T>(script: string | ((...args: unknown[]) => T)): Promise<T> {
    return await this.page.evaluate(script);
  }

  /**
   * Handle alert/dialog
   */
  public async handleDialog(
    action: 'accept' | 'dismiss',
    promptText?: string
  ): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        
        if (action === 'accept') {
          await dialog.accept(promptText);
        } else {
          await dialog.dismiss();
        }
        
        resolve(message);
      });
    });
  }

  /**
   * Switch to frame
   */
  public async switchToFrame(frameLocator: string | Locator): Promise<Locator['page'] extends () => infer P ? P : never> {
    const frame = typeof frameLocator === 'string'
      ? this.page.frameLocator(frameLocator)
      : frameLocator;
    return frame as unknown as Locator['page'] extends () => infer P ? P : never;
  }

  /**
   * Get all cookies
   */
  public async getCookies(): Promise<ReturnType<BrowserContext['cookies']>> {
    return await this.page.context().cookies();
  }

  /**
   * Set cookie
   */
  public async setCookie(name: string, value: string, options?: {
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
  }): Promise<void> {
    const url = this.page.url();
    await this.page.context().addCookies([{
      name,
      value,
      url,
      ...options,
    }]);
  }

  /**
   * Clear all cookies
   */
  public async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }

  /**
   * Get local storage item
   */
  public async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set local storage item
   */
  public async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear local storage
   */
  public async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Log page action
   */
  protected logAction(action: string, details?: Record<string, unknown>): void {
    if (FrameworkConfig.getConfig().actionLogging) {
      this.logger.action(`${this.constructor.name}: ${action}`, details ?? {});
    }
  }
}
