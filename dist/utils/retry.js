"use strict";
/**
 * Retry logic with exponential backoff
 *
 * @module utils/retry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
exports.retryWithHandler = retryWithHandler;
const logger_1 = require("./logger");
const errors_1 = require("./errors");
const logger = (0, logger_1.createLogger)('retry');
const DEFAULT_OPTIONS = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true,
    shouldRetry: errors_1.isRetryableError,
};
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt, options) {
    const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
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
async function retry(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt >= opts.maxAttempts) {
                logger.error(`Max retry attempts (${opts.maxAttempts}) exceeded`, lastError);
                throw lastError;
            }
            if (!opts.shouldRetry(lastError)) {
                logger.debug('Error is not retryable, throwing immediately');
                throw lastError;
            }
            // Calculate delay (use error-specific delay if available)
            const errorDelay = (0, errors_1.getRetryDelay)(lastError, attempt);
            const backoffDelay = calculateDelay(attempt, opts);
            const delay = Math.max(errorDelay, backoffDelay);
            logger.warn(`Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms`, {
                error: lastError.message,
                attempt,
                maxAttempts: opts.maxAttempts,
                delayMs: delay,
            });
            await sleep(delay);
        }
    }
    throw lastError;
}
/**
 * Retry with specific error handling
 */
async function retryWithHandler(fn, errorHandler, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            await errorHandler(lastError, attempt);
            if (attempt >= opts.maxAttempts || !opts.shouldRetry(lastError)) {
                throw lastError;
            }
            const delay = calculateDelay(attempt, opts);
            await sleep(delay);
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map