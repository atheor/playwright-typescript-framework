/**
 * Assertion Utilities
 * Custom assertion helpers that provide meaningful error messages
 */

import { expect, Locator, Page } from '@playwright/test';
import { AssertionException } from '../core/exceptions';
import { Logger } from './logger';

const logger = Logger.getInstance();

/**
 * Custom assertions for enhanced error messages
 */
export class Assertions {
  /**
   * Assert element is visible
   */
  public static async elementIsVisible(
    locator: Locator,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element is visible`);
    await expect(locator, message ?? 'Element should be visible').toBeVisible();
  }

  /**
   * Assert element is hidden
   */
  public static async elementIsHidden(
    locator: Locator,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element is hidden`);
    await expect(locator, message ?? 'Element should be hidden').toBeHidden();
  }

  /**
   * Assert element has text
   */
  public static async elementHasText(
    locator: Locator,
    expectedText: string | RegExp,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element has text: ${expectedText.toString()}`);
    await expect(locator, message ?? `Element should have text "${expectedText}"`).toHaveText(
      expectedText
    );
  }

  /**
   * Assert element contains text
   */
  public static async elementContainsText(
    locator: Locator,
    text: string,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element contains text: ${text}`);
    await expect(locator, message ?? `Element should contain text "${text}"`).toContainText(text);
  }

  /**
   * Assert element has value
   */
  public static async elementHasValue(
    locator: Locator,
    expectedValue: string | RegExp,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element has value: ${expectedValue.toString()}`);
    await expect(locator, message ?? `Element should have value "${expectedValue}"`).toHaveValue(
      expectedValue
    );
  }

  /**
   * Assert element is enabled
   */
  public static async elementIsEnabled(
    locator: Locator,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element is enabled`);
    await expect(locator, message ?? 'Element should be enabled').toBeEnabled();
  }

  /**
   * Assert element is disabled
   */
  public static async elementIsDisabled(
    locator: Locator,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element is disabled`);
    await expect(locator, message ?? 'Element should be disabled').toBeDisabled();
  }

  /**
   * Assert element is checked
   */
  public static async elementIsChecked(
    locator: Locator,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element is checked`);
    await expect(locator, message ?? 'Element should be checked').toBeChecked();
  }

  /**
   * Assert element is not checked
   */
  public static async elementIsNotChecked(
    locator: Locator,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element is not checked`);
    await expect(locator, message ?? 'Element should not be checked').not.toBeChecked();
  }

  /**
   * Assert element has attribute
   */
  public static async elementHasAttribute(
    locator: Locator,
    name: string,
    value: string | RegExp,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element has attribute ${name}=${value.toString()}`);
    await expect(
      locator,
      message ?? `Element should have attribute "${name}" with value "${value}"`
    ).toHaveAttribute(name, value);
  }

  /**
   * Assert element has CSS property
   */
  public static async elementHasCSS(
    locator: Locator,
    property: string,
    value: string | RegExp,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element has CSS ${property}=${value.toString()}`);
    await expect(locator, message ?? `Element should have CSS "${property}: ${value}"`).toHaveCSS(
      property,
      value
    );
  }

  /**
   * Assert element count
   */
  public static async elementCount(
    locator: Locator,
    count: number,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting element count: ${count}`);
    await expect(locator, message ?? `Should have ${count} elements`).toHaveCount(count);
  }

  /**
   * Assert page has title
   */
  public static async pageHasTitle(
    page: Page,
    title: string | RegExp,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting page has title: ${title.toString()}`);
    await expect(page, message ?? `Page should have title "${title}"`).toHaveTitle(title);
  }

  /**
   * Assert page has URL
   */
  public static async pageHasUrl(
    page: Page,
    url: string | RegExp,
    message?: string
  ): Promise<void> {
    logger.debug(`Asserting page has URL: ${url.toString()}`);
    await expect(page, message ?? `Page should have URL "${url}"`).toHaveURL(url);
  }

  /**
   * Assert values are equal
   */
  public static assertEqual<T>(
    actual: T,
    expected: T,
    message?: string
  ): void {
    logger.debug(`Asserting equality: ${actual} === ${expected}`);
    if (actual !== expected) {
      throw new AssertionException(expected, actual, message ?? `Expected ${expected} but got ${actual}`);
    }
  }

  /**
   * Assert value is truthy
   */
  public static assertTrue(
    value: unknown,
    message?: string
  ): void {
    logger.debug(`Asserting truthy value`);
    if (!value) {
      throw new AssertionException(true, value, message ?? 'Expected truthy value');
    }
  }

  /**
   * Assert value is falsy
   */
  public static assertFalse(
    value: unknown,
    message?: string
  ): void {
    logger.debug(`Asserting falsy value`);
    if (value) {
      throw new AssertionException(false, value, message ?? 'Expected falsy value');
    }
  }

  /**
   * Assert array contains value
   */
  public static assertContains<T>(
    array: T[],
    value: T,
    message?: string
  ): void {
    logger.debug(`Asserting array contains: ${value}`);
    if (!array.includes(value)) {
      throw new AssertionException(
        `array containing ${value}`,
        array,
        message ?? `Array should contain ${value}`
      );
    }
  }

  /**
   * Assert object has property
   */
  public static assertHasProperty(
    obj: Record<string, unknown>,
    property: string,
    message?: string
  ): void {
    logger.debug(`Asserting object has property: ${property}`);
    if (!(property in obj)) {
      throw new AssertionException(
        `object with property "${property}"`,
        Object.keys(obj),
        message ?? `Object should have property "${property}"`
      );
    }
  }

  /**
   * Soft assertion - logs failure but doesn't throw
   */
  public static softAssert(
    condition: boolean,
    message: string
  ): { passed: boolean; message: string } {
    if (!condition) {
      logger.warn(`Soft assertion failed: ${message}`);
      return { passed: false, message };
    }
    logger.debug(`Soft assertion passed: ${message}`);
    return { passed: true, message };
  }
}
