/**
 * Unit tests for PDF report generator
 * Tests real PDF generation with pdf-lib
 */

import { describe, it, expect } from '@jest/globals';
import { PDFGenerator, ComplianceData } from '../../../src/reports/pdf-generator';

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

describe('PDF Report Generator', () => {
  describe('Document Structure', () => {
    it('should generate a PDF as Uint8Array', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData();

      const output = await generator.generate(data);

      expect(output).toBeInstanceOf(Uint8Array);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should produce output containing the PDF header signature', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData();

      const output = await generator.generate(data);

      // PDF files start with %PDF-
      const header = String.fromCharCode(...output.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('should generate multi-page PDF with many controls', async () => {
      const generator = new PDFGenerator();
      const controls = Array.from({ length: 20 }, (_, i) => ({
        id: 'CC' + (i + 1) + '.1',
        name: 'Control ' + (i + 1),
        status: (i % 3 === 0 ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL',
        evidence: 'Evidence for control ' + (i + 1),
        severity: 'medium' as const,
        recommendations: i % 3 === 0 ? ['Fix this issue'] : undefined,
      }));

      const data = makeMinimalData({
        controls,
        summary: {
          total: 20,
          passed: 14,
          failed: 6,
          notApplicable: 0,
        },
        overallScore: 70,
      });

      const output = await generator.generate(data);
      expect(output).toBeInstanceOf(Uint8Array);
      // A multi-page PDF should be substantially larger
      expect(output.length).toBeGreaterThan(1000);
    });

    it('should produce a larger PDF with more controls', async () => {
      const generator = new PDFGenerator();

      const smallData = makeMinimalData();
      const smallOutput = await generator.generate(smallData);

      const largeControls = Array.from({ length: 30 }, (_, i) => ({
        id: 'CC' + (i + 1) + '.1',
        name: 'Control ' + (i + 1),
        status: 'PASS' as const,
        evidence: 'Evidence for control ' + (i + 1),
        severity: 'medium' as const,
      }));

      const largeData = makeMinimalData({
        controls: largeControls,
        summary: { total: 30, passed: 30, failed: 0, notApplicable: 0 },
      });
      const largeOutput = await generator.generate(largeData);

      // More controls should produce a larger PDF
      expect(largeOutput.length).toBeGreaterThan(smallOutput.length);
    });
  });

  describe('Content Generation', () => {
    it('should handle empty controls array', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({
        controls: [],
        summary: { total: 0, passed: 0, failed: 0, notApplicable: 0 },
        overallScore: 100,
      });

      const output = await generator.generate(data);
      expect(output).toBeInstanceOf(Uint8Array);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle controls with violations', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({
        controls: [
          {
            id: 'CC1.1',
            name: 'Code Review',
            status: 'FAIL',
            evidence: 'No reviews found',
            severity: 'critical',
            violations: [
              {
                file: 'src/main.ts',
                line: 42,
                code: 'const secret = "hardcoded";',
                recommendation: 'Use environment variables',
              },
            ],
            recommendations: ['Require PR reviews'],
          },
        ],
        summary: { total: 1, passed: 0, failed: 1, notApplicable: 0 },
        overallScore: 0,
      });

      const output = await generator.generate(data);
      expect(output).toBeInstanceOf(Uint8Array);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle all three frameworks', async () => {
      const generator = new PDFGenerator();

      for (const framework of ['SOC2', 'GDPR', 'ISO27001'] as const) {
        const data = makeMinimalData({ framework });
        const output = await generator.generate(data);
        expect(output).toBeInstanceOf(Uint8Array);
        expect(output.length).toBeGreaterThan(0);
      }
    });

    it('should produce different PDFs for different frameworks', async () => {
      const generator = new PDFGenerator();

      const soc2Output = await generator.generate(makeMinimalData({ framework: 'SOC2' }));
      const gdprOutput = await generator.generate(makeMinimalData({ framework: 'GDPR' }));

      // Different frameworks should produce different PDF content
      // Compare overall size or later bytes where framework-specific content differs
      const soc2Full = Array.from(soc2Output);
      const gdprFull = Array.from(gdprOutput);
      expect(soc2Full.length !== gdprFull.length || soc2Full.some((b, i) => b !== gdprFull[i])).toBe(true);
    });

    it('should handle multiple frameworks in badges', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({
        frameworks: ['SOC2', 'GDPR', 'ISO27001'],
      });

      const output = await generator.generate(data);
      expect(output).toBeInstanceOf(Uint8Array);

      // Multi-framework PDF should be at least as large as single-framework
      const singleOutput = await generator.generate(makeMinimalData());
      expect(output.length).toBeGreaterThanOrEqual(singleOutput.length);
    });
  });

  describe('Validation', () => {
    it('should reject invalid framework', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({ framework: 'INVALID' as any });

      await expect(generator.generate(data)).rejects.toThrow('Invalid framework');
    });

    it('should reject non-Date timestamp', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({ timestamp: 'not-a-date' as any });

      await expect(generator.generate(data)).rejects.toThrow('Invalid timestamp');
    });

    it('should reject missing repository name', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({ repositoryName: '' });

      await expect(generator.generate(data)).rejects.toThrow(
        'Repository name and owner are required'
      );
    });

    it('should reject score out of range', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({ overallScore: 150 });

      await expect(generator.generate(data)).rejects.toThrow(
        'Overall score must be a number between 0 and 100'
      );
    });

    it('should reject non-array controls', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({ controls: 'not-an-array' as any });

      await expect(generator.generate(data)).rejects.toThrow('Controls must be an array');
    });
  });

  describe('Performance', () => {
    it('should generate report in under 5 seconds', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData();

      const startTime = Date.now();
      await generator.generate(data);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should handle large reports with 200 controls', async () => {
      const generator = new PDFGenerator();
      const controls = Array.from({ length: 200 }, (_, i) => ({
        id: 'CTRL-' + (i + 1),
        name: 'Control number ' + (i + 1),
        status: 'PASS' as const,
        evidence: 'Evidence gathered for control ' + (i + 1),
        severity: 'medium' as const,
      }));

      const data = makeMinimalData({
        controls,
        summary: { total: 200, passed: 200, failed: 0, notApplicable: 0 },
      });

      const output = await generator.generate(data);
      expect(output).toBeInstanceOf(Uint8Array);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('File Output', () => {
    it('should return valid PDF buffer with correct magic bytes', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData();

      const output = await generator.generate(data);

      // %PDF- in ASCII is [37, 80, 68, 70, 45]
      expect(output[0]).toBe(37);
      expect(output[1]).toBe(80);
      expect(output[2]).toBe(68);
      expect(output[3]).toBe(70);
      expect(output[4]).toBe(45);
    });

    it('should produce a file under 5MB', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData();

      const output = await generator.generate(data);

      const fiveMB = 5 * 1024 * 1024;
      expect(output.length).toBeLessThan(fiveMB);
    });

    it('should produce a valid PDF ending with %%EOF', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData();

      const output = await generator.generate(data);

      // A valid PDF should end with %%EOF
      const tail = new TextDecoder('latin1').decode(output.slice(-10));
      expect(tail).toContain('%%EOF');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing summary', async () => {
      const generator = new PDFGenerator();
      const data = makeMinimalData({ summary: null as any });

      await expect(generator.generate(data)).rejects.toThrow('Summary is required');
    });
  });
});
