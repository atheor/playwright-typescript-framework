/**
 * Wait Utilities
 * Provides various waiting strategies
 */

import { Page, Locator } from '@playwright/test';
import { FrameworkConfig } from '../core/config';
import { Logger } from './logger';
import { TimeoutException } from '../core/exceptions';

const logger = Logger.getInstance();

/**
 * Wait for a condition to be true
 * @param condition Function that returns true when condition is met
 * @param options Wait options
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const timeout = options.timeout ?? FrameworkConfig.getTimeouts().default;
  const interval = options.interval ?? 100;
  const message = options.message ?? 'Condition not met';

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new TimeoutException(message, timeout);
}

/**
 * Wait for element to be in a specific state
 */
export async function waitForElementState(
  locator: Locator,
  state: 'visible' | 'hidden' | 'attached' | 'detached' | 'enabled' | 'disabled',
  timeout?: number
): Promise<void> {
  const actualTimeout = timeout ?? FrameworkConfig.getTimeouts().element;

  logger.debug(`Waiting for element to be ${state}`, { timeout: actualTimeout });

  switch (state) {
    case 'visible':
      await locator.waitFor({ state: 'visible', timeout: actualTimeout });
      break;
    case 'hidden':
      await locator.waitFor({ state: 'hidden', timeout: actualTimeout });
      break;
    case 'attached':
      await locator.waitFor({ state: 'attached', timeout: actualTimeout });
      break;
    case 'detached':
      await locator.waitFor({ state: 'detached', timeout: actualTimeout });
      break;
    case 'enabled':
      await waitForCondition(() => locator.isEnabled(), {
        timeout: actualTimeout,
        message: 'Element not enabled',
      });
      break;
    case 'disabled':
      await waitForCondition(() => locator.isDisabled(), {
        timeout: actualTimeout,
        message: 'Element not disabled',
      });
      break;
  }
}

/**
 * Wait for page to be ready
 */
export async function waitForPageReady(
  page: Page,
  options: {
    timeout?: number;
    waitForNetworkIdle?: boolean;
  } = {}
): Promise<void> {
  const timeout = options.timeout ?? FrameworkConfig.getTimeouts().navigation;

  logger.debug('Waiting for page to be ready');

  await page.waitForLoadState('domcontentloaded', { timeout });
  
  if (options.waitForNetworkIdle) {
    await page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Wait for URL to match pattern
 */
export async function waitForUrl(
  page: Page,
  urlPattern: string | RegExp,
  timeout?: number
): Promise<void> {
  const actualTimeout = timeout ?? FrameworkConfig.getTimeouts().navigation;

  logger.debug(`Waiting for URL to match: ${urlPattern.toString()}`);

  await page.waitForURL(urlPattern, { timeout: actualTimeout });
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(
  page: Page,
  text: string,
  options: {
    timeout?: number;
    exact?: boolean;
  } = {}
): Promise<Locator> {
  const timeout = options.timeout ?? FrameworkConfig.getTimeouts().element;
  const locator = options.exact
    ? page.getByText(text, { exact: true })
    : page.getByText(text);

  await locator.waitFor({ state: 'visible', timeout });
  return locator;
}

/**
 * Wait with custom polling
 */
export async function poll<T>(
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    interval?: number;
    validator?: (result: T) => boolean;
  } = {}
): Promise<T> {
  const timeout = options.timeout ?? FrameworkConfig.getTimeouts().default;
  const interval = options.interval ?? 500;
  const validator = options.validator ?? ((result: T) => result !== null && result !== undefined);

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await fn();
    if (validator(result)) {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new TimeoutException('Polling condition not met', timeout);
}
