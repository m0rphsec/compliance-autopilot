/**
 * Claude Sonnet 4.5 Code Analyzer
 * Smart prompting, rate limiting, retry logic, caching, and cost optimization
 */
import { AnalysisRequest, AnalysisResponse, BatchAnalysisRequest, BatchAnalysisResponse, RateLimitConfig } from '../types/analyzer';
export declare class CodeAnalyzer {
    private client;
    private cache;
    private rateLimiter;
    private modelVersion;
    constructor(apiKey: string, rateLimitConfig?: Partial<RateLimitConfig>, cacheConfig?: {
        maxSize?: number;
        ttlMs?: number;
    });
    /**
     * Analyze a single file for compliance violations
     */
    analyzeFile(request: AnalysisRequest): Promise<AnalysisResponse>;
    /**
     * Analyze multiple files in parallel with batching
     */
    analyzeBatch(batchRequest: BatchAnalysisRequest): Promise<BatchAnalysisResponse>;
    /**
     * Build optimized prompt for Claude
     */
    private buildPrompt;
    /**
     * Build SOC2-specific prompt
     */
    private buildSOC2Prompt;
    /**
     * Build GDPR-specific prompt
     */
    private buildGDPRPrompt;
    /**
     * Build ISO27001-specific prompt
     */
    private buildISO27001Prompt;
    /**
     * Call Claude API with optimized settings
     */
    private callClaude;
    /**
     * Parse Claude response into structured format
     */
    private parseResponse;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    /**
     * Get rate limiter status
     */
    getRateLimiterStatus(): {
        activeRequests: number;
        queuedRequests: number;
        requestsInLastMinute: number;
    };
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Cleanup expired cache entries
     */
    cleanupCache(): number;
}
//# sourceMappingURL=code-analyzer.d.ts.map