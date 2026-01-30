/**
 * RadioButton Element
 * Wrapper for radio button inputs
 */

import { Locator } from '@playwright/test';
import { BaseElement, ElementOptions } from './base-element';

export interface RadioButtonOptions extends ElementOptions {
  /** Force action */
  force?: boolean;
}

/**
 * RadioButton element wrapper
 */
export class RadioButtonElement extends BaseElement {
  protected radioOptions: RadioButtonOptions;

  constructor(locator: Locator, options: RadioButtonOptions = {}) {
    super(locator, options);
    this.radioOptions = {
      force: false,
      ...options,
    };
  }

  /**
   * Select the radio button
   */
  public async select(): Promise<this> {
    await this.executeWithRetry(async () => {
      this.logAction('select');
      await this.waitFor();
      await this.locator.check({
        timeout: this.options.timeout,
        force: this.radioOptions.force,
      });
    }, 'select');
    return this;
  }

  /**
   * Check if radio button is selected
   */
  public async isSelected(): Promise<boolean> {
    return await this.executeWithRetry(async () => {
      await this.waitFor();
      return await this.locator.isChecked();
    }, 'isSelected');
  }

  /**
   * Force select (bypass actionability checks)
   */
  public forceSelect(): this {
    this.radioOptions.force = true;
    return this;
  }

  /**
   * Get radio button label
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
   * Get radio button value
   */
  public async getValue(): Promise<string | null> {
    return await this.getAttribute('value');
  }

  /**
   * Get radio button name (group name)
   */
  public async getGroupName(): Promise<string | null> {
    return await this.getAttribute('name');
  }

  /**
   * Verify selection state
   */
  public async andVerify(expectedSelected: boolean = true): Promise<this> {
    const actualSelected = await this.isSelected();
    if (actualSelected !== expectedSelected) {
      throw new Error(
        `Expected radio button to be ${expectedSelected ? 'selected' : 'not selected'} but was ${actualSelected ? 'selected' : 'not selected'}`
      );
    }
    this.logAction('verified', { selected: actualSelected });
    return this;
  }
}

/**
 * RadioGroup helper for managing radio button groups
 */
export class RadioGroup {
  private page: Locator['page'] extends () => infer P ? P : never;
  private groupName: string;
  private container: Locator;

  constructor(container: Locator, groupName: string) {
    this.container = container;
    this.page = container.page();
    this.groupName = groupName;
  }

  /**
   * Get all radio buttons in the group
   */
  private getRadioButtons(): Locator {
    return this.container.locator(`input[type="radio"][name="${this.groupName}"]`);
  }

  /**
   * Select radio by value
   */
  public async selectByValue(value: string): Promise<void> {
    const radio = this.container.locator(`input[type="radio"][name="${this.groupName}"][value="${value}"]`);
    await radio.check();
  }

  /**
   * Select radio by index
   */
  public async selectByIndex(index: number): Promise<void> {
    const radio = this.getRadioButtons().nth(index);
    await radio.check();
  }

  /**
   * Get selected value
   */
  public async getSelectedValue(): Promise<string | null> {
    const checked = this.container.locator(`input[type="radio"][name="${this.groupName}"]:checked`);
    if (await checked.count() === 0) {
      return null;
    }
    return await checked.getAttribute('value');
  }

  /**
   * Get all options in the group
   */
  public async getOptions(): Promise<{ value: string | null; label: string | null }[]> {
    const radios = this.getRadioButtons();
    const count = await radios.count();
    const options: { value: string | null; label: string | null }[] = [];

    for (let i = 0; i < count; i++) {
      const radio = radios.nth(i);
      const value = await radio.getAttribute('value');
      const id = await radio.getAttribute('id');
      let label: string | null = null;

      if (id) {
        const labelEl = this.page.locator(`label[for="${id}"]`);
        if (await labelEl.count() > 0) {
          label = await labelEl.textContent();
        }
      }

      options.push({ value, label });
    }

    return options;
  }

  /**
   * Get count of radio buttons in group
   */
  public async getCount(): Promise<number> {
    return await this.getRadioButtons().count();
  }
}

/**
 * Factory function for creating RadioButton elements
 */
export function RadioButton(locator: Locator, options?: RadioButtonOptions): RadioButtonElement {
  return new RadioButtonElement(locator, options);
}

/**
 * Factory function for creating RadioGroup
 */
export function createRadioGroup(container: Locator, groupName: string): RadioGroup {
  return new RadioGroup(container, groupName);
}
