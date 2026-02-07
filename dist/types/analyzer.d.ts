/**
 * TypeScript interfaces for code analysis requests and responses
 */
export interface AnalysisRequest {
    code: string;
    filePath: string;
    framework: 'soc2' | 'gdpr' | 'iso27001';
    language?: string;
    context?: string;
}
export interface AnalysisResponse {
    filePath: string;
    framework: string;
    compliant: boolean;
    violations: Violation[];
    recommendations: string[];
    score: number;
    metadata: AnalysisMetadata;
}
export interface Violation {
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    lineNumbers?: number[];
    codeSnippet?: string;
    recommendation: string;
}
export interface AnalysisMetadata {
    analyzedAt: string;
    duration: number;
    tokensUsed: number;
    cached: boolean;
    modelVersion: string;
}
export interface BatchAnalysisRequest {
    requests: AnalysisRequest[];
    maxConcurrency?: number;
}
export interface BatchAnalysisResponse {
    results: AnalysisResponse[];
    summary: BatchSummary;
}
export interface BatchSummary {
    total: number;
    compliant: number;
    violations: number;
    totalDuration: number;
    cacheHitRate: number;
}
export interface CacheEntry {
    hash: string;
    response: AnalysisResponse;
    timestamp: number;
    hits: number;
}
export interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxConcurrentRequests: number;
    backoffMultiplier: number;
    maxRetries: number;
}
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}
//# sourceMappingURL=analyzer.d.ts.map