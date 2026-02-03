/**
 * PII Detector - Regex-based detection for common PII patterns
 * Used as fast initial scan before Claude contextual analysis
 */

import { PIIMatch } from '../types';

export class PIIDetector {
  private readonly patterns = {
    // Email: standard RFC 5322 simplified pattern
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // SSN: XXX-XX-XXXX or XXXXXXXXX (excluding all zeros)
    ssn: /\b(?!000|666|9\d{2})\d{3}-?(?!00)\d{2}-?(?!0000)\d{4}\b/g,

    // Credit Cards: Visa, MasterCard, Amex, Discover
    creditCard:
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    creditCardWithHyphens:
      /\b(?:4[0-9]{3}-?[0-9]{4}-?[0-9]{4}-?[0-9]{4}|5[1-5][0-9]{2}-?[0-9]{4}-?[0-9]{4}-?[0-9]{4}|3[47][0-9]{2}-?[0-9]{6}-?[0-9]{5})\b/g,

    // Phone: US formats (555-123-4567, (555) 123-4567, +1-555-123-4567)
    phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,

    // Health data: MRN, HIN patterns
    medicalRecord: /\b(?:MRN|HIN)[-:\s]?[0-9]{6,10}\b/gi,

    // IP Address (can be PII in some contexts)
    ipAddress:
      /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  };

  // Not currently used - kept for future enhancement
  // private readonly excludePatterns = {
  //   commonDomains: /\b(?:localhost|example\.com|test\.com|0\.0\.0\.0|127\.0\.0\.1)\b/gi,
  //   versions: /\bv?\d+\.\d+\.\d+\b/gi,
  // };

  /**
   * Detect email addresses in code
   */
  detectEmails(code: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      // Reset regex lastIndex for each line
      const regex = new RegExp(this.patterns.email.source, 'g');
      let match: RegExpExecArray | null;

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
  detectSSN(code: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      const regex = new RegExp(this.patterns.ssn.source, 'g');
      let match: RegExpExecArray | null;

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
  detectCreditCards(code: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check both with and without hyphens
      const patterns = [
        this.patterns.creditCard.source,
        this.patterns.creditCardWithHyphens.source,
      ];

      patterns.forEach((patternSource) => {
        const regex = new RegExp(patternSource, 'g');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
          // Luhn algorithm validation
          const cardNumber = match[0].replace(/[-\s]/g, '');
          if (this.validateLuhn(cardNumber)) {
            matches.push({
              type: 'credit_card',
              value: match[0],
              line: lineIndex,
              column: match.index,
              context: this.extractContext(line, match.index, match[0].length),
            });
          }
        }
      });
    });

    return matches;
  }

  /**
   * Detect phone numbers
   */
  detectPhoneNumbers(code: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      const regex = new RegExp(this.patterns.phone.source, 'g');
      let match: RegExpExecArray | null;

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
  detectHealthData(code: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      const regex = new RegExp(this.patterns.medicalRecord.source, 'gi');
      let match: RegExpExecArray | null;

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
  detectAll(code: string): PIIMatch[] {
    if (!code || code.trim().length === 0) {
      return [];
    }

    const allMatches: PIIMatch[] = [
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
  private extractContext(line: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(line.length, index + length + 50);
    let context = line.substring(start, end);

    if (start > 0) context = '...' + context;
    if (end < line.length) context = context + '...';

    return context;
  }

  /**
   * Validate credit card using Luhn algorithm
   */
  private validateLuhn(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    // Loop through values starting from the rightmost
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
}
