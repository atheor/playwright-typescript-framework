/**
 * Workflow and Test Execution Exceptions
 */

import { FrameworkException } from './framework.exception';

/**
 * Thrown when a workflow step fails
 */
export class WorkflowExecutionException extends FrameworkException {
  constructor(
    workflowName: string,
    stepName: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Workflow "${workflowName}" failed at step "${stepName}": ${reason}`,
      'WORKFLOW_EXECUTION_FAILED',
      {
        workflowName,
        stepName,
        reason,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when test preconditions are not met
 */
export class PreconditionException extends FrameworkException {
  constructor(
    testName: string,
    precondition: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Precondition not met for test "${testName}": ${precondition}`,
      'PRECONDITION_NOT_MET',
      {
        testName,
        precondition,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when assertion fails with additional context
 */
export class AssertionException extends FrameworkException {
  constructor(
    expected: unknown,
    actual: unknown,
    message: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      message,
      'ASSERTION_FAILED',
      {
        expected,
        actual,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when test data is invalid or missing
 */
export class TestDataException extends FrameworkException {
  constructor(
    dataSource: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Test data error from "${dataSource}": ${reason}`,
      'TEST_DATA_ERROR',
      {
        dataSource,
        reason,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when page navigation fails
 */
export class NavigationException extends FrameworkException {
  constructor(
    url: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Navigation to "${url}" failed: ${reason}`,
      'NAVIGATION_FAILED',
      {
        url,
        reason,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Generic timeout exception
 */
export class TimeoutException extends FrameworkException {
  constructor(
    operation: string,
    timeout: number,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Operation "${operation}" timed out after ${timeout}ms`,
      'TIMEOUT',
      {
        operation,
        timeout,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Configuration error exception
 */
export class ConfigurationException extends FrameworkException {
  constructor(
    configKey: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `Configuration error for "${configKey}": ${reason}`,
      'CONFIGURATION_ERROR',
      {
        configKey,
        reason,
        ...additionalInfo,
      }
    );
  }
}
