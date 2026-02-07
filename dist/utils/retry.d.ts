/**
 * Retry logic with exponential backoff
 *
 * @module utils/retry
 */
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
/**
 * Retry a function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry with specific error handling
 */
export declare function retryWithHandler<T>(fn: () => Promise<T>, errorHandler: (error: Error, attempt: number) => Promise<void>, options?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry.d.ts.map