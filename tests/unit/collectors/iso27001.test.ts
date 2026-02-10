/**
 * Unit tests for ISO27001 Collector
 * Test coverage: 95%+
 */

import { ISO27001Collector, ISO27001CollectorConfig } from '../../../src/collectors/iso27001';
import {
  ComplianceFramework,
  ControlResult,
} from '../../../src/types/evidence';
import { Octokit } from '@octokit/rest';

// Mock Octokit
jest.mock('@octokit/rest');

// Mock the logger to avoid @actions/core dependency in tests
jest.mock('../../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}));

/**
 * Helper to build a mock Octokit instance with default stubs for all
 * GitHub API endpoints used by the collector. Individual tests can
 * override specific methods before constructing the collector.
 */
function buildMockOctokit() {
  return {
    repos: {
      listCollaborators: jest.fn().mockResolvedValue({ data: [] }),
      getBranchProtection: jest.fn().mockRejectedValue({ status: 404 }),
      getContent: jest.fn().mockRejectedValue({ status: 404 }),
      get: jest.fn().mockResolvedValue({
        data: { security_and_analysis: null },
      }),
      listCommits: jest.fn().mockResolvedValue({ data: [] }),
    },
    pulls: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      listReviews: jest.fn().mockResolvedValue({ data: [] }),
    },
    issues: {
      listForRepo: jest.fn().mockResolvedValue({ data: [] }),
    },
    actions: {
      listRepoWorkflows: jest.fn().mockResolvedValue({
        data: { total_count: 0, workflows: [] },
      }),
    },
    rest: {
      dependabot: {
        listAlertsForRepo: jest.fn().mockRejectedValue({ status: 403 }),
      },
    },
  };
}

describe('ISO27001Collector', () => {
  let mockOctokitInstance: ReturnType<typeof buildMockOctokit>;
  const baseConfig: ISO27001CollectorConfig = {
    githubToken: 'test-token',
    owner: 'test-owner',
    repo: 'test-repo',
  };

  beforeEach(() => {
    mockOctokitInstance = buildMockOctokit();
    // Make the Octokit constructor return our mock instance
    (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collect', () => {
    it('should collect evidence for all 11 ISO27001 controls', async () => {
      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();

      expect(report.framework).toBe(ComplianceFramework.ISO27001);
      expect(report.repository).toBe('test-owner/test-repo');
      expect(report.evaluations).toHaveLength(11);
      expect(report.summary.totalControls).toBe(11);
      expect(report.period).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.id).toMatch(/^iso27001-/);
    });

    it('should evaluate access control with low admin ratio as PASS', async () => {
      // 1 admin out of 10 collaborators = 10% < 25% threshold
      mockOctokitInstance.repos.listCollaborators.mockResolvedValue({
        data: [
          { permissions: { admin: true }, role_name: 'admin' },
          ...Array(9).fill({ permissions: { admin: false }, role_name: 'write' }),
        ],
      });

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();

      const a923 = report.evaluations.find((e) => e.controlId === 'A.9.2.3');
      expect(a923).toBeDefined();
      expect(a923!.result).toBe(ControlResult.PASS);
      expect(a923!.evidence.length).toBeGreaterThan(0);
      expect(a923!.notes).toContain('10%');
    });

    it('should calculate summary statistics correctly', async () => {
      // Set up branch protection so some controls pass
      mockOctokitInstance.repos.getBranchProtection.mockResolvedValue({
        data: {
          enforce_admins: { enabled: true },
          required_pull_request_reviews: {
            required_approving_review_count: 2,
            require_code_owner_reviews: true,
            dismiss_stale_reviews: true,
          },
        },
      });

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();

      const { summary } = report;
      expect(summary.totalControls).toBe(11);
      // All summary counts should add up to total
      const totalFromCounts =
        summary.passedControls +
        summary.failedControls +
        summary.partialControls +
        summary.notApplicableControls +
        summary.errorControls;
      expect(totalFromCounts).toBe(summary.totalControls);

      // Compliance percentage should be (passed / total) * 100
      const expectedPercentage = Math.round(
        (summary.passedControls / summary.totalControls) * 100
      );
      expect(summary.compliancePercentage).toBe(expectedPercentage);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully and produce ERROR results', async () => {
      // Make all API calls fail with unexpected errors (not 403/404)
      const apiError = new Error('API Error');
      mockOctokitInstance.repos.listCollaborators.mockRejectedValue(apiError);
      mockOctokitInstance.repos.getBranchProtection.mockRejectedValue(apiError);
      mockOctokitInstance.repos.getContent.mockRejectedValue(apiError);
      mockOctokitInstance.repos.get.mockRejectedValue(apiError);
      mockOctokitInstance.pulls.list.mockRejectedValue(apiError);
      mockOctokitInstance.issues.listForRepo.mockRejectedValue(apiError);
      mockOctokitInstance.actions.listRepoWorkflows.mockRejectedValue(apiError);
      mockOctokitInstance.repos.listCommits.mockRejectedValue(apiError);
      mockOctokitInstance.rest.dependabot.listAlertsForRepo.mockRejectedValue(apiError);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();

      // Collection should still complete (no thrown error)
      expect(report.evaluations).toHaveLength(11);
      // Controls that hit unexpected errors should get ERROR result
      const errorEvals = report.evaluations.filter(
        (e) => e.result === ControlResult.ERROR
      );
      expect(errorEvals.length).toBeGreaterThan(0);
      // Error evaluations should have descriptive notes
      for (const evaluation of errorEvals) {
        expect(evaluation.notes).toContain('Error evaluating control');
      }
    });

    it('should continue collection after individual control failure', async () => {
      // Only the collaborators endpoint fails; everything else works
      mockOctokitInstance.repos.listCollaborators.mockRejectedValue(
        new Error('Network timeout')
      );

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();

      // All 9 controls should still be evaluated
      expect(report.evaluations).toHaveLength(11);

      // A.9.2.3 (the one using listCollaborators) should be ERROR
      const a923 = report.evaluations.find((e) => e.controlId === 'A.9.2.3');
      expect(a923).toBeDefined();
      expect(a923!.result).toBe(ControlResult.ERROR);

      // Other controls should not be ERROR (they should still evaluate)
      const nonErrorCount = report.evaluations.filter(
        (e) => e.result !== ControlResult.ERROR
      ).length;
      expect(nonErrorCount).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete collection within timeout', async () => {
      // Set up enough mocks so all controls can evaluate without hanging
      mockOctokitInstance.repos.listCollaborators.mockResolvedValue({
        data: [{ permissions: { admin: false }, role_name: 'write' }],
      });
      mockOctokitInstance.repos.getBranchProtection.mockResolvedValue({
        data: {
          enforce_admins: { enabled: true },
          required_pull_request_reviews: {
            required_approving_review_count: 1,
            require_code_owner_reviews: false,
            dismiss_stale_reviews: false,
          },
        },
      });
      mockOctokitInstance.repos.getContent.mockResolvedValue({
        data: { content: Buffer.from('test').toString('base64'), size: 4 },
      });
      mockOctokitInstance.repos.get.mockResolvedValue({
        data: {
          security_and_analysis: { secret_scanning: { status: 'enabled' } },
        },
      });
      mockOctokitInstance.pulls.list.mockResolvedValue({
        data: [{ number: 1, merged_at: '2025-01-01T00:00:00Z' }],
      });
      mockOctokitInstance.pulls.listReviews.mockResolvedValue({
        data: [{ state: 'APPROVED' }],
      });
      mockOctokitInstance.issues.listForRepo.mockResolvedValue({ data: [] });
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: { total_count: 1, workflows: [{ name: 'CI Tests', state: 'active' }] },
      });
      mockOctokitInstance.repos.listCommits.mockResolvedValue({
        data: [{ sha: 'abc123' }],
      });
      mockOctokitInstance.rest.dependabot.listAlertsForRepo.mockResolvedValue({
        data: [],
      });

      const startTime = Date.now();
      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const duration = Date.now() - startTime;

      // Should complete well under the default 30s timeout
      expect(duration).toBeLessThan(5000);
      expect(report.evaluations).toHaveLength(11);
      // With all mocks returning good data, most controls should pass
      expect(report.summary.passedControls).toBeGreaterThan(0);
    }, 10000);
  });

  describe('A.9.4.1 - Information Access Restriction', () => {
    it('should PASS when branch protection exists', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getBranchProtection.mockResolvedValue({
        data: {
          enforce_admins: { enabled: true },
          required_pull_request_reviews: {
            required_approving_review_count: 2,
            require_code_owner_reviews: true,
          },
        },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.9.4.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('Branch protection is enabled');
    });

    it('should FAIL when no branch protection exists', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getBranchProtection.mockRejectedValue({ status: 404 });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.9.4.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('No branch protection');
    });
  });

  describe('A.12.1.2 - Change Management', () => {
    it('should PASS with 80%+ review approval rate', async () => {
      mockOctokitInstance = buildMockOctokit();
      const mergedPRs = Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        merged_at: '2025-01-15T00:00:00Z',
      }));
      mockOctokitInstance.pulls.list.mockResolvedValue({ data: mergedPRs });
      mockOctokitInstance.pulls.listReviews.mockResolvedValue({
        data: [{ state: 'APPROVED' }],
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.1.2');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('100%');
    });

    it('should FAIL with no merged PRs', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.pulls.list.mockResolvedValue({ data: [] });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.1.2');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('0%');
    });
  });

  describe('A.12.6.1 - Vulnerability Management', () => {
    it('should PASS with dependabot scanning active', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.rest.dependabot.listAlertsForRepo.mockResolvedValue({
        data: [{ severity: 'low', state: 'fixed' }],
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.6.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('Vulnerability management is active');
    });

    it('should FAIL with no scanning tools detected', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.rest.dependabot.listAlertsForRepo.mockRejectedValue({ status: 403 });
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: { total_count: 0, workflows: [] },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.6.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('No vulnerability scanning');
    });
  });

  describe('A.14.2.2 - System Change Control', () => {
    it('should PASS with required reviews >= 1', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getBranchProtection.mockResolvedValue({
        data: {
          required_pull_request_reviews: {
            required_approving_review_count: 2,
            dismiss_stale_reviews: true,
          },
        },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.14.2.2');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('2 approving review(s) required');
    });

    it('should FAIL without required reviews', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getBranchProtection.mockResolvedValue({
        data: {
          enforce_admins: { enabled: true },
        },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.14.2.2');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('No review requirements');
    });
  });

  describe('A.14.2.5 - Secure System Engineering', () => {
    it('should PASS when security policy file exists', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getContent.mockImplementation(({ path }: { path: string }) => {
        if (path === 'SECURITY.md') {
          return Promise.resolve({
            data: { content: Buffer.from('policy').toString('base64'), size: 6 },
          });
        }
        return Promise.reject({ status: 404 });
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.14.2.5');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('SECURITY.md');
    });

    it('should return PARTIAL when no security policy exists', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getContent.mockRejectedValue({ status: 404 });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.14.2.5');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PARTIAL);
      expect(ctrl!.notes).toContain('No SECURITY.md');
    });
  });

  describe('A.14.2.8 - System Security Testing', () => {
    it('should PASS with test workflows present', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: {
          total_count: 2,
          workflows: [
            { name: 'CI Tests' },
            { name: 'Build' },
          ],
        },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.14.2.8');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('2 test/CI workflow(s) found');
    });

    it('should FAIL with no test workflows', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: { total_count: 0, workflows: [] },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.14.2.8');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('No testing workflows');
    });
  });

  describe('A.16.1.2 - Reporting Security Events', () => {
    it('should PASS with security issue template present', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getContent.mockImplementation(({ path }: { path: string }) => {
        if (path === '.github/ISSUE_TEMPLATE/security.md') {
          return Promise.resolve({
            data: { content: Buffer.from('template').toString('base64'), size: 8 },
          });
        }
        return Promise.reject({ status: 404 });
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.16.1.2');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('reporting mechanisms are in place');
    });

    it('should return PARTIAL with no template and no security advisories', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.repos.getContent.mockRejectedValue({ status: 404 });
      mockOctokitInstance.repos.get.mockResolvedValue({
        data: { security_and_analysis: null },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.16.1.2');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PARTIAL);
      expect(ctrl!.notes).toContain('Consider adding security issue templates');
    });
  });

  describe('A.16.1.5 - Response to Information Security Incidents', () => {
    it('should PASS with security issue closure rate >= 70%', async () => {
      mockOctokitInstance = buildMockOctokit();
      const closedIssues = Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        state: 'closed',
        title: `Security issue ${i + 1}`,
        pull_request: undefined,
      }));
      const openIssues = Array.from({ length: 2 }, (_, i) => ({
        number: i + 9,
        state: 'open',
        title: `Security issue ${i + 9}`,
        pull_request: undefined,
      }));
      mockOctokitInstance.issues.listForRepo.mockResolvedValue({
        data: [...closedIssues, ...openIssues],
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.16.1.5');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('80%');
    });

    it('should return PARTIAL with low closure rate', async () => {
      mockOctokitInstance = buildMockOctokit();
      const closedIssues = Array.from({ length: 2 }, (_, i) => ({
        number: i + 1,
        state: 'closed',
        title: `Security issue ${i + 1}`,
        pull_request: undefined,
      }));
      const openIssues = Array.from({ length: 8 }, (_, i) => ({
        number: i + 3,
        state: 'open',
        title: `Security issue ${i + 3}`,
        pull_request: undefined,
      }));
      mockOctokitInstance.issues.listForRepo.mockResolvedValue({
        data: [...closedIssues, ...openIssues],
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.16.1.5');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PARTIAL);
      expect(ctrl!.notes).toContain('20%');
    });
  });

  describe('A.12.2.1 - Controls Against Malware', () => {
    it('should PASS when security scanning workflow exists', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: {
          total_count: 2,
          workflows: [
            { name: 'CodeQL Analysis', path: '.github/workflows/codeql.yml' },
            { name: 'Build', path: '.github/workflows/build.yml' },
          ],
        },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.2.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('security scanning workflow(s) found');
    });

    it('should FAIL when no workflows match security keywords', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: {
          total_count: 1,
          workflows: [
            { name: 'Build', path: '.github/workflows/build.yml' },
          ],
        },
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.2.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('No security scanning workflows');
    });
  });

  describe('A.12.4.1 - Event Logging', () => {
    it('should PASS when workflows exist and are active', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: {
          total_count: 1,
          workflows: [
            { name: 'CI', path: '.github/workflows/ci.yml', state: 'active' },
          ],
        },
      });
      mockOctokitInstance.repos.listCommits.mockResolvedValue({
        data: [{ sha: 'abc123' }, { sha: 'def456' }],
      });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.4.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.PASS);
      expect(ctrl!.notes).toContain('active workflow(s) with recent commit activity');
    });

    it('should FAIL when no workflows found', async () => {
      mockOctokitInstance = buildMockOctokit();
      mockOctokitInstance.actions.listRepoWorkflows.mockResolvedValue({
        data: { total_count: 0, workflows: [] },
      });
      mockOctokitInstance.repos.listCommits.mockResolvedValue({ data: [] });
      (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokitInstance);

      const collector = new ISO27001Collector(baseConfig);
      const report = await collector.collect();
      const ctrl = report.evaluations.find((e) => e.controlId === 'A.12.4.1');

      expect(ctrl).toBeDefined();
      expect(ctrl!.result).toBe(ControlResult.FAIL);
      expect(ctrl!.notes).toContain('No active workflows or no recent activity');
    });
  });

});
