/**
 * Base Element
 * Abstract base class for all UI element wrappers
 * Provides common functionality for all elements
 */

import { Locator, Page } from '@playwright/test';
import { FrameworkConfig } from '../../core/config';
import {
  ElementNotFoundException,
  ElementNotInteractableException,
  ElementTimeoutException,
} from '../../core/exceptions';
import { Logger } from '../../utils/logger';
import { retry, RetryOptions } from '../../utils/retry.utils';

export interface ElementOptions {
  /** Custom timeout for this element */
  timeout?: number;
  /** Number of retries for actions */
  retries?: number;
  /** Wait strategy for the element */
  waitStrategy?: 'visible' | 'attached' | 'hidden' | 'detached';
  /** Element name for logging */
  name?: string;
}

/**
 * Abstract base class for all UI elements
 */
export abstract class BaseElement {
  protected readonly locator: Locator;
  protected readonly page: Page;
  protected readonly logger: Logger;
  protected options: Required<ElementOptions>;

  constructor(locator: Locator, options: ElementOptions = {}) {
    this.locator = locator;
    this.page = locator.page();
    this.logger = Logger.getInstance();
    
    const config = FrameworkConfig.getConfig();
    this.options = {
      timeout: options.timeout ?? config.timeouts.element,
      retries: options.retries ?? config.retries.elementAction,
      waitStrategy: options.waitStrategy ?? config.elementWaitStrategy as 'visible' | 'attached' | 'hidden' | 'detached',
      name: options.name ?? 'Element',
    };
  }

  /**
   * Get the underlying Playwright locator
   */
  public getLocator(): Locator {
    return this.locator;
  }

  /**
   * Get page instance
   */
  public getPage(): Page {
    return this.page;
  }

  /**
   * Set custom timeout for this element
   */
  public withTimeout(timeout: number): this {
    this.options.timeout = timeout;
    return this;
  }

  /**
   * Set number of retries
   */
  public withRetries(retries: number): this {
    this.options.retries = retries;
    return this;
  }

  /**
   * Set wait strategy
   */
  public withWaitStrategy(strategy: 'visible' | 'attached' | 'hidden' | 'detached'): this {
    this.options.waitStrategy = strategy;
    return this;
  }

  /**
   * Set element name for logging
   */
  public withName(name: string): this {
    this.options.name = name;
    return this;
  }

  /**
   * Wait for element based on configured strategy
   */
  public async waitFor(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logger.debug(`Waiting for ${this.options.name} to be ${this.options.waitStrategy}`);
      await this.locator.waitFor({
        state: this.options.waitStrategy,
        timeout: this.options.timeout,
      });
    }, 'waitFor');
    return this;
  }

  /**
   * Check if element is visible
   */
  public async isVisible(): Promise<boolean> {
    try {
      return await this.locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  public async isEnabled(): Promise<boolean> {
    try {
      return await this.locator.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if element is hidden
   */
  public async isHidden(): Promise<boolean> {
    return await this.locator.isHidden();
  }

  /**
   * Get element text content
   */
  public async getText(): Promise<string | null> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      return await this.locator.textContent();
    }, 'getText');
  }

  /**
   * Get element attribute
   */
  public async getAttribute(name: string): Promise<string | null> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      return await this.locator.getAttribute(name);
    }, 'getAttribute');
  }

  /**
   * Scroll element into view
   */
  public async scrollIntoView(): Promise<this> {
    await this.executeWithRetry(async () => {
      await this.locator.scrollIntoViewIfNeeded({ timeout: this.options.timeout });
    }, 'scrollIntoView');
    return this;
  }

  /**
   * Highlight element (for debugging)
   */
  public async highlight(duration: number = 2000): Promise<this> {
    await this.locator.evaluate((el, dur) => {
      const originalStyle = el.getAttribute('style') ?? '';
      el.setAttribute('style', `${originalStyle}; border: 3px solid red !important; background-color: yellow !important;`);
      setTimeout(() => {
        el.setAttribute('style', originalStyle);
      }, dur);
    }, duration);
    return this;
  }

  /**
   * Take screenshot of element
   */
  public async screenshot(path?: string): Promise<Buffer> {
    const screenshotPath = path ?? `${FrameworkConfig.getConfig().screenshotsDir}/${this.options.name}-${Date.now()}.png`;
    return await this.locator.screenshot({ path: screenshotPath });
  }

  /**
   * Execute action with retry logic
   */
  protected async executeWithRetry<T>(
    action: () => Promise<T>,
    actionName: string,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const retryOptions: Partial<RetryOptions> = {
      maxAttempts: this.options.retries,
      delay: FrameworkConfig.getRetries().retryDelay,
      onRetry: (attempt, error) => {
        this.logger.warn(
          `Retrying ${actionName} on ${this.options.name} (attempt ${attempt}): ${error.message}`
        );
      },
      ...customOptions,
    };

    try {
      return await retry(action, retryOptions);
    } catch (error) {
      this.handleError(error as Error, actionName);
      throw error;
    }
  }

  /**
   * Handle and transform errors
   */
  protected handleError(error: Error, action: string): void {
    const message = error.message.toLowerCase();
    const selector = this.locator.toString();

    if (message.includes('timeout') || message.includes('waiting')) {
      throw new ElementTimeoutException(selector, action, this.options.timeout, {
        elementName: this.options.name,
      });
    }

    if (message.includes('not found') || message.includes('no element')) {
      throw new ElementNotFoundException(selector, this.options.timeout, {
        elementName: this.options.name,
      });
    }

    if (message.includes('not interactable') || message.includes('disabled')) {
      throw new ElementNotInteractableException(selector, action, error.message, {
        elementName: this.options.name,
      });
    }

    this.logger.error(`${this.options.name} ${action} failed`, error);
  }

  /**
   * Log action
   */
  protected logAction(action: string, details?: Record<string, unknown>): void {
    if (FrameworkConfig.getConfig().actionLogging) {
      this.logger.action(`${this.options.name}: ${action}`, {
        locator: this.locator.toString(),
        ...details,
      });
    }
  }
}
