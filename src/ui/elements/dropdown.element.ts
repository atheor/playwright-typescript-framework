/**
 * Dropdown Element
 * Wrapper for select/dropdown elements
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface DropdownOptions extends ElementOptions {
  /** Wait for options to load */
  waitForOptions?: boolean;
}

export interface SelectOption {
  value?: string;
  label?: string;
  index?: number;
}

/**
 * Dropdown element wrapper
 */
export class DropdownElement extends BaseElement {
  protected dropdownOptions: DropdownOptions;

  constructor(locator: Locator, options: DropdownOptions = {}) {
    super(locator, options);
    this.dropdownOptions = {
      waitForOptions: true,
      ...options,
    };
  }

  /**
   * Select option by value
   */
  public async selectByValue(value: string): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('selectByValue', { value });
      await this.waitFor();
      await this.locator.selectOption({ value }, { timeout: this.options.timeout });
    }, 'selectByValue');
    return this;
  }

  /**
   * Select option by visible label
   */
  public async selectByLabel(label: string): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('selectByLabel', { label });
      await this.waitFor();
      await this.locator.selectOption({ label }, { timeout: this.options.timeout });
    }, 'selectByLabel');
    return this;
  }

  /**
   * Select option by index
   */
  public async selectByIndex(index: number): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('selectByIndex', { index });
      await this.waitFor();
      await this.locator.selectOption({ index }, { timeout: this.options.timeout });
    }, 'selectByIndex');
    return this;
  }

  /**
   * Select option (flexible - accepts value, label, or index)
   */
  public async selectOption(option: string | SelectOption): Promise<this> {
    if (typeof option === 'string') {
      return await this.selectByLabel(option);
    }

    await this.executeWithRetry(async () => {
      this.logAction('selectOption', { option });
      await this.waitFor();
      await this.locator.selectOption(option, { timeout: this.options.timeout });
    }, 'selectOption');
    return this;
  }

  /**
   * Select multiple options
   */
  public async selectMultiple(options: string[] | SelectOption[]): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('selectMultiple', { count: options.length });
      await this.waitFor();
      await this.locator.selectOption(options as string[], { timeout: this.options.timeout });
    }, 'selectMultiple');
    return this;
  }

  /**
   * Get selected option value
   */
  public async getSelectedValue(): Promise<string> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      return await this.locator.inputValue();
    }, 'getSelectedValue');
  }

  /**
   * Get selected option text
   */
  public async getSelectedText(): Promise<string> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      const selectedOption = this.locator.locator('option:checked');
      return (await selectedOption.textContent()) ?? '';
    }, 'getSelectedText');
  }

  /**
   * Get all available options
   */
  public async getOptions(): Promise<{ value: string; text: string }[]> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      const options = this.locator.locator('option');
      const count = await options.count();
      const result: { value: string; text: string }[] = [];

      for (let i = 0; i < count; i++) {
        const option = options.nth(i);
        result.push({
          value: (await option.getAttribute('value')) ?? '',
          text: (await option.textContent()) ?? '',
        });
      }

      return result;
    }, 'getOptions');
  }

  /**
   * Get option values only
   */
  public async getOptionValues(): Promise<string[]> {
    const options = await this.getOptions();
    return options.map((o) => o.value);
  }

  /**
   * Get option labels only
   */
  public async getOptionLabels(): Promise<string[]> {
    const options = await this.getOptions();
    return options.map((o) => o.text.trim());
  }

  /**
   * Check if option exists
   */
  public async hasOption(value: string): Promise<boolean> {
    const values = await this.getOptionValues();
    return values.includes(value);
  }

  /**
   * Check if dropdown has a specific label
   */
  public async hasLabel(label: string): Promise<boolean> {
    const labels = await this.getOptionLabels();
    return labels.includes(label);
  }

  /**
   * Get options count
   */
  public async getOptionsCount(): Promise<number> {
    const options = await this.getOptions();
    return options.length;
  }

  /**
   * Select first option
   */
  public async selectFirst(): Promise<this> {
    return await this.selectByIndex(0);
  }

  /**
   * Select last option
   */
  public async selectLast(): Promise<this> {
    const count = await this.getOptionsCount();
    return await this.selectByIndex(count - 1);
  }

  /**
   * Select random option
   */
  public async selectRandom(): Promise<this> {
    const count = await this.getOptionsCount();
    const randomIndex = Math.floor(Math.random() * count);
    return await this.selectByIndex(randomIndex);
  }

  /**
   * Deselect all (for multi-select)
   */
  public async deselectAll(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('deselectAll');
      await this.waitFor();
      await this.locator.selectOption([], { timeout: this.options.timeout });
    }, 'deselectAll');
    return this;
  }

  /**
   * Verify selected value
   */
  public async andVerify(expectedValue?: string, expectedText?: string): Promise<this> {
    if (expectedValue !== undefined) {
      const actualValue = await this.getSelectedValue();
      if (actualValue !== expectedValue) {
        throw new Error(`Expected selected value "${expectedValue}" but got "${actualValue}"`);
      }
    }
    
    if (expectedText !== undefined) {
      const actualText = await this.getSelectedText();
      if (actualText.trim() !== expectedText.trim()) {
        throw new Error(`Expected selected text "${expectedText}" but got "${actualText}"`);
      }
    }
    
    this.logAction('verified');
    return this;
  }
}

/**
 * Factory function for creating Dropdown elements
 */
export function Dropdown(locator: Locator, options?: DropdownOptions): DropdownElement {
  return new DropdownElement(locator, options);
}
