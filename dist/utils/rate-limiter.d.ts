/**
 * Rate limiting with exponential backoff and retry logic
 */
import { RateLimitConfig, RetryConfig } from '../types/analyzer';
export declare class RateLimiter {
    private requestQueue;
    private activeRequests;
    private config;
    constructor(config?: Partial<RateLimitConfig>);
    /**
     * Wait for rate limit availability
     */
    acquire(): Promise<void>;
    /**
     * Release rate limit slot
     */
    release(): void;
    /**
     * Execute function with rate limiting and retry logic
     */
    execute<T>(fn: () => Promise<T>, retryConfig?: Partial<RetryConfig>): Promise<T>;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Get current rate limiter status
     */
    getStatus(): {
        activeRequests: number;
        queuedRequests: number;
        requestsInLastMinute: number;
    };
}
//# sourceMappingURL=rate-limiter.d.ts.map