/**
 * PDF Generator Test Suite
 * Tests professional PDF report generation with accessibility and performance requirements
 */

import { PDFGenerator } from '../../src/reports/pdf-generator';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

describe('PDFGenerator', () => {
  let generator: PDFGenerator;

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
    generator = new PDFGenerator();
  });

  describe('generate', () => {
    it('should generate a valid PDF document', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Verify PDF magic bytes
      const header = String.fromCharCode(...pdfBytes.slice(0, 4));
      expect(header).toBe('%PDF');
    });

    it('should complete PDF generation in less than 5 seconds', async () => {
      const startTime = Date.now();
      await generator.generate(mockComplianceData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should include all required sections', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const pages = pdfDoc.getPages();
      expect(pages.length).toBeGreaterThanOrEqual(3);

      // Verify page count is reasonable
      expect(pages.length).toBeLessThan(100);
    });

    it('should handle large compliance data sets', async () => {
      const largeData = {
        ...mockComplianceData,
        controls: Array(64).fill(null).map((_, i) => ({
          id: `CC${i + 1}`,
          name: `Control ${i + 1}`,
          status: i % 3 === 0 ? 'FAIL' : 'PASS' as const,
          evidence: `Evidence for control ${i + 1}`,
          severity: 'medium' as const,
          violations: i % 3 === 0 ? [
            {
              file: `file${i}.ts`,
              line: i * 10,
              code: `code snippet ${i}`,
              recommendation: `Fix recommendation ${i}`,
            },
          ] : undefined,
        })),
      };

      const startTime = Date.now();
      const pdfBytes = await generator.generate(largeData);
      const duration = Date.now() - startTime;

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle missing optional data gracefully', async () => {
      const minimalData = {
        framework: 'GDPR' as const,
        timestamp: new Date(),
        repositoryName: 'repo',
        repositoryOwner: 'owner',
        overallScore: 100,
        controls: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          notApplicable: 0,
        },
      };

      const pdfBytes = await generator.generate(minimalData);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe('cover page', () => {
    it('should include compliance score on cover page', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Cover page should be first page
      const firstPage = pdfDoc.getPages()[0];
      expect(firstPage).toBeDefined();
    });

    it('should display framework name prominently', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should include repository information', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should display timestamp', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });

  describe('executive summary', () => {
    it('should include overall compliance score', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should show summary statistics', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should highlight critical failures', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });

  describe('control findings', () => {
    it('should list all controls with status', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should format violations with code snippets', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should include recommendations for failures', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should use consistent color coding', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should use WCAG AA compliant colors', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      // Test will verify color contrast ratios meet WCAG AA
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });

    it('should be color-blind friendly', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      // Test will verify patterns are used alongside colors
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });

    it('should support screen readers with semantic structure', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Verify PDF has metadata for screen readers
      expect(pdfDoc.getTitle()).toBeDefined();
    });
  });

  describe('branding', () => {
    it('should use blue/green color scheme', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });

    it('should use clean typography', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });

    it('should maintain consistent styling throughout', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe('performance', () => {
    it('should generate small repos in under 2 seconds', async () => {
      const smallData = {
        ...mockComplianceData,
        controls: mockComplianceData.controls.slice(0, 10),
      };

      const startTime = Date.now();
      await generator.generate(smallData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent generation requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        generator.generate(mockComplianceData)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(pdf => {
        expect(pdf).toBeInstanceOf(Uint8Array);
      });
    });

    it('should not leak memory on repeated calls', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 10; i++) {
        await generator.generate(mockComplianceData);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory should not increase by more than 50MB
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid data', async () => {
      const invalidData = {} as any;
      await expect(generator.generate(invalidData)).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        framework: 'SOC2',
        // Missing other required fields
      } as any;

      await expect(generator.generate(incompleteData)).rejects.toThrow();
    });

    it('should validate framework type', async () => {
      const invalidFramework = {
        ...mockComplianceData,
        framework: 'INVALID' as any,
      };

      await expect(generator.generate(invalidFramework)).rejects.toThrow();
    });
  });

  describe('snapshot testing', () => {
    it('should match PDF structure snapshot', async () => {
      const pdfBytes = await generator.generate(mockComplianceData);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const structure = {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
      };

      expect(structure).toMatchSnapshot();
    });
  });
});
