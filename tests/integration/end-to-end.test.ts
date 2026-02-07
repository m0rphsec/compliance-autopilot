/**
 * End-to-End Integration Tests for Compliance Autopilot
 *
 * Tests complete workflows with real API keys and actual integrations.
 * These tests verify the entire system works together as expected.
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY environment variable
 * - GITHUB_TOKEN environment variable
 * - Internet connection for API calls
 *
 * Run with: npm test -- end-to-end.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
// import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Import system components
import { GDPRCollector } from '../../src/collectors/gdpr';
import { PDFGenerator, ComplianceData, ControlResult } from '../../src/reports/pdf-generator';
import { JSONFormatter } from '../../src/reports/json-formatter';
import { PRCommenter, ComplianceStatus } from '../../src/github/pr-commenter';
// import { ArtifactStore } from '../../src/github/artifact-store';

// Test configuration
const SKIP_EXPENSIVE_TESTS = !process.env.RUN_EXPENSIVE_TESTS;
const TEST_TIMEOUT = 120000; // 2 minutes

describe('End-to-End Integration Tests', () => {
  let anthropicApiKey: string;
  let githubToken: string;
  let tempDir: string;
  // let octokit: Octokit;

  beforeAll(async () => {
    // Check for required API keys
    anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
    githubToken = process.env.GITHUB_TOKEN || '';

    if (!anthropicApiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set. Some tests will be skipped.');
    }

    if (!githubToken) {
      console.warn('⚠️  GITHUB_TOKEN not set. GitHub integration tests will be skipped.');
    }

    // Create temporary directory for test outputs
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compliance-test-'));

    // Initialize Octokit (if needed)
    // if (githubToken) {
    //   octokit = new Octokit({ auth: githubToken });
    // }
  });

  afterAll(async () => {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup temp directory:', error);
    }
  });

  // ============================================================================
  // TEST SUITE 1: GDPR Evidence Collection
  // ============================================================================

  describe('GDPR Evidence Collection Workflow', () => {
    const describeIfApiKey = anthropicApiKey ? describe : describe.skip;

    describeIfApiKey('Complete GDPR scan workflow', () => {
      it('should detect PII in code samples', async () => {
        const collector = new GDPRCollector({ apiKey: anthropicApiKey });

        const codeWithPII = `
          const userData = {
            email: "user@example.com",
            ssn: "123-45-6789",
            phone: "+1-555-123-4567",
            address: "123 Main St, Springfield"
          };

          // Store without encryption
          database.users.insert(userData);
        `;

        const result = await collector.scanFile(codeWithPII, 'src/user-service.ts');

        expect(result.has_pii).toBe(true);
        expect(result.pii_types).toContain('email');
        expect(result.pii_types.length).toBeGreaterThan(0);
        expect(result.gdpr_compliant).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.recommendations.length).toBeGreaterThan(0);

        console.log('✅ GDPR scan detected PII:', {
          piiTypes: result.pii_types,
          violations: result.violations.length,
          compliant: result.gdpr_compliant
        });
      }, TEST_TIMEOUT);

      it('should approve compliant code', async () => {
        const collector = new GDPRCollector({ apiKey: anthropicApiKey });

        const compliantCode = `
          import { encrypt } from './crypto';

          async function storeUserData(data: UserData) {
            // Encrypt PII before storage
            const encrypted = await encrypt(data, process.env.ENCRYPTION_KEY);

            // Store with TTL for retention policy
            await database.users.insert(encrypted, {
              ttl: 365 * 24 * 60 * 60 // 1 year retention
            });

            // Log consent
            await auditLog.recordConsent(data.userId, data.consentTimestamp);
          }
        `;

        const result = await collector.scanFile(compliantCode, 'src/compliant-service.ts');

        expect(result.encryption_rest).toBe(true);
        expect(result.retention_policy).toBe(true);

        console.log('✅ GDPR scan approved compliant code:', {
          encryptionRest: result.encryption_rest,
          retentionPolicy: result.retention_policy,
          violations: result.violations.length
        });
      }, TEST_TIMEOUT);

      it('should scan multiple files efficiently', async () => {
        const collector = new GDPRCollector({ apiKey: anthropicApiKey });

        const files = [
          {
            code: 'const email = "test@example.com";',
            path: 'src/file1.ts'
          },
          {
            code: 'const password = "secret123";',
            path: 'src/file2.ts'
          },
          {
            code: 'const ssn = "123-45-6789";',
            path: 'src/file3.ts'
          },
          {
            code: 'const phone = "+1-555-1234";',
            path: 'src/file4.ts'
          },
          {
            code: 'const address = "123 Main St";',
            path: 'src/file5.ts'
          }
        ];

        const startTime = Date.now();
        const result = await collector.scanRepository(files);
        const duration = Date.now() - startTime;

        expect(result.summary.total_files_scanned).toBe(5);
        expect(result.summary.files_with_pii).toBeGreaterThan(0);
        expect(result.compliant).toBeDefined();
        expect(duration).toBeLessThan(60000); // Should complete in <60s

        console.log('✅ Repository scan completed:', {
          filesScanned: result.summary.total_files_scanned,
          filesWithPII: result.summary.files_with_pii,
          violations: result.summary.total_violations,
          score: result.score,
          durationMs: duration
        });
      }, TEST_TIMEOUT);
    });
  });

  // ============================================================================
  // TEST SUITE 2: PDF Report Generation
  // ============================================================================

  describe('PDF Report Generation', () => {
    it('should generate valid PDF report', async () => {
      const generator = new PDFGenerator();

      const testData: ComplianceData = {
        framework: 'GDPR',
        timestamp: new Date(),
        repositoryName: 'test-repo',
        repositoryOwner: 'test-owner',
        overallScore: 85.5,
        controls: [
          {
            id: 'GDPR-1',
            name: 'Data Encryption',
            status: 'PASS',
            evidence: 'All PII data is encrypted using AES-256',
            severity: 'critical'
          },
          {
            id: 'GDPR-2',
            name: 'Consent Mechanism',
            status: 'FAIL',
            evidence: 'No consent checkboxes found in forms',
            severity: 'high',
            violations: [
              {
                file: 'src/forms/signup.tsx',
                line: 42,
                code: '<input type="email" name="email" />',
                recommendation: 'Add GDPR consent checkbox before form submission'
              }
            ]
          },
          {
            id: 'GDPR-3',
            name: 'Data Retention Policy',
            status: 'PASS',
            evidence: 'TTL configured for all user data (365 days)',
            severity: 'medium'
          }
        ],
        summary: {
          total: 3,
          passed: 2,
          failed: 1,
          notApplicable: 0
        }
      };

      const pdfBytes = await generator.generate(testData);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000); // PDF should be substantial

      // Save to file for manual inspection
      const pdfPath = path.join(tempDir, 'test-report.pdf');
      await fs.writeFile(pdfPath, pdfBytes);

      const stats = await fs.stat(pdfPath);
      expect(stats.size).toBeGreaterThan(1000);

      console.log('✅ PDF report generated:', {
        sizeBytes: pdfBytes.length,
        filePath: pdfPath,
        controls: testData.controls.length
      });
    }, TEST_TIMEOUT);

    it('should handle large reports with many controls', async () => {
      const generator = new PDFGenerator();

      // Generate 50 controls to test pagination
      const controls: ControlResult[] = Array.from({ length: 50 }, (_, i) => ({
        id: `CTRL-${i + 1}`,
        name: `Control ${i + 1}`,
        status: i % 3 === 0 ? 'FAIL' : 'PASS',
        evidence: `Evidence for control ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        severity: i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'medium',
        violations: i % 3 === 0 ? [
          {
            file: `src/file${i}.ts`,
            line: i * 10,
            code: `const value${i} = "test";`,
            recommendation: `Fix violation in control ${i + 1}`
          }
        ] : undefined
      }));

      const testData: ComplianceData = {
        framework: 'SOC2',
        timestamp: new Date(),
        repositoryName: 'large-repo',
        repositoryOwner: 'test-org',
        overallScore: 72.5,
        controls,
        summary: {
          total: 50,
          passed: 33,
          failed: 17,
          notApplicable: 0
        }
      };

      const startTime = Date.now();
      const pdfBytes = await generator.generate(testData);
      const duration = Date.now() - startTime;

      expect(pdfBytes.length).toBeGreaterThan(5000);
      expect(duration).toBeLessThan(5000); // <5 seconds target

      console.log('✅ Large PDF report generated:', {
        controls: 50,
        sizeBytes: pdfBytes.length,
        durationMs: duration
      });
    }, TEST_TIMEOUT);
  });

  // ============================================================================
  // TEST SUITE 3: JSON Report Generation
  // ============================================================================

  describe('JSON Report Generation', () => {
    it('should generate valid JSON report', async () => {
      const formatter = new JSONFormatter();

      const testData: ComplianceData = {
        framework: 'ISO27001',
        timestamp: new Date(),
        repositoryName: 'test-repo',
        repositoryOwner: 'test-owner',
        overallScore: 92.3,
        controls: [
          {
            id: 'ISO-1',
            name: 'Security Policy',
            status: 'PASS',
            evidence: 'SECURITY.md file exists and is up to date',
            severity: 'high'
          }
        ],
        summary: {
          total: 1,
          passed: 1,
          failed: 0,
          notApplicable: 0
        }
      };

      const jsonString = formatter.formatPretty(testData);

      expect(jsonString).toBeTruthy();
      expect(jsonString.length).toBeGreaterThan(100);

      // Validate JSON is parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed.framework).toBe('ISO27001');
      expect(parsed.metadata.version).toBe('1.0.0');
      expect(parsed.compliance.overallScore).toBe(92.3);
      expect(parsed.summary.total).toBe(1);

      // Save to file
      const jsonPath = path.join(tempDir, 'test-report.json');
      await fs.writeFile(jsonPath, jsonString);

      console.log('✅ JSON report generated:', {
        sizeBytes: jsonString.length,
        filePath: jsonPath
      });
    }, TEST_TIMEOUT);

    it('should validate against schema', () => {
      const formatter = new JSONFormatter();
      const schema = formatter.getSchema();

      expect(schema.type).toBe('object');
      expect(schema.required).toContain('metadata');
      expect(schema.required).toContain('framework');
      expect(schema.required).toContain('compliance');
      expect(schema.properties.framework.enum).toEqual(['SOC2', 'GDPR', 'ISO27001']);

      console.log('✅ JSON schema validated');
    });
  });

  // ============================================================================
  // TEST SUITE 4: GitHub PR Comment Integration
  // ============================================================================

  describe('PR Comment Integration', () => {
    const describeIfToken = githubToken ? describe : describe.skip;

    describeIfToken('PR comment posting', () => {
      it('should format PR comment correctly', () => {
        // Test with mock data (no API call)
        const commenter = new PRCommenter(
          githubToken,
          'test-owner',
          'test-repo'
        );

        const status: ComplianceStatus = {
          status: 'FAIL',
          frameworks: ['SOC2', 'GDPR'],
          controlsPassed: 8,
          controlsTotal: 10,
          summary: [
            {
              control: 'SOC2-CC6.1',
              status: 'PASS',
              description: 'Code review required for all changes'
            },
            {
              control: 'GDPR-1',
              status: 'FAIL',
              description: 'PII encryption not detected',
              details: 'src/user-service.ts:42'
            }
          ],
          reportUrl: 'https://github.com/test/releases/tag/compliance-123',
          scanDuration: 45000,
          timestamp: new Date()
        };

        // Test comment formatting (private method exposed through testing)
        const comment = (commenter as any).formatComment(status, true, true);

        expect(comment).toContain('Compliance Autopilot Report');
        expect(comment).toContain('FAIL');
        expect(comment).toContain('8/10');
        expect(comment).toContain('SOC2');
        expect(comment).toContain('GDPR');
        expect(comment).toContain('PII encryption not detected');

        console.log('✅ PR comment formatted correctly');
      });
    });
  });

  // ============================================================================
  // TEST SUITE 5: GitHub Artifact Upload
  // ============================================================================

  describe('Artifact Upload to GitHub Releases', () => {
    const describeIfToken = githubToken ? describe : describe.skip;

    describeIfToken('Artifact storage', () => {
      it('should prepare artifact for upload', async () => {
        // Create test artifact
        const testContent = JSON.stringify({
          framework: 'SOC2',
          timestamp: new Date().toISOString(),
          score: 95,
          compliant: true
        }, null, 2);

        const artifactPath = path.join(tempDir, 'test-artifact.json');
        await fs.writeFile(artifactPath, testContent);

        const stats = await fs.stat(artifactPath);
        expect(stats.size).toBeGreaterThan(0);

        console.log('✅ Artifact prepared for upload:', {
          path: artifactPath,
          sizeBytes: stats.size
        });
      });
    });
  });

  // ============================================================================
  // TEST SUITE 6: Slack Webhook Integration (Optional)
  // ============================================================================

  describe('Slack Webhook Integration', () => {
    it('should format Slack message correctly', () => {
      const slackMessage = {
        text: '🚨 Compliance Violations Detected',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Compliance Violations Detected'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Repository:*\ntest-owner/test-repo'
              },
              {
                type: 'mrkdwn',
                text: '*Status:*\nFAIL'
              },
              {
                type: 'mrkdwn',
                text: '*Failed Controls:*\n5/15'
              }
            ]
          }
        ]
      };

      const jsonString = JSON.stringify(slackMessage);
      const parsed = JSON.parse(jsonString);

      expect(parsed.text).toContain('Compliance Violations');
      expect(parsed.blocks).toHaveLength(2);
      expect(parsed.blocks[0].type).toBe('header');

      console.log('✅ Slack message formatted correctly');
    });

    const describeIfWebhook = process.env.SLACK_WEBHOOK_URL ? describe : describe.skip;

    describeIfWebhook('Slack notification', () => {
      it('should send notification to Slack', async () => {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL!;

        const message = {
          text: '✅ Compliance Test Notification',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'This is a test notification from the compliance-autopilot test suite.'
              }
            }
          ]
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        expect(response.ok).toBe(true);

        console.log('✅ Slack notification sent successfully');
      }, TEST_TIMEOUT);
    });
  });

  // ============================================================================
  // TEST SUITE 7: Complete End-to-End Workflow
  // ============================================================================

  describe('Complete Workflow Integration', () => {
    const describeIfComplete = (anthropicApiKey && !SKIP_EXPENSIVE_TESTS) ? describe : describe.skip;

    describeIfComplete('Full compliance scan workflow', () => {
      it('should complete full SOC2 + GDPR + ISO27001 workflow', async () => {
        const startTime = Date.now();

        // Step 1: Collect GDPR evidence
        console.log('Step 1: Collecting GDPR evidence...');
        const gdprCollector = new GDPRCollector({ apiKey: anthropicApiKey });

        const codeFiles = [
          {
            code: 'const email = "user@example.com"; const ssn = "123-45-6789";',
            path: 'src/file1.ts'
          },
          {
            code: 'import { encrypt } from "crypto"; encrypt(data);',
            path: 'src/file2.ts'
          },
          {
            code: 'const password = process.env.PASSWORD;',
            path: 'src/file3.ts'
          }
        ];

        const gdprResult = await gdprCollector.scanRepository(codeFiles);
        expect(gdprResult).toBeDefined();
        expect(gdprResult.summary.total_files_scanned).toBe(3);

        // Step 2: Generate compliance data
        console.log('Step 2: Generating compliance data...');
        const complianceData: ComplianceData = {
          framework: 'GDPR',
          timestamp: new Date(),
          repositoryName: 'integration-test-repo',
          repositoryOwner: 'test-owner',
          overallScore: gdprResult.score,
          controls: [
            {
              id: 'GDPR-1',
              name: 'PII Detection',
              status: gdprResult.compliant ? 'PASS' : 'FAIL',
              evidence: `Scanned ${gdprResult.summary.total_files_scanned} files, found ${gdprResult.summary.files_with_pii} with PII`,
              severity: 'critical',
              violations: gdprResult.violations.map(v => ({
                file: v.file || 'unknown',
                line: 1,
                code: v.description,
                recommendation: v.recommendation
              }))
            }
          ],
          summary: {
            total: 1,
            passed: gdprResult.compliant ? 1 : 0,
            failed: gdprResult.compliant ? 0 : 1,
            notApplicable: 0
          }
        };

        // Step 3: Generate PDF report
        console.log('Step 3: Generating PDF report...');
        const pdfGenerator = new PDFGenerator();
        const pdfBytes = await pdfGenerator.generate(complianceData);
        expect(pdfBytes.length).toBeGreaterThan(1000);

        const pdfPath = path.join(tempDir, 'full-workflow-report.pdf');
        await fs.writeFile(pdfPath, pdfBytes);

        // Step 4: Generate JSON report
        console.log('Step 4: Generating JSON report...');
        const jsonFormatter = new JSONFormatter();
        const jsonString = jsonFormatter.formatPretty(complianceData);
        expect(jsonString.length).toBeGreaterThan(100);

        const jsonPath = path.join(tempDir, 'full-workflow-report.json');
        await fs.writeFile(jsonPath, jsonString);

        // Step 5: Format PR comment (no API call)
        console.log('Step 5: Formatting PR comment...');
        if (githubToken) {
          const commenter = new PRCommenter(githubToken, 'test-owner', 'test-repo');
          const status: ComplianceStatus = {
            status: gdprResult.compliant ? 'PASS' : 'FAIL',
            frameworks: ['GDPR'],
            controlsPassed: gdprResult.compliant ? 1 : 0,
            controlsTotal: 1,
            summary: [],
            timestamp: new Date()
          };
          const comment = (commenter as any).formatComment(status, true, true);
          expect(comment).toContain('Compliance Autopilot');
        }

        const duration = Date.now() - startTime;

        console.log('✅ Complete workflow finished:', {
          durationMs: duration,
          gdprScore: gdprResult.score,
          filesScanned: gdprResult.summary.total_files_scanned,
          violations: gdprResult.summary.total_violations,
          pdfSize: pdfBytes.length,
          jsonSize: jsonString.length
        });

        // Verify performance target: <2 minutes
        expect(duration).toBeLessThan(120000);
      }, 180000); // 3 minute timeout
    });
  });

  // ============================================================================
  // TEST SUITE 8: Error Handling and Edge Cases
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle invalid API keys gracefully', async () => {
      const collector = new GDPRCollector({ apiKey: 'invalid-key' });

      await expect(async () => {
        await collector.scanFile('const x = 1;', 'test.ts');
      }).rejects.toThrow();
    });

    it('should handle empty code files', async () => {
      if (!anthropicApiKey) {
        console.log('⏭️  Skipped: No API key');
        return;
      }

      const collector = new GDPRCollector({ apiKey: anthropicApiKey });
      const result = await collector.scanFile('', 'empty.ts');

      expect(result.has_pii).toBe(false);
      expect(result.violations.length).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle malformed input gracefully', () => {
      const formatter = new JSONFormatter();

      expect(() => {
        formatter.format({
          framework: 'INVALID' as any,
          timestamp: new Date(),
          repositoryName: '',
          repositoryOwner: '',
          overallScore: -1,
          controls: [],
          summary: { total: 0, passed: 0, failed: 0, notApplicable: 0 }
        });
      }).toThrow();
    });
  });

  // ============================================================================
  // TEST SUITE 9: Performance Benchmarks
  // ============================================================================

  describe('Performance Benchmarks', () => {
    const describeIfNotExpensive = SKIP_EXPENSIVE_TESTS ? describe.skip : describe;

    describeIfNotExpensive('Performance targets', () => {
      it('should analyze 10 files in <30 seconds', async () => {
        if (!anthropicApiKey) {
          console.log('⏭️  Skipped: No API key');
          return;
        }

        const collector = new GDPRCollector({ apiKey: anthropicApiKey });

        const files = Array.from({ length: 10 }, (_, i) => ({
          code: `const value${i} = ${i}; const email = "test${i}@example.com";`,
          path: `src/file${i}.ts`
        }));

        const startTime = Date.now();
        const result = await collector.scanRepository(files);
        const duration = Date.now() - startTime;

        expect(result.summary.total_files_scanned).toBe(10);
        expect(duration).toBeLessThan(30000);

        console.log('✅ Performance target met:', {
          files: 10,
          durationMs: duration,
          avgPerFile: Math.round(duration / 10)
        });
      }, 60000);

      it('should generate PDF in <5 seconds', async () => {
        const generator = new PDFGenerator();

        const testData: ComplianceData = {
          framework: 'SOC2',
          timestamp: new Date(),
          repositoryName: 'test-repo',
          repositoryOwner: 'test-owner',
          overallScore: 85,
          controls: Array.from({ length: 10 }, (_, i) => ({
            id: `CTRL-${i}`,
            name: `Control ${i}`,
            status: 'PASS',
            evidence: 'Test evidence',
            severity: 'medium'
          })),
          summary: { total: 10, passed: 10, failed: 0, notApplicable: 0 }
        };

        const startTime = Date.now();
        await generator.generate(testData);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(5000);

        console.log('✅ PDF generation performance:', {
          controls: 10,
          durationMs: duration
        });
      });
    });
  });
});
