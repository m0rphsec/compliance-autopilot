"use strict";
/**
 * PII Detector - Regex-based detection for common PII patterns
 * Used as fast initial scan before Claude contextual analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIIDetector = void 0;
class PIIDetector {
    patterns = {
        // Email: standard RFC 5322 simplified pattern
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        // SSN: XXX-XX-XXXX or XXXXXXXXX (excluding all zeros)
        ssn: /\b(?!000|666|9\d{2})\d{3}-?(?!00)\d{2}-?(?!0000)\d{4}\b/g,
        // Credit Cards: Visa (16 digits, 4xxx), MasterCard (16 digits, 51-55),
        // Amex (15 digits, 34/37), Discover (16 digits, 6011/65)
        // Matches both with and without hyphens/spaces
        creditCard: /\b(?:4[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|5[1-5][0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|3[47][0-9]{2}[-\s]?[0-9]{6}[-\s]?[0-9]{5}|6(?:011|5[0-9]{2})[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})\b/g,
        // Phone: US formats (555-123-4567, (555) 123-4567, +1-555-123-4567)
        phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        // Health data: MRN, HIN patterns
        medicalRecord: /\b(?:MRN|HIN)[-:\s]?[0-9]{6,10}\b/gi,
        // IP Address (can be PII in some contexts)
        ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    };
    // Not currently used - kept for future enhancement
    // private readonly excludePatterns = {
    //   commonDomains: /\b(?:localhost|example\.com|test\.com|0\.0\.0\.0|127\.0\.0\.1)\b/gi,
    //   versions: /\bv?\d+\.\d+\.\d+\b/gi,
    // };
    /**
     * Detect email addresses in code
     */
    detectEmails(code) {
        const matches = [];
        const lines = code.split('\n');
        lines.forEach((line, lineIndex) => {
            // Reset regex lastIndex for each line
            const regex = new RegExp(this.patterns.email.source, 'g');
            let match;
            while ((match = regex.exec(line)) !== null) {
                matches.push({
                    type: 'email',
                    value: match[0],
                    line: lineIndex,
                    column: match.index,
                    context: this.extractContext(line, match.index, match[0].length),
                });
            }
        });
        return matches;
    }
    /**
     * Detect Social Security Numbers
     */
    detectSSN(code) {
        const matches = [];
        const lines = code.split('\n');
        lines.forEach((line, lineIndex) => {
            const regex = new RegExp(this.patterns.ssn.source, 'g');
            let match;
            while ((match = regex.exec(line)) !== null) {
                // Additional validation: exclude all zeros
                if (!match[0].match(/^0+$/)) {
                    matches.push({
                        type: 'ssn',
                        value: match[0],
                        line: lineIndex,
                        column: match.index,
                        context: this.extractContext(line, match.index, match[0].length),
                    });
                }
            }
        });
        return matches;
    }
    /**
     * Detect credit card numbers
     */
    detectCreditCards(code) {
        const matches = [];
        const lines = code.split('\n');
        lines.forEach((line, lineIndex) => {
            const regex = new RegExp(this.patterns.creditCard.source, 'g');
            let match;
            while ((match = regex.exec(line)) !== null) {
                // For PII detection, we want to flag anything that looks like a card
                // Not just valid cards (Luhn check removed for better detection coverage)
                matches.push({
                    type: 'credit_card',
                    value: match[0],
                    line: lineIndex,
                    column: match.index,
                    context: this.extractContext(line, match.index, match[0].length),
                });
            }
        });
        return matches;
    }
    /**
     * Detect phone numbers
     */
    detectPhoneNumbers(code) {
        const matches = [];
        const lines = code.split('\n');
        lines.forEach((line, lineIndex) => {
            const regex = new RegExp(this.patterns.phone.source, 'g');
            let match;
            while ((match = regex.exec(line)) !== null) {
                matches.push({
                    type: 'phone',
                    value: match[0],
                    line: lineIndex,
                    column: match.index,
                    context: this.extractContext(line, match.index, match[0].length),
                });
            }
        });
        return matches;
    }
    /**
     * Detect health-related data
     */
    detectHealthData(code) {
        const matches = [];
        const lines = code.split('\n');
        lines.forEach((line, lineIndex) => {
            const regex = new RegExp(this.patterns.medicalRecord.source, 'gi');
            let match;
            while ((match = regex.exec(line)) !== null) {
                matches.push({
                    type: 'health_data',
                    value: match[0],
                    line: lineIndex,
                    column: match.index,
                    context: this.extractContext(line, match.index, match[0].length),
                });
            }
        });
        return matches;
    }
    /**
     * Detect all PII types in code
     */
    detectAll(code) {
        if (!code || code.trim().length === 0) {
            return [];
        }
        const allMatches = [
            ...this.detectEmails(code),
            ...this.detectSSN(code),
            ...this.detectCreditCards(code),
            ...this.detectPhoneNumbers(code),
            ...this.detectHealthData(code),
        ];
        // Sort by line number, then column
        return allMatches.sort((a, b) => {
            if (a.line !== b.line) {
                return a.line - b.line;
            }
            return a.column - b.column;
        });
    }
    /**
     * Extract context around a match (±50 chars)
     */
    extractContext(line, index, length) {
        const start = Math.max(0, index - 50);
        const end = Math.min(line.length, index + length + 50);
        let context = line.substring(start, end);
        if (start > 0)
            context = '...' + context;
        if (end < line.length)
            context = context + '...';
        return context;
    }
}
exports.PIIDetector = PIIDetector;
//# sourceMappingURL=pii-detector.js.map