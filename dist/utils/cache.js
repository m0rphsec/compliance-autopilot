"use strict";
/**
 * Response caching for identical code blocks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCache = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ResponseCache {
    cache;
    maxSize;
    ttlMs;
    constructor(maxSize = 1000, ttlMs = 3600000) {
        // 1 hour TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }
    /**
     * Generate cache key from code content and framework
     */
    generateKey(code, framework) {
        const hash = crypto_1.default.createHash('sha256').update(`${code}:${framework}`).digest('hex');
        return hash;
    }
    /**
     * Get cached response if available and not expired
     */
    get(code, framework) {
        const key = this.generateKey(code, framework);
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if entry is expired
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        // Update hit count
        entry.hits++;
        return entry.response;
    }
    /**
     * Store response in cache
     */
    set(code, framework, response) {
        const key = this.generateKey(code, framework);
        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        const entry = {
            hash: key,
            response: { ...response, metadata: { ...response.metadata, cached: true } },
            timestamp: Date.now(),
            hits: 0,
        };
        this.cache.set(key, entry);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        let totalHits = 0;
        const totalEntries = this.cache.size;
        for (const entry of this.cache.values()) {
            totalHits += entry.hits;
        }
        return {
            size: totalEntries,
            maxSize: this.maxSize,
            hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
        };
    }
    /**
     * Remove expired entries
     */
    cleanup() {
        let removed = 0;
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttlMs) {
                this.cache.delete(key);
                removed++;
            }
        }
        return removed;
    }
}
exports.ResponseCache = ResponseCache;
//# sourceMappingURL=cache.js.map