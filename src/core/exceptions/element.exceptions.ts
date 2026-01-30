/**
 * Element-related Exceptions
 */

import { FrameworkException } from './framework.exception';

/**
 * Thrown when an element cannot be found on the page
 */
export class ElementNotFoundException extends FrameworkException {
  constructor(
    selector: string,
    timeout: number,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Element not found: "${selector}" after waiting ${timeout}ms`,
      'ELEMENT_NOT_FOUND',
      {
        selector,
        timeout,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when an element is not interactable
 */
export class ElementNotInteractableException extends FrameworkException {
  constructor(
    selector: string,
    action: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Cannot ${action} element "${selector}": ${reason}`,
      'ELEMENT_NOT_INTERACTABLE',
      {
        selector,
        action,
        reason,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when an element interaction times out
 */
export class ElementTimeoutException extends FrameworkException {
  constructor(
    selector: string,
    action: string,
    timeout: number,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Timeout waiting for element "${selector}" during ${action} after ${timeout}ms`,
      'ELEMENT_TIMEOUT',
      {
        selector,
        action,
        timeout,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when element state doesn't match expected state
 */
export class ElementStateException extends FrameworkException {
  constructor(
    selector: string,
    expectedState: string,
    actualState: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Element "${selector}" state mismatch: expected "${expectedState}", got "${actualState}"`,
      'ELEMENT_STATE_MISMATCH',
      {
        selector,
        expectedState,
        actualState,
        ...additionalInfo,
      }
    );
  }
}
