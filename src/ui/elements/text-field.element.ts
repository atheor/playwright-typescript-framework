/**
 * TextField Element
 * Wrapper for text input fields
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface TextFieldOptions extends ElementOptions {
  /** Clear field before typing */
  clearBefore?: boolean;
  /** Use slow typing (typewriter effect) */
  slowType?: boolean;
  /** Delay between keystrokes in ms */
  typeDelay?: number;
}

/**
 * TextField element wrapper
 */
export class TextFieldElement extends BaseElement {
  protected textFieldOptions: TextFieldOptions;

  constructor(locator: Locator, options: TextFieldOptions = {}) {
    super(locator, options);
    this.textFieldOptions = {
      clearBefore: true,
      slowType: false,
      typeDelay: 50,
      ...options,
    };
  }

  /**
   * Fill the text field with value
   */
  public async fill(value: string): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('fill', { value: value.length > 50 ? value.substring(0, 50) + '...' : value });
      await this.waitFor();
      
      if (this.textFieldOptions.clearBefore) {
        await this.locator.clear({ timeout: this.options.timeout });
      }
      
      await this.locator.fill(value, { timeout: this.options.timeout });
    }, 'fill');
    return this;
  }

  /**
   * Type into field with typewriter effect
   */
  public async type(value: string): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('type', { value: value.length > 50 ? value.substring(0, 50) + '...' : value });
      await this.waitFor();
      
      if (this.textFieldOptions.clearBefore) {
        await this.locator.clear({ timeout: this.options.timeout });
      }
      
      await this.locator.pressSequentially(value, {
        delay: this.textFieldOptions.typeDelay,
      });
    }, 'type');
    return this;
  }

  /**
   * Clear the text field
   */
  public async clear(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('clear');
      await this.waitFor();
      await this.locator.clear({ timeout: this.options.timeout });
    }, 'clear');
    return this;
  }

  /**
   * Get field value
   */
  public async getValue(): Promise<string> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      return await this.locator.inputValue();
    }, 'getValue');
  }

  /**
   * Press key in field
   */
  public async pressKey(key: string): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('pressKey', { key });
      await this.waitFor();
      await this.locator.press(key);
    }, 'pressKey');
    return this;
  }

  /**
   * Focus on field
   */
  public async focus(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('focus');
      await this.waitFor();
      await this.locator.focus();
    }, 'focus');
    return this;
  }

  /**
   * Blur field (remove focus)
   */
  public async blur(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('blur');
      await this.waitFor();
      await this.locator.blur();
    }, 'blur');
    return this;
  }

  /**
   * Fill and press Enter
   */
  public async fillAndSubmit(value: string): Promise<this> {
    await this.fill(value);
    await this.pressKey('Enter');
    return this;
  }

  /**
   * Configure to not clear before filling
   */
  public withoutClearing(): this {
    this.textFieldOptions.clearBefore = false;
    return this;
  }

  /**
   * Configure slow typing
   */
  public withSlowTyping(delay: number = 50): this {
    this.textFieldOptions.slowType = true;
    this.textFieldOptions.typeDelay = delay;
    return this;
  }

  /**
   * Get placeholder text
   */
  public async getPlaceholder(): Promise<string | null> {
    return await this.getAttribute('placeholder');
  }

  /**
   * Check if field is empty
   */
  public async isEmpty(): Promise<boolean> {
    const value = await this.getValue();
    return value.trim().length === 0;
  }

  /**
   * Get max length attribute
   */
  public async getMaxLength(): Promise<number | null> {
    const attr = await this.getAttribute('maxlength');
    return attr ? parseInt(attr, 10) : null;
  }

  /**
   * Check if field is readonly
   */
  public async isReadOnly(): Promise<boolean> {
    const attr = await this.getAttribute('readonly');
    return attr !== null;
  }

  /**
   * Verify field value
   */
  public async andVerify(expectedValue?: string): Promise<this> {
    const actualValue = await this.getValue();
    if (expectedValue !== undefined && actualValue !== expectedValue) {
      throw new Error(`Expected value "${expectedValue}" but got "${actualValue}"`);
    }
    this.logAction('verified', { value: actualValue });
    return this;
  }

  /**
   * Select all text in field
   */
  public async selectAll(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('selectAll');
      await this.waitFor();
      await this.locator.focus();
      await this.page.keyboard.press('Control+a');
    }, 'selectAll');
    return this;
  }

  /**
   * Copy text from field
   */
  public async copy(): Promise<string> {
    await this.selectAll();
    await this.page.keyboard.press('Control+c');
    // Note: Clipboard API access varies by browser
    const value = await this.getValue();
    this.logAction('copy', { value });
    return value;
  }

  /**
   * Paste text into field
   */
  public async paste(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('paste');
      await this.waitFor();
      await this.locator.focus();
      await this.page.keyboard.press('Control+v');
    }, 'paste');
    return this;
  }
}

/**
 * Factory function for creating TextField elements
 */
export function TextField(locator: Locator, options?: TextFieldOptions): TextFieldElement {
  return new TextFieldElement(locator, options);
}
