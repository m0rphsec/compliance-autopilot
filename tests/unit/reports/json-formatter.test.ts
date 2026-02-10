/**
 * Unit tests for JSON report formatter
 * Tests JSON evidence structure and validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { JSONFormatter } from '../../../src/reports/json-formatter';
import { ComplianceData } from '../../../src/reports/pdf-generator';

function makeMinimalData(overrides?: Partial<ComplianceData>): ComplianceData {
  return {
    framework: 'SOC2',
    timestamp: new Date('2025-01-15T10:30:00Z'),
    repositoryName: 'test-repo',
    repositoryOwner: 'test-owner',
    overallScore: 85.5,
    controls: [
      {
        id: 'CC1.1',
        name: 'Code Review Process',
        status: 'PASS',
        evidence: 'All PRs require approval',
        severity: 'high',
      },
    ],
    summary: {
      total: 1,
      passed: 1,
      failed: 0,
      notApplicable: 0,
    },
    ...overrides,
  };
}

describe('JSON Formatter', () => {
  let formatter: JSONFormatter;

  beforeEach(() => {
    formatter = new JSONFormatter();
  });

  describe('Report Structure', () => {
    it('should create valid JSON with all required top-level fields', () => {
      const data = makeMinimalData();
      const json = formatter.format(data);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('framework');
      expect(parsed).toHaveProperty('frameworks');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('repository');
      expect(parsed).toHaveProperty('compliance');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('controls');
    });

    it('should include metadata with version, generator, and generatedAt', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));

      expect(parsed.metadata.version).toBe('1.0.0');
      expect(parsed.metadata.generator).toBe('Compliance Autopilot');
      expect(typeof parsed.metadata.generatedAt).toBe('string');
      // Verify generatedAt is a valid ISO 8601 timestamp
      expect(new Date(parsed.metadata.generatedAt).toISOString()).toBe(
        parsed.metadata.generatedAt
      );
    });

    it('should include repository name and owner', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));

      expect(parsed.repository.name).toBe('test-repo');
      expect(parsed.repository.owner).toBe('test-owner');
    });

    it('should include compliance score, status, and grade', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));

      expect(typeof parsed.compliance.overallScore).toBe('number');
      expect(typeof parsed.compliance.status).toBe('string');
      expect(typeof parsed.compliance.grade).toBe('string');
    });

    it('should include summary with total, passed, failed, notApplicable, passRate', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));

      expect(parsed.summary.total).toBe(1);
      expect(parsed.summary.passed).toBe(1);
      expect(parsed.summary.failed).toBe(0);
      expect(parsed.summary.notApplicable).toBe(0);
      expect(typeof parsed.summary.passRate).toBe('number');
      expect(parsed.summary.passRate).toBe(100);
    });
  });

  describe('Control Format', () => {
    it('should format controls with id, name, status, evidence, severity', () => {
      const data = makeMinimalData({
        controls: [
          {
            id: 'CC1.1',
            name: 'Code Review Process',
            status: 'PASS',
            evidence: 'All PRs require approval',
            severity: 'high',
          },
          {
            id: 'CC2.1',
            name: 'Access Control',
            status: 'FAIL',
            evidence: 'No MFA configured',
            severity: 'critical',
          },
        ],
        summary: { total: 2, passed: 1, failed: 1, notApplicable: 0 },
      });

      const parsed = JSON.parse(formatter.format(data));

      expect(parsed.controls).toHaveLength(2);

      const control = parsed.controls[0];
      expect(control).toHaveProperty('id');
      expect(control).toHaveProperty('name');
      expect(control).toHaveProperty('status');
      expect(control).toHaveProperty('evidence');
      expect(control).toHaveProperty('severity');
    });

    it('should include violations when present on controls', () => {
      const data = makeMinimalData({
        controls: [
          {
            id: 'CC1.1',
            name: 'Secrets Check',
            status: 'FAIL',
            evidence: 'Hardcoded secrets found',
            severity: 'critical',
            violations: [
              {
                file: 'src/config.ts',
                line: 10,
                code: 'const key = "sk_live_abc123"',
                recommendation: 'Use environment variables',
              },
            ],
          },
        ],
        summary: { total: 1, passed: 0, failed: 1, notApplicable: 0 },
        overallScore: 0,
      });

      const parsed = JSON.parse(formatter.format(data));
      const control = parsed.controls[0];

      expect(control.violations).toHaveLength(1);
      expect(control.violations[0].file).toBe('src/config.ts');
      expect(control.violations[0].line).toBe(10);
      expect(control.violations[0].code).toContain('sk_live_abc123');
      expect(control.violations[0].recommendation).toBe('Use environment variables');
    });

    it('should not include violations key when control has no violations', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));
      const control = parsed.controls[0];

      expect(control.violations).toBeUndefined();
    });
  });

  describe('Data Types', () => {
    it('should use ISO 8601 timestamp format', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
      expect(iso8601Regex.test(parsed.timestamp)).toBe(true);
    });

    it('should use correct compliance status values', () => {
      // All pass -> PASS
      const passData = makeMinimalData();
      const passResult = JSON.parse(formatter.format(passData));
      expect(passResult.compliance.status).toBe('PASS');

      // Any failure -> FAIL
      const failData = makeMinimalData({
        controls: [
          {
            id: 'CC1.1',
            name: 'Test',
            status: 'FAIL',
            evidence: 'Failed',
            severity: 'critical',
          },
        ],
        summary: { total: 1, passed: 0, failed: 1, notApplicable: 0 },
        overallScore: 0,
      });
      const failResult = JSON.parse(formatter.format(failData));
      expect(failResult.compliance.status).toBe('FAIL');
    });

    it('should calculate correct grade based on pass rate', () => {
      // 100% pass rate -> Excellent
      const data = makeMinimalData({ overallScore: 95 });
      const parsed = JSON.parse(formatter.format(data));
      expect(parsed.compliance.grade).toBe('Excellent');

      // 75% pass rate -> Good
      const data75 = makeMinimalData({
        controls: [
          { id: 'C1', name: 'A', status: 'PASS', evidence: 'ok', severity: 'low' },
          { id: 'C2', name: 'B', status: 'PASS', evidence: 'ok', severity: 'low' },
          { id: 'C3', name: 'C', status: 'PASS', evidence: 'ok', severity: 'low' },
          { id: 'C4', name: 'D', status: 'FAIL', evidence: 'no', severity: 'low' },
        ],
        summary: { total: 4, passed: 3, failed: 1, notApplicable: 0 },
        overallScore: 75,
      });
      const parsed75 = JSON.parse(formatter.format(data75));
      expect(parsed75.compliance.grade).toBe('Good');
    });
  });

  describe('Serialization', () => {
    it('should produce valid JSON', () => {
      const data = makeMinimalData();
      const json = formatter.format(data);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should support pretty-printed output', () => {
      const data = makeMinimalData();
      const json = formatter.formatPretty(data);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should produce minified output from format()', () => {
      const data = makeMinimalData();
      const json = formatter.format(data);

      // format() uses JSON.stringify without indentation
      expect(json).not.toContain('\n');
    });
  });

  describe('Schema', () => {
    it('should return a valid JSON schema object', () => {
      const schema = formatter.getSchema();

      expect(schema.type).toBe('object');
      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required).toContain('metadata');
      expect(schema.required).toContain('framework');
      expect(schema.required).toContain('timestamp');
      expect(schema.required).toContain('repository');
      expect(schema.required).toContain('compliance');
      expect(schema.required).toContain('summary');
      expect(schema.required).toContain('controls');
    });

    it('should define control items with required fields', () => {
      const schema = formatter.getSchema();
      const controlSchema = schema.properties.controls.items;

      expect(controlSchema.required).toContain('id');
      expect(controlSchema.required).toContain('name');
      expect(controlSchema.required).toContain('status');
      expect(controlSchema.required).toContain('evidence');
      expect(controlSchema.required).toContain('severity');
    });
  });

  describe('Validation', () => {
    it('should reject invalid framework', () => {
      const data = makeMinimalData({ framework: 'INVALID' as any });

      expect(() => formatter.format(data)).toThrow('Invalid framework');
    });

    it('should reject non-Date timestamp', () => {
      const data = makeMinimalData({ timestamp: 'not-a-date' as any });

      expect(() => formatter.format(data)).toThrow('Invalid timestamp');
    });

    it('should reject missing repository name', () => {
      const data = makeMinimalData({ repositoryName: '' });

      expect(() => formatter.format(data)).toThrow('Repository name is required');
    });

    it('should reject score out of range', () => {
      const data = makeMinimalData({ overallScore: -5 });

      expect(() => formatter.format(data)).toThrow('Overall score must be a number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty controls array', () => {
      const data = makeMinimalData({
        controls: [],
        summary: { total: 0, passed: 0, failed: 0, notApplicable: 0 },
      });

      const parsed = JSON.parse(formatter.format(data));
      expect(parsed.controls).toHaveLength(0);
      expect(parsed.summary.total).toBe(0);
    });

    it('should handle special characters in strings', () => {
      const data = makeMinimalData({
        controls: [
          {
            id: 'CC1.1',
            name: 'Test with "quotes" and <brackets> & ampersands',
            status: 'PASS',
            evidence: 'Evidence with "special" chars',
            severity: 'low',
          },
        ],
      });

      const json = formatter.format(data);
      const parsed = JSON.parse(json);

      expect(parsed.controls[0].name).toContain('"quotes"');
      expect(parsed.controls[0].name).toContain('<brackets>');
      expect(parsed.controls[0].name).toContain('& ampersands');
    });

    it('should handle multiple frameworks array', () => {
      const data = makeMinimalData({
        frameworks: ['SOC2', 'GDPR'],
      });

      const parsed = JSON.parse(formatter.format(data));
      expect(parsed.frameworks).toEqual(['SOC2', 'GDPR']);
    });

    it('should default frameworks to single-element array from framework field', () => {
      const data = makeMinimalData();
      const parsed = JSON.parse(formatter.format(data));
      expect(parsed.frameworks).toEqual(['SOC2']);
    });
  });

  describe('Performance', () => {
    it('should format large reports quickly', () => {
      const data = makeMinimalData({
        controls: Array.from({ length: 200 }, (_, i) => ({
          id: `CC${i}.1`,
          name: `Control ${i}`,
          status: 'PASS' as const,
          evidence: 'Evidence data',
          severity: 'medium' as const,
        })),
        summary: { total: 200, passed: 200, failed: 0, notApplicable: 0 },
      });

      const startTime = Date.now();
      formatter.format(data);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Compatibility', () => {
    it('should be parseable by standard JSON parsers', () => {
      const data = makeMinimalData();
      const json = formatter.format(data);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should produce consistent output for same input', () => {
      const data = makeMinimalData();
      const json1 = JSON.parse(formatter.format(data));
      const json2 = JSON.parse(formatter.format(data));

      // Exclude generatedAt which changes each call
      delete json1.metadata.generatedAt;
      delete json2.metadata.generatedAt;

      expect(json1).toEqual(json2);
    });
  });
});
