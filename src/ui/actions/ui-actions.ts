/**
 * UI Actions
 * Reusable UI action utilities
 */

import { Page, Locator } from '@playwright/test';
import { FrameworkConfig } from '../../core/config';
import { Logger } from '../../utils/logger';
import { retry } from '../../utils/retry.utils';

const logger = Logger.getInstance();

/**
 * Common UI Actions
 */
export class UIActions {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait and click element
   */
  public async waitAndClick(locator: Locator, timeout?: number): Promise<void> {
    const actualTimeout = timeout ?? FrameworkConfig.getTimeouts().element;
    await locator.waitFor({ state: 'visible', timeout: actualTimeout });
    await locator.click({ timeout: actualTimeout });
  }

  /**
   * Wait and fill text field
   */
  public async waitAndFill(
    locator: Locator,
    value: string,
    timeout?: number
  ): Promise<void> {
    const actualTimeout = timeout ?? FrameworkConfig.getTimeouts().element;
    await locator.waitFor({ state: 'visible', timeout: actualTimeout });
    await locator.clear();
    await locator.fill(value, { timeout: actualTimeout });
  }

  /**
   * Click with retry
   */
  public async clickWithRetry(
    locator: Locator,
    maxAttempts: number = 3
  ): Promise<void> {
    await retry(
      async () => {
        await locator.click({ timeout: FrameworkConfig.getTimeouts().element });
      },
      { maxAttempts }
    );
  }

  /**
   * Hover and click (for dropdowns/menus)
   */
  public async hoverAndClick(
    hoverTarget: Locator,
    clickTarget: Locator
  ): Promise<void> {
    await hoverTarget.hover();
    await clickTarget.waitFor({ state: 'visible' });
    await clickTarget.click();
  }

  /**
   * Double click
   */
  public async doubleClick(locator: Locator): Promise<void> {
    await locator.dblclick({ timeout: FrameworkConfig.getTimeouts().element });
  }

  /**
   * Right click
   */
  public async rightClick(locator: Locator): Promise<void> {
    await locator.click({
      button: 'right',
      timeout: FrameworkConfig.getTimeouts().element,
    });
  }

  /**
   * Drag and drop
   */
  public async dragAndDrop(source: Locator, target: Locator): Promise<void> {
    logger.info('Performing drag and drop');
    await source.dragTo(target);
  }

  /**
   * Select text and copy
   */
  public async selectAndCopy(locator: Locator): Promise<void> {
    await locator.selectText();
    await this.page.keyboard.press('Control+c');
  }

  /**
   * Paste from clipboard
   */
  public async paste(locator: Locator): Promise<void> {
    await locator.focus();
    await this.page.keyboard.press('Control+v');
  }

  /**
   * Press keyboard shortcut
   */
  public async pressKeys(...keys: string[]): Promise<void> {
    const shortcut = keys.join('+');
    logger.debug(`Pressing keys: ${shortcut}`);
    await this.page.keyboard.press(shortcut);
  }

  /**
   * Type with delay between keystrokes
   */
  public async typeSlowly(
    locator: Locator,
    text: string,
    delay: number = 50
  ): Promise<void> {
    await locator.focus();
    await locator.pressSequentially(text, { delay });
  }

  /**
   * Wait for element to disappear
   */
  public async waitForElementToDisappear(
    locator: Locator,
    timeout?: number
  ): Promise<void> {
    const actualTimeout = timeout ?? FrameworkConfig.getTimeouts().element;
    await locator.waitFor({ state: 'hidden', timeout: actualTimeout });
  }

  /**
   * Wait for loading indicator to disappear
   */
  public async waitForLoadingToComplete(
    loadingSelector: string = '[class*="loading"], [class*="spinner"]'
  ): Promise<void> {
    const loading = this.page.locator(loadingSelector);
    if (await loading.isVisible()) {
      await loading.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Scroll element into view and click
   */
  public async scrollAndClick(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  /**
   * Get element count
   */
  public async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  /**
   * Check if element exists
   */
  public async elementExists(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  /**
   * Get all text from elements
   */
  public async getAllTexts(locator: Locator): Promise<string[]> {
    return await locator.allTextContents();
  }

  /**
   * Click nth element
   */
  public async clickNth(locator: Locator, index: number): Promise<void> {
    await locator.nth(index).click();
  }

  /**
   * Focus element
   */
  public async focus(locator: Locator): Promise<void> {
    await locator.focus();
  }

  /**
   * Blur element
   */
  public async blur(locator: Locator): Promise<void> {
    await locator.blur();
  }

  /**
   * Highlight element for debugging
   */
  public async highlight(locator: Locator, duration: number = 2000): Promise<void> {
    await locator.evaluate((el, dur) => {
      const originalStyle = el.getAttribute('style') ?? '';
      el.setAttribute(
        'style',
        `${originalStyle}; border: 3px solid red !important; background-color: yellow !important;`
      );
      setTimeout(() => {
        el.setAttribute('style', originalStyle);
      }, dur);
    }, duration);
  }

  /**
   * Wait for animation to complete
   */
  public async waitForAnimation(locator: Locator): Promise<void> {
    await locator.evaluate((el) => {
      return new Promise<void>((resolve) => {
        const animations = el.getAnimations();
        if (animations.length === 0) {
          resolve();
          return;
        }
        Promise.all(animations.map((a: Animation) => a.finished)).then(() => resolve());
      });
    });
  }
}

/**
 * Factory function for UIActions
 */
export function createUIActions(page: Page): UIActions {
  return new UIActions(page);
}
