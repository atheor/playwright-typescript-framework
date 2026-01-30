/**
 * Button Element
 * Wrapper for button and clickable elements
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface ButtonOptions extends ElementOptions {
  /** Force click even if element is covered */
  force?: boolean;
  /** Click position */
  position?: { x: number; y: number };
}

/**
 * Button element wrapper
 */
export class ButtonElement extends BaseElement {
  protected buttonOptions: ButtonOptions;

  constructor(locator: Locator, options: ButtonOptions = {}) {
    super(locator, options);
    this.buttonOptions = {
      force: false,
      ...options,
    };
  }

  /**
   * Click the button
   */
  public async click(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('click');
      await this.waitFor();
      await this.locator.click({
        timeout: this.options.timeout,
        force: this.buttonOptions.force,
        position: this.buttonOptions.position,
      });
    }, 'click');
    return this;
  }

  /**
   * Double click the button
   */
  public async doubleClick(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('doubleClick');
      await this.waitFor();
      await this.locator.dblclick({
        timeout: this.options.timeout,
        force: this.buttonOptions.force,
      });
    }, 'doubleClick');
    return this;
  }

  /**
   * Right click the button
   */
  public async rightClick(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('rightClick');
      await this.waitFor();
      await this.locator.click({
        button: 'right',
        timeout: this.options.timeout,
        force: this.buttonOptions.force,
      });
    }, 'rightClick');
    return this;
  }

  /**
   * Hover over the button
   */
  public async hover(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('hover');
      await this.waitFor();
      await this.locator.hover({
        timeout: this.options.timeout,
        force: this.buttonOptions.force,
      });
    }, 'hover');
    return this;
  }

  /**
   * Click with modifier keys
   */
  public async clickWithModifier(
    modifiers: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>
  ): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clickWithModifier', { modifiers });
      await this.waitFor();
      await this.locator.click({
        modifiers,
        timeout: this.options.timeout,
        force: this.buttonOptions.force,
      });
    }, 'clickWithModifier');
    return this;
  }

  /**
   * Force click (bypass actionability checks)
   */
  public forceClick(): this {
    this.buttonOptions.force = true;
    return this;
  }

  /**
   * Click at specific position
   */
  public atPosition(x: number, y: number): this {
    this.buttonOptions.position = { x, y };
    return this;
  }

  /**
   * Click and wait for navigation
   */
  public async clickAndWaitForNavigation(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clickAndWaitForNavigation');
      await this.waitFor();
      await Promise.all([
        this.page.waitForNavigation(),
        this.locator.click({
          timeout: this.options.timeout,
          force: this.buttonOptions.force,
        }),
      ]);
    }, 'clickAndWaitForNavigation');
    return this;
  }

  /**
   * Click and wait for response
   */
  public async clickAndWaitForResponse(urlPattern: string | RegExp): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clickAndWaitForResponse', { urlPattern: urlPattern.toString() });
      await this.waitFor();
      await Promise.all([
        this.page.waitForResponse(urlPattern),
        this.locator.click({
          timeout: this.options.timeout,
          force: this.buttonOptions.force,
        }),
      ]);
    }, 'clickAndWaitForResponse');
    return this;
  }

  /**
   * Get button label/text
   */
  public async getLabel(): Promise<string> {
    const text = await this.getText();
    return text ?? '';
  }

  /**
   * Check if button is disabled
   */
  public async isDisabled(): Promise<boolean> {
    return await this.locator.isDisabled();
  }

  /**
   * Wait until button is enabled and click
   */
  public async waitAndClick(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('waitAndClick');
      await this.locator.waitFor({ state: 'visible', timeout: this.options.timeout });
      // Wait for enabled state
      await this.page.waitForFunction(
        (el) => !el?.hasAttribute('disabled'),
        await this.locator.elementHandle(),
        { timeout: this.options.timeout }
      );
      await this.locator.click({ timeout: this.options.timeout });
    }, 'waitAndClick');
    return this;
  }
}

/**
 * Factory function for creating Button elements
 */
export function Button(locator: Locator, options?: ButtonOptions): ButtonElement {
  return new ButtonElement(locator, options);
}
