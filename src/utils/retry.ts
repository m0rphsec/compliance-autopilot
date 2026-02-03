/**
 * Retry logic with exponential backoff
 *
 * @module utils/retry
 */

import { createLogger } from './logger';
import { isRetryableError, getRetryDelay } from './errors';

const logger = createLogger('retry');

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay between retries (ms) */
  initialDelayMs?: number;
  /** Maximum delay between retries (ms) */
  maxDelayMs?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Whether to add jitter to delays */
  jitter?: boolean;
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  shouldRetry: isRetryableError,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const exponentialDelay =
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  let delay = Math.min(exponentialDelay, options.maxDelayMs);

  if (options.jitter) {
    // Add random jitter (±25%)
    const jitterRange = delay * 0.25;
    const jitterAmount = Math.random() * jitterRange * 2 - jitterRange;
    delay = Math.max(0, delay + jitterAmount);
  }

  return Math.floor(delay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt >= opts.maxAttempts) {
        logger.error(
          `Max retry attempts (${opts.maxAttempts}) exceeded`,
          lastError
        );
        throw lastError;
      }

      if (!opts.shouldRetry(lastError)) {
        logger.debug('Error is not retryable, throwing immediately');
        throw lastError;
      }

      // Calculate delay (use error-specific delay if available)
      const errorDelay = getRetryDelay(lastError, attempt);
      const backoffDelay = calculateDelay(attempt, opts);
      const delay = Math.max(errorDelay, backoffDelay);

      logger.warn(
        `Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms`,
        {
          error: lastError.message,
          attempt,
          maxAttempts: opts.maxAttempts,
          delayMs: delay,
        }
      );

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Retry with specific error handling
 */
export async function retryWithHandler<T>(
  fn: () => Promise<T>,
  errorHandler: (error: Error, attempt: number) => Promise<void>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      await errorHandler(lastError, attempt);

      if (attempt >= opts.maxAttempts || !opts.shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw lastError!;
}
