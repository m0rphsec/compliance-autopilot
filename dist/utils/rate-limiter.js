"use strict";
/**
 * Rate limiting with exponential backoff and retry logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    requestQueue = [];
    activeRequests = 0;
    config;
    constructor(config = {}) {
        this.config = {
            maxRequestsPerMinute: config.maxRequestsPerMinute || 50,
            maxConcurrentRequests: config.maxConcurrentRequests || 10,
            backoffMultiplier: config.backoffMultiplier || 2,
            maxRetries: config.maxRetries || 3,
        };
    }
    /**
     * Wait for rate limit availability
     */
    async acquire() {
        // Wait for concurrent request slot
        while (this.activeRequests >= this.config.maxConcurrentRequests) {
            await this.sleep(100);
        }
        // Clean old requests from queue (older than 1 minute)
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        this.requestQueue = this.requestQueue.filter((time) => time > oneMinuteAgo);
        // Wait if we've hit the rate limit
        if (this.requestQueue.length >= this.config.maxRequestsPerMinute) {
            const oldestRequest = this.requestQueue[0];
            const waitTime = 60000 - (now - oldestRequest);
            if (waitTime > 0) {
                await this.sleep(waitTime);
            }
            // Recursively try again
            return this.acquire();
        }
        this.requestQueue.push(now);
        this.activeRequests++;
    }
    /**
     * Release rate limit slot
     */
    release() {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
    }
    /**
     * Execute function with rate limiting and retry logic
     */
    async execute(fn, retryConfig) {
        const config = {
            maxAttempts: retryConfig?.maxAttempts || this.config.maxRetries,
            initialDelayMs: retryConfig?.initialDelayMs || 1000,
            maxDelayMs: retryConfig?.maxDelayMs || 30000,
            backoffMultiplier: retryConfig?.backoffMultiplier || this.config.backoffMultiplier,
        };
        let lastError = null;
        for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
            try {
                await this.acquire();
                const result = await fn();
                this.release();
                return result;
            }
            catch (error) {
                this.release();
                lastError = error;
                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                // Don't wait after last attempt
                if (attempt < config.maxAttempts - 1) {
                    const delay = Math.min(config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt), config.maxDelayMs);
                    console.warn(`Request failed (attempt ${attempt + 1}/${config.maxAttempts}), retrying in ${delay}ms:`, error);
                    await this.sleep(delay);
                }
            }
        }
        throw new Error(`Request failed after ${config.maxAttempts} attempts: ${lastError?.message}`);
    }
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        if (!(error instanceof Error))
            return false;
        const retryableErrors = [
            'rate_limit_error',
            'overloaded_error',
            'timeout',
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'network',
        ];
        const message = error.message.toLowerCase();
        return retryableErrors.some((err) => message.includes(err.toLowerCase()));
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get current rate limiter status
     */
    getStatus() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = this.requestQueue.filter((time) => time > oneMinuteAgo);
        return {
            activeRequests: this.activeRequests,
            queuedRequests: 0, // We don't queue, we wait
            requestsInLastMinute: recentRequests.length,
        };
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map