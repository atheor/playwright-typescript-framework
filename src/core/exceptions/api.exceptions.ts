/**
 * API-related Exceptions
 */

import { FrameworkException } from './framework.exception';

/**
 * Thrown when API request fails
 */
export class ApiRequestException extends FrameworkException {
  constructor(
    method: string,
    url: string,
    statusCode: number,
    responseBody?: unknown,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `API ${method} request to "${url}" failed with status ${statusCode}`,
      'API_REQUEST_FAILED',
      {
        method,
        url,
        statusCode,
        responseBody,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when API response validation fails
 */
export class ApiValidationException extends FrameworkException {
  constructor(
    endpoint: string,
    validationErrors: string[],
    response?: unknown,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `API response validation failed for "${endpoint}": ${validationErrors.join(', ')}`,
      'API_VALIDATION_FAILED',
      {
        endpoint,
        validationErrors,
        response,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when API request times out
 */
export class ApiTimeoutException extends FrameworkException {
  constructor(
    method: string,
    url: string,
    timeout: number,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `API ${method} request to "${url}" timed out after ${timeout}ms`,
      'API_TIMEOUT',
      {
        method,
        url,
        timeout,
        ...additionalInfo,
      }
    );
  }
}

/**
 * Thrown when API authentication fails
 */
export class ApiAuthenticationException extends FrameworkException {
  constructor(
    url: string,
    reason: string,
    additionalInfo?: Record<string, unknown>
  ) {
    super(
      `API authentication failed for "${url}": ${reason}`,
      'API_AUTH_FAILED',
      {
        url,
        reason,
        ...additionalInfo,
      }
    );
  }
}
