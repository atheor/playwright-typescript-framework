/**
 * Retry Utility
 * Provides retry logic for flaky operations
 */

import { Logger } from './logger';

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Delay between retries in milliseconds */
  delay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum delay between retries */
  maxDelay?: number;
  /** Condition to retry on (return true to retry) */
  retryCondition?: (error: Error) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  retryCondition: () => true,
  onRetry: () => {},
};

/**
 * Execute a function with retry logic
 * @param fn Function to execute
 * @param options Retry options
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const logger = Logger.getInstance();
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error;
  let currentDelay = opts.delay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === opts.maxAttempts) {
        logger.error(`All ${opts.maxAttempts} retry attempts failed`, lastError);
        throw lastError;
      }

      if (!opts.retryCondition(lastError)) {
        logger.debug('Retry condition not met, throwing error');
        throw lastError;
      }

      opts.onRetry(attempt, lastError);
      logger.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`, {
        error: lastError.message,
      });

      await sleep(currentDelay);
      currentDelay = Math.min(
        currentDelay * opts.backoffMultiplier,
        opts.maxDelay
      );
    }
  }

  throw lastError!;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper function
 */
export function createRetryWrapper(
  defaultOptions: Partial<RetryOptions> = {}
): <T>(fn: () => Promise<T>, options?: Partial<RetryOptions>) => Promise<T> {
  return <T>(fn: () => Promise<T>, options?: Partial<RetryOptions>) => {
    return retry(fn, { ...defaultOptions, ...options });
  };
}

/**
 * Retry decorator for class methods
 */
export function Retry(options: Partial<RetryOptions> = {}): MethodDecorator {
  return function (
    _target: unknown,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return retry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
