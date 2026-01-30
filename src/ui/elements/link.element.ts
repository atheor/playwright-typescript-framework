/**
 * Link Element
 * Wrapper for anchor/link elements
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface LinkOptions extends ElementOptions {
  /** Open in new tab */
  newTab?: boolean;
}

/**
 * Link element wrapper
 */
export class LinkElement extends BaseElement {
  protected linkOptions: LinkOptions;

  constructor(locator: Locator, options: LinkOptions = {}) {
    super(locator, options);
    this.linkOptions = {
      newTab: false,
      ...options,
    };
  }

  /**
   * Click the link
   */
  public async click(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('click');
      await this.waitFor();
      await this.locator.click({ timeout: this.options.timeout });
    }, 'click');
    return this;
  }

  /**
   * Click and wait for navigation
   */
  public async clickAndNavigate(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clickAndNavigate');
      await this.waitFor();
      await Promise.all([
        this.page.waitForNavigation(),
        this.locator.click({ timeout: this.options.timeout }),
      ]);
    }, 'clickAndNavigate');
    return this;
  }

  /**
   * Click and open in new tab
   */
  public async openInNewTab(): Promise<Locator['page'] extends () => infer P ? P : never> {
    this.logAction('openInNewTab');
    await this.waitFor();

    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.locator.click({ modifiers: ['Control'] }),
    ]);

    await newPage.waitForLoadState();
    return newPage;
  }

  /**
   * Get link href
   */
  public async getHref(): Promise<string | null> {
    return await this.getAttribute('href');
  }

  /**
   * Get link target
   */
  public async getTarget(): Promise<string | null> {
    return await this.getAttribute('target');
  }

  /**
   * Check if link opens in new tab
   */
  public async opensInNewTab(): Promise<boolean> {
    const target = await this.getTarget();
    return target === '_blank';
  }

  /**
   * Get link text
   */
  public async getLinkText(): Promise<string> {
    const text = await this.getText();
    return text ?? '';
  }

  /**
   * Hover over link
   */
  public async hover(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('hover');
      await this.waitFor();
      await this.locator.hover({ timeout: this.options.timeout });
    }, 'hover');
    return this;
  }

  /**
   * Check if link is external
   */
  public async isExternal(): Promise<boolean> {
    const href = await this.getHref();
    if (!href) return false;

    const pageUrl = new URL(this.page.url());
    
    try {
      const linkUrl = new URL(href, pageUrl.origin);
      return linkUrl.origin !== pageUrl.origin;
    } catch {
      return false;
    }
  }

  /**
   * Right click on link
   */
  public async rightClick(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('rightClick');
      await this.waitFor();
      await this.locator.click({ button: 'right', timeout: this.options.timeout });
    }, 'rightClick');
    return this;
  }

  /**
   * Get the full URL (resolved href)
   */
  public async getFullUrl(): Promise<string> {
    const href = await this.getHref();
    if (!href) return '';

    try {
      const pageUrl = new URL(this.page.url());
      const fullUrl = new URL(href, pageUrl.origin);
      return fullUrl.toString();
    } catch {
      return href;
    }
  }

  /**
   * Verify link href
   */
  public async andVerify(expectedHref?: string, expectedText?: string): Promise<this> {
    if (expectedHref !== undefined) {
      const actualHref = await this.getHref();
      if (actualHref !== expectedHref && !actualHref?.includes(expectedHref)) {
        throw new Error(`Expected href "${expectedHref}" but got "${actualHref}"`);
      }
    }

    if (expectedText !== undefined) {
      const actualText = await this.getLinkText();
      if (actualText.trim() !== expectedText.trim()) {
        throw new Error(`Expected link text "${expectedText}" but got "${actualText}"`);
      }
    }

    this.logAction('verified');
    return this;
  }
}

/**
 * Factory function for creating Link elements
 */
export function Link(locator: Locator, options?: LinkOptions): LinkElement {
  return new LinkElement(locator, options);
}
