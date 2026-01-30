/**
 * Checkbox Element
 * Wrapper for checkbox inputs
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface CheckboxOptions extends ElementOptions {
  /** Force action */
  force?: boolean;
}

/**
 * Checkbox element wrapper
 */
export class CheckboxElement extends BaseElement {
  protected checkboxOptions: CheckboxOptions;

  constructor(locator: Locator, options: CheckboxOptions = {}) {
    super(locator, options);
    this.checkboxOptions = {
      force: false,
      ...options,
    };
  }

  /**
   * Check the checkbox
   */
  public async check(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('check');
      await this.waitFor();
      await this.locator.check({
        timeout: this.options.timeout,
        force: this.checkboxOptions.force,
      });
    }, 'check');
    return this;
  }

  /**
   * Uncheck the checkbox
   */
  public async uncheck(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('uncheck');
      await this.waitFor();
      await this.locator.uncheck({
        timeout: this.options.timeout,
        force: this.checkboxOptions.force,
      });
    }, 'uncheck');
    return this;
  }

  /**
   * Toggle the checkbox state
   */
  public async toggle(): Promise<this> {
    const isChecked = await this.isChecked();
    if (isChecked) {
      return await this.uncheck();
    }
    return await this.check();
  }

  /**
   * Set checkbox to specific state
   */
  public async setChecked(checked: boolean): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('setChecked', { checked });
      await this.waitFor();
      await this.locator.setChecked(checked, {
        timeout: this.options.timeout,
        force: this.checkboxOptions.force,
      });
    }, 'setChecked');
    return this;
  }

  /**
   * Check if checkbox is checked
   */
  public async isChecked(): Promise<boolean> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      return await this.locator.isChecked();
    }, 'isChecked');
  }

  /**
   * Force check (bypass actionability checks)
   */
  public forceCheck(): this {
    this.checkboxOptions.force = true;
    return this;
  }

  /**
   * Get checkbox label
   */
  public async getLabel(): Promise<string | null> {
    // Try to find associated label
    const id = await this.getAttribute('id');
    if (id) {
      const label = this.page.locator(`label[for="${id}"]`);
      if (await label.isVisible()) {
        return await label.textContent();
      }
    }

    // Try parent label
    const parentLabel = this.locator.locator('xpath=ancestor::label');
    if (await parentLabel.count() > 0) {
      return await parentLabel.first().textContent();
    }

    return null;
  }

  /**
   * Verify checkbox state
   */
  public async andVerify(expectedChecked: boolean): Promise<this> {
    const actualChecked = await this.isChecked();
    if (actualChecked !== expectedChecked) {
      throw new Error(
        `Expected checkbox to be ${expectedChecked ? 'checked' : 'unchecked'} but was ${actualChecked ? 'checked' : 'unchecked'}`
      );
    }
    this.logAction('verified', { checked: actualChecked });
    return this;
  }
}

/**
 * Factory function for creating Checkbox elements
 */
export function Checkbox(locator: Locator, options?: CheckboxOptions): CheckboxElement {
  return new CheckboxElement(locator, options);
}
