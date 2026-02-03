/**
 * PII Detector Unit Tests
 * Following TDD: Write tests first, then implementation
 */

import { PIIDetector } from '../../src/analyzers/pii-detector';

describe('PIIDetector', () => {
  let detector: PIIDetector;

  beforeEach(() => {
    detector = new PIIDetector();
  });

  describe('Email Detection', () => {
    it('should detect valid email addresses', () => {
      const code = `
        const userEmail = 'john.doe@example.com';
        const adminEmail = 'admin@company.org';
      `;

      const matches = detector.detectEmails(code);

      expect(matches).toHaveLength(2);
      expect(matches[0].type).toBe('email');
      expect(matches[0].value).toBe('john.doe@example.com');
      expect(matches[1].value).toBe('admin@company.org');
    });

    it('should not detect invalid email patterns', () => {
      const code = `
        const notEmail = '@example.com';
        const alsoNot = 'user@';
      `;

      const matches = detector.detectEmails(code);

      expect(matches).toHaveLength(0);
    });

    it('should include line numbers and context', () => {
      const code = `const email = 'test@example.com';`;

      const matches = detector.detectEmails(code);

      expect(matches[0].line).toBeGreaterThanOrEqual(0);
      expect(matches[0].context).toContain('test@example.com');
    });
  });

  describe('SSN Detection', () => {
    it('should detect SSN patterns with hyphens', () => {
      const code = `const ssn = '123-45-6789';`;

      const matches = detector.detectSSN(code);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('ssn');
      expect(matches[0].value).toBe('123-45-6789');
    });

    it('should detect SSN patterns without hyphens', () => {
      const code = `const ssn = '123456789';`;

      const matches = detector.detectSSN(code);

      expect(matches).toHaveLength(1);
      expect(matches[0].value).toBe('123456789');
    });

    it('should not detect invalid SSN patterns', () => {
      const code = `const notSSN = '000-00-0000';`;

      const matches = detector.detectSSN(code);

      expect(matches).toHaveLength(0);
    });
  });

  describe('Credit Card Detection', () => {
    it('should detect Visa card patterns', () => {
      const code = `const visa = '4532-1488-0343-6467';`;

      const matches = detector.detectCreditCards(code);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('credit_card');
    });

    it('should detect MasterCard patterns', () => {
      const code = `const mastercard = '5425-2334-3010-9903';`;

      const matches = detector.detectCreditCards(code);

      expect(matches).toHaveLength(1);
    });

    it('should detect American Express patterns', () => {
      const code = `const amex = '3782-822463-10005';`;

      const matches = detector.detectCreditCards(code);

      expect(matches).toHaveLength(1);
    });

    it('should detect cards without hyphens', () => {
      const code = `const card = '4532148803436467';`;

      const matches = detector.detectCreditCards(code);

      expect(matches).toHaveLength(1);
    });
  });

  describe('Phone Number Detection', () => {
    it('should detect US phone numbers with hyphens', () => {
      const code = `const phone = '555-123-4567';`;

      const matches = detector.detectPhoneNumbers(code);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('phone');
    });

    it('should detect phone numbers with parentheses', () => {
      const code = `const phone = '(555) 123-4567';`;

      const matches = detector.detectPhoneNumbers(code);

      expect(matches).toHaveLength(1);
    });

    it('should detect international format', () => {
      const code = `const phone = '+1-555-123-4567';`;

      const matches = detector.detectPhoneNumbers(code);

      expect(matches).toHaveLength(1);
    });
  });

  describe('Health Data Detection', () => {
    it('should detect medical record numbers', () => {
      const code = `const mrn = 'MRN-12345678';`;

      const matches = detector.detectHealthData(code);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('health_data');
    });

    it('should detect health insurance numbers', () => {
      const code = `const insurance = 'HIN-987654321';`;

      const matches = detector.detectHealthData(code);

      expect(matches).toHaveLength(1);
    });
  });

  describe('Combined Detection', () => {
    it('should detect all PII types in mixed code', () => {
      const code = `
        const user = {
          email: 'john@example.com',
          ssn: '123-45-6789',
          phone: '555-123-4567',
          creditCard: '4532-1488-0343-6467',
          medicalRecord: 'MRN-12345678'
        };
      `;

      const matches = detector.detectAll(code);

      expect(matches.length).toBeGreaterThanOrEqual(5);

      const types = matches.map(m => m.type);
      expect(types).toContain('email');
      expect(types).toContain('ssn');
      expect(types).toContain('phone');
      expect(types).toContain('credit_card');
      expect(types).toContain('health_data');
    });

    it('should return empty array for code without PII', () => {
      const code = `
        const config = {
          port: 3000,
          host: 'localhost'
        };
      `;

      const matches = detector.detectAll(code);

      expect(matches).toHaveLength(0);
    });
  });

  describe('Context Extraction', () => {
    it('should extract surrounding context for matches', () => {
      const code = `const email = 'test@example.com'; // User email`;

      const matches = detector.detectEmails(code);

      expect(matches[0].context).toContain('test@example.com');
      expect(matches[0].context).toContain('email');
    });
  });

  describe('Position Tracking', () => {
    it('should track accurate line numbers', () => {
      const code = `line 1\nline 2\nconst email = 'test@example.com';\nline 4`;

      const matches = detector.detectEmails(code);

      expect(matches[0].line).toBe(2); // 0-indexed, so line 3
    });

    it('should track column positions', () => {
      const code = `const email = 'test@example.com';`;

      const matches = detector.detectEmails(code);

      expect(matches[0].column).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', () => {
      const matches = detector.detectAll('');

      expect(matches).toHaveLength(0);
    });

    it('should handle code with comments containing PII', () => {
      const code = `
        // Contact: admin@example.com
        const config = {};
      `;

      const matches = detector.detectEmails(code);

      expect(matches).toHaveLength(1);
    });

    it('should handle code with string literals containing PII', () => {
      const code = `
        const message = "Contact us at support@example.com";
      `;

      const matches = detector.detectEmails(code);

      expect(matches).toHaveLength(1);
    });

    it('should not detect PII in URLs or domains', () => {
      const code = `
        const url = 'https://example.com/api';
        const domain = 'example.com';
      `;

      const matches = detector.detectEmails(code);

      expect(matches).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle large code files efficiently', () => {
      const largeCode = Array(1000).fill('const x = 1;').join('\n');

      const startTime = Date.now();
      detector.detectAll(largeCode);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
