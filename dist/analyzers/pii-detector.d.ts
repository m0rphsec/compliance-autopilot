/**
 * PII Detector - Regex-based detection for common PII patterns
 * Used as fast initial scan before Claude contextual analysis
 */
import { PIIMatch } from '../types';
export declare class PIIDetector {
    private readonly patterns;
    /**
     * Detect email addresses in code
     */
    detectEmails(code: string): PIIMatch[];
    /**
     * Detect Social Security Numbers
     */
    detectSSN(code: string): PIIMatch[];
    /**
     * Detect credit card numbers
     */
    detectCreditCards(code: string): PIIMatch[];
    /**
     * Detect phone numbers
     */
    detectPhoneNumbers(code: string): PIIMatch[];
    /**
     * Detect health-related data
     */
    detectHealthData(code: string): PIIMatch[];
    /**
     * Detect all PII types in code
     */
    detectAll(code: string): PIIMatch[];
    /**
     * Extract context around a match (±50 chars)
     */
    private extractContext;
}
//# sourceMappingURL=pii-detector.d.ts.map