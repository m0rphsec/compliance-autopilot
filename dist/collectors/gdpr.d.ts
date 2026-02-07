/**
 * GDPR Collector - Comprehensive GDPR compliance analysis
 * Combines regex PII detection with Claude contextual analysis
 */
import { GDPRCollectorResult, PIIDetectionResult } from '../types';
interface ScanFileInput {
    code: string;
    path: string;
}
export declare class GDPRCollector {
    private anthropic;
    private piiDetector;
    private cache;
    constructor(config: {
        apiKey: string;
    });
    /**
     * Scan a single file for GDPR compliance
     */
    scanFile(code: string, _filePath: string): Promise<PIIDetectionResult>;
    /**
     * Scan multiple files (repository-wide analysis)
     */
    scanRepository(files: ScanFileInput[]): Promise<GDPRCollectorResult>;
    /**
     * Analyze code with Claude using exact prompt template
     */
    private analyzeWithClaude;
    /**
     * Detect HTTPS/TLS usage for transit encryption
     */
    private detectEncryptionTransit;
    /**
     * Detect database encryption patterns
     */
    private detectEncryptionRest;
    /**
     * Detect consent mechanism
     */
    private detectConsentMechanism;
    /**
     * Detect data retention policies
     */
    private detectRetentionPolicy;
    /**
     * Detect deletion capability
     */
    private detectDeletionCapability;
    /**
     * Infer collection methods from code patterns
     */
    private inferCollectionMethods;
    /**
     * Calculate compliance based on requirements
     */
    private calculateCompliance;
    /**
     * Add violations based on missing requirements
     */
    private addViolations;
    /**
     * Categorize violation severity
     */
    private categorizeSeverity;
    /**
     * Get recommendation for violation
     */
    private getRecommendation;
    /**
     * Calculate overall repository score
     */
    private calculateRepositoryScore;
    /**
     * Generate cache key for code content
     */
    private getCacheKey;
}
export {};
//# sourceMappingURL=gdpr.d.ts.map