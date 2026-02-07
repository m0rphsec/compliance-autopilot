/**
 * Response caching for identical code blocks
 */
import { AnalysisResponse } from '../types/analyzer';
export declare class ResponseCache {
    private cache;
    private maxSize;
    private ttlMs;
    constructor(maxSize?: number, ttlMs?: number);
    /**
     * Generate cache key from code content and framework
     */
    private generateKey;
    /**
     * Get cached response if available and not expired
     */
    get(code: string, framework: string): AnalysisResponse | null;
    /**
     * Store response in cache
     */
    set(code: string, framework: string, response: AnalysisResponse): void;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    /**
     * Remove expired entries
     */
    cleanup(): number;
}
//# sourceMappingURL=cache.d.ts.map