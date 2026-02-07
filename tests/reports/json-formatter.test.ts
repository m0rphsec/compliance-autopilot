/**
 * JSON Formatter Test Suite
 * Tests JSON evidence format for programmatic access
 */

import { JSONFormatter } from '../../src/reports/json-formatter';

describe('JSONFormatter', () => {
  let formatter: JSONFormatter;

  const mockComplianceData = {
    framework: 'SOC2' as const,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    repositoryName: 'test-repo',
    repositoryOwner: 'test-org',
    overallScore: 85.5,
    controls: [
      {
        id: 'CC1.1',
        name: 'Code Review Process',
        status: 'PASS' as const,
        evidence: 'All PRs have ≥1 approval',
        severity: 'high' as const,
      },
      {
        id: 'CC6.1',
        name: 'Deployment Controls',
        status: 'FAIL' as const,
        evidence: 'Manual deployments detected',
        severity: 'critical' as const,
        violations: [
          {
            file: 'deploy.sh',
            line: 42,
            code: 'git push production main',
            recommendation: 'Use GitHub Actions for deployments',
          },
        ],
      },
    ],
    summary: {
      total: 64,
      passed: 55,
      failed: 7,
      notApplicable: 2,
    },
  };

  beforeEach(() => {
    formatter = new JSONFormatter();
  });

  describe('format', () => {
    it('should return valid JSON string', () => {
      const result = formatter.format(mockComplianceData);

      expect(() => JSON.parse(result)).not.toThrow();
      expect(typeof result).toBe('string');
    });

    it('should preserve all data fields', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      expect(parsed.framework).toBe('SOC2');
      expect(parsed.repository.name).toBe('test-repo');
      expect(parsed.repository.owner).toBe('test-org');
      expect(parsed.compliance.overallScore).toBe(85.5);
      expect(parsed.controls).toHaveLength(2);
    });

    it('should format timestamps as ISO 8601', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      expect(parsed.timestamp).toBe('2024-01-15T10:30:00.000Z');
      expect(() => new Date(parsed.timestamp)).not.toThrow();
    });

    it('should include metadata', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.version).toBe('1.0.0');
      expect(parsed.metadata.generator).toBe('Compliance Autopilot');
    });

    it('should format control details correctly', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      const control = parsed.controls[0];
      expect(control.id).toBe('CC1.1');
      expect(control.name).toBe('Code Review Process');
      expect(control.status).toBe('PASS');
      expect(control.evidence).toBeDefined();
      expect(control.severity).toBe('high');
    });

    it('should include violation details', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      const failedControl = parsed.controls[1];
      expect(failedControl.violations).toHaveLength(1);

      const violation = failedControl.violations[0];
      expect(violation.file).toBe('deploy.sh');
      expect(violation.line).toBe(42);
      expect(violation.code).toBeDefined();
      expect(violation.recommendation).toBeDefined();
    });

    it('should include summary statistics', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      expect(parsed.summary.total).toBe(64);
      expect(parsed.summary.passed).toBe(55);
      expect(parsed.summary.failed).toBe(7);
      expect(parsed.summary.notApplicable).toBe(2);
    });
  });

  describe('formatPretty', () => {
    it('should return formatted JSON with indentation', () => {
      const result = formatter.formatPretty(mockComplianceData);

      expect(result).toContain('\n');
      expect(result).toContain('  '); // Check for indentation
    });

    it('should be parseable JSON', () => {
      const result = formatter.formatPretty(mockComplianceData);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should use 2-space indentation', () => {
      const result = formatter.formatPretty(mockComplianceData);
      const lines = result.split('\n');

      // Check that indented lines use 2 spaces
      const indentedLines = lines.filter(line => line.startsWith('  '));
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      const invalidData = {} as any;
      expect(() => formatter.format(invalidData)).toThrow();
    });

    it('should validate framework type', () => {
      const invalidFramework = {
        ...mockComplianceData,
        framework: 'INVALID' as any,
      };

      expect(() => formatter.format(invalidFramework)).toThrow();
    });

    it('should validate timestamp type', () => {
      const invalidTimestamp = {
        ...mockComplianceData,
        timestamp: 'not-a-date' as any,
      };

      expect(() => formatter.format(invalidTimestamp)).toThrow();
    });

    it('should validate overallScore range', () => {
      const invalidScore = {
        ...mockComplianceData,
        overallScore: 150, // Should be 0-100
      };

      expect(() => formatter.format(invalidScore)).toThrow();
    });
  });

  describe('schema', () => {
    it('should generate JSON schema', () => {
      const schema = formatter.getSchema();

      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('framework');
      expect(schema.required).toContain('timestamp');
    });

    it('should define all properties', () => {
      const schema = formatter.getSchema();

      expect(schema.properties.framework).toBeDefined();
      expect(schema.properties.timestamp).toBeDefined();
      expect(schema.properties.repository).toBeDefined();
      expect(schema.properties.compliance).toBeDefined();
      expect(schema.properties.controls).toBeDefined();
      expect(schema.properties.summary).toBeDefined();
    });

    it('should specify enum for framework', () => {
      const schema = formatter.getSchema();

      expect(schema.properties.framework.enum).toEqual(['SOC2', 'GDPR', 'ISO27001']);
    });

    it('should specify control status enum', () => {
      const schema = formatter.getSchema();
      const controlSchema = schema.properties.controls.items;

      expect(controlSchema.properties.status.enum).toEqual(['PASS', 'FAIL', 'NOT_APPLICABLE']);
    });
  });

  describe('performance', () => {
    it('should format large datasets quickly', () => {
      const largeData = {
        ...mockComplianceData,
        controls: Array(100).fill(mockComplianceData.controls[0]),
      };

      const startTime = Date.now();
      formatter.format(largeData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be under 100ms
    });

    it('should handle deeply nested structures', () => {
      const deepData = {
        ...mockComplianceData,
        controls: Array(50).fill(null).map((_, i) => ({
          ...mockComplianceData.controls[1],
          violations: Array(10).fill(mockComplianceData.controls[1].violations![0]),
        })),
      };

      const result = formatter.format(deepData);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('escaping', () => {
    it('should escape special characters in strings', () => {
      const dataWithSpecialChars = {
        ...mockComplianceData,
        controls: [{
          id: 'TEST',
          name: 'Control with "quotes" and \n newlines',
          status: 'PASS' as const,
          evidence: 'Evidence with <tags> and & ampersands',
          severity: 'low' as const,
        }],
      };

      const result = formatter.format(dataWithSpecialChars);
      const parsed = JSON.parse(result);

      expect(parsed.controls[0].name).toContain('"quotes"');
      expect(parsed.controls[0].evidence).toContain('<tags>');
    });

    it('should handle unicode characters', () => {
      const dataWithUnicode = {
        ...mockComplianceData,
        repositoryName: 'test-repo-🔒',
      };

      const result = formatter.format(dataWithUnicode);
      const parsed = JSON.parse(result);

      expect(parsed.repository.name).toBe('test-repo-🔒');
    });
  });

  describe('backward compatibility', () => {
    it('should be parseable by standard JSON parsers', () => {
      const result = formatter.format(mockComplianceData);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(typeof parsed).toBe('object');
    });

    it('should include version number for schema evolution', () => {
      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      expect(parsed.metadata.version).toBeDefined();
      expect(parsed.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('edge cases', () => {
    it('should handle empty controls array', () => {
      const emptyControls = {
        ...mockComplianceData,
        controls: [],
      };

      const result = formatter.format(emptyControls);
      const parsed = JSON.parse(result);

      expect(parsed.controls).toEqual([]);
    });

    it('should handle null values correctly', () => {
      const dataWithNulls = {
        ...mockComplianceData,
        controls: [{
          id: 'TEST',
          name: 'Test',
          status: 'PASS' as const,
          evidence: 'Evidence',
          severity: 'low' as const,
          violations: undefined,
        }],
      };

      const result = formatter.format(dataWithNulls);
      const parsed = JSON.parse(result);

      expect(parsed.controls[0].violations).toBeUndefined();
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000);
      const dataWithLongString = {
        ...mockComplianceData,
        controls: [{
          id: 'TEST',
          name: 'Test',
          status: 'PASS' as const,
          evidence: longString,
          severity: 'low' as const,
        }],
      };

      const result = formatter.format(dataWithLongString);
      const parsed = JSON.parse(result);

      expect(parsed.controls[0].evidence).toBe(longString);
    });
  });

  describe('snapshot testing', () => {
    it('should match JSON structure snapshot', () => {
      // Fix the current time so generatedAt is deterministic for snapshot matching
      const fixedDate = new Date('2026-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(fixedDate);

      const result = formatter.format(mockComplianceData);
      const parsed = JSON.parse(result);

      jest.useRealTimers();

      expect(parsed).toMatchSnapshot();
    });
  });
});
