/**
 * Unit tests for SOC2 Collector
 */

import { SOC2Collector, SOC2CollectorConfig } from '../../../src/collectors/soc2';
import {
  ComplianceFramework,
  ControlResult,
} from '../../../src/types/evidence';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('SOC2Collector', () => {
  let collector: SOC2Collector;
  let mockOctokit: jest.Mocked<any>;
  let config: SOC2CollectorConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOctokit = {
      repos: {
        getBranchProtection: jest.fn(),
        listCollaborators: jest.fn(),
        listDeployments: jest.fn(),
        getContent: jest.fn(),
        getAllEnvironments: jest.fn(),
      },
      pulls: {
        list: jest.fn(),
      },
      issues: {
        listForRepo: jest.fn(),
      },
      actions: {
        listRepoWorkflows: jest.fn(),
      },
    };

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(
      () => mockOctokit as unknown as Octokit
    );

    config = {
      owner: 'test-owner',
      repo: 'test-repo',
      githubToken: 'test-token',
      gitRef: 'main',
    };

    collector = new SOC2Collector(config);
  });

  /**
   * Helper to set up all mocks with sensible defaults for a full collect() run.
   * Individual tests can override specific mocks after calling this.
   */
  function setupDefaultMocks() {
    mockOctokit.repos.getBranchProtection.mockResolvedValue({
      data: {
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          dismiss_stale_reviews: false,
        },
      },
    });

    mockOctokit.pulls.list.mockResolvedValue({
      data: [
        {
          number: 1,
          title: 'Test PR',
          body: 'Test description',
          merged_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/test/pull/1',
        },
      ],
    });

    mockOctokit.actions.listRepoWorkflows.mockResolvedValue({
      data: {
        total_count: 1,
        workflows: [
          {
            id: 1,
            name: 'Deploy',
            state: 'active',
            path: '.github/workflows/deploy.yml',
          },
        ],
      },
    });

    mockOctokit.repos.listDeployments.mockResolvedValue({
      data: [
        {
          id: 1,
          environment: 'production',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    });

    mockOctokit.repos.listCollaborators.mockResolvedValue({
      data: [
        { login: 'admin1', permissions: { admin: true, push: true, pull: true }, role_name: 'admin' },
        { login: 'dev1', permissions: { admin: false, push: true, pull: true }, role_name: 'write' },
        { login: 'dev2', permissions: { admin: false, push: true, pull: true }, role_name: 'write' },
      ],
    });

    mockOctokit.issues.listForRepo.mockResolvedValue({
      data: [],
    });

    mockOctokit.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('# Security Policy').toString('base64') },
    });

    mockOctokit.repos.getAllEnvironments.mockResolvedValue({
      data: {
        environments: [
          {
            name: 'production',
            protection_rules: [{ type: 'required_reviewers' }],
          },
        ],
      },
    });
  }

  describe('collect', () => {
    it('should collect SOC2 compliance evidence successfully', async () => {
      setupDefaultMocks();

      const report = await collector.collect();

      expect(report).toBeDefined();
      expect(report.framework).toBe(ComplianceFramework.SOC2);
      expect(report.repository).toBe('test-owner/test-repo');
      expect(report.evaluations).toHaveLength(10);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalControls).toBe(10);
    });

    it('should handle API errors gracefully', async () => {
      // When all API calls fail, the collector catches errors per-control
      // and returns ERROR results rather than throwing.
      mockOctokit.repos.getBranchProtection.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.pulls.list.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.actions.listRepoWorkflows.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.repos.listDeployments.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.repos.listCollaborators.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.issues.listForRepo.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.repos.getContent.mockRejectedValue(
        new Error('API Error')
      );
      mockOctokit.repos.getAllEnvironments.mockRejectedValue(
        new Error('API Error')
      );

      const report = await collector.collect();

      expect(report).toBeDefined();
      expect(report.evaluations).toHaveLength(10);
      // All controls should be ERROR because every API call fails
      for (const evaluation of report.evaluations) {
        expect(evaluation.result).toBe(ControlResult.ERROR);
      }
      expect(report.summary.errorControls).toBe(10);
      expect(report.summary.compliancePercentage).toBe(0);
    });
  });

  describe('CC5.2 - Dependency Risk Management', () => {
    it('should PASS when dependabot.yml exists', async () => {
      setupDefaultMocks();

      const report = await collector.collect();
      const cc52Result = report.evaluations.find((c) => c.controlId === 'CC5.2');

      expect(cc52Result).toBeDefined();
      expect(cc52Result?.result).toBe(ControlResult.PASS);
      expect(cc52Result?.evidence.length).toBeGreaterThan(0);
      expect(cc52Result?.notes).toContain('Dependabot configuration found');
    });

    it('should FAIL when dependabot.yml does not exist', async () => {
      setupDefaultMocks();

      // Override getContent to 404 for dependabot.yml
      mockOctokit.repos.getContent.mockImplementation(
        async ({ path }: { path: string }) => {
          if (path === '.github/dependabot.yml') {
            const err = new Error('Not Found') as Error & { status: number };
            err.status = 404;
            throw err;
          }
          return { data: { content: Buffer.from('content').toString('base64') } };
        }
      );

      const report = await collector.collect();
      const cc52Result = report.evaluations.find((c) => c.controlId === 'CC5.2');

      expect(cc52Result).toBeDefined();
      expect(cc52Result?.result).toBe(ControlResult.FAIL);
      expect(cc52Result?.findings?.length).toBeGreaterThan(0);
    });
  });

  describe('CC8.1 - Change Management', () => {
    it('should PASS when 80%+ PRs are merged', async () => {
      setupDefaultMocks();

      // Override pulls.list for CC8.1 - 9 merged, 1 closed without merge = 90%
      mockOctokit.pulls.list.mockResolvedValue({
        data: [
          ...Array.from({ length: 9 }, (_, i) => ({
            number: i + 1,
            title: `PR ${i + 1}`,
            merged_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
          })),
          {
            number: 10,
            title: 'Closed PR',
            merged_at: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      });

      const report = await collector.collect();
      const cc81Result = report.evaluations.find((c) => c.controlId === 'CC8.1');

      expect(cc81Result).toBeDefined();
      expect(cc81Result?.result).toBe(ControlResult.PASS);
      expect(cc81Result?.notes).toContain('90%');
    });

    it('should FAIL when no PRs exist', async () => {
      setupDefaultMocks();

      mockOctokit.pulls.list.mockResolvedValue({ data: [] });

      const report = await collector.collect();
      const cc81Result = report.evaluations.find((c) => c.controlId === 'CC8.1');

      expect(cc81Result).toBeDefined();
      expect(cc81Result?.result).toBe(ControlResult.FAIL);
      expect(cc81Result?.findings?.length).toBeGreaterThan(0);
    });

    it('should return PARTIAL when merge rate is between 50% and 80%', async () => {
      setupDefaultMocks();

      // 6 merged, 4 closed = 60%
      mockOctokit.pulls.list.mockResolvedValue({
        data: [
          ...Array.from({ length: 6 }, (_, i) => ({
            number: i + 1,
            title: `Merged PR ${i + 1}`,
            merged_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
          })),
          ...Array.from({ length: 4 }, (_, i) => ({
            number: i + 7,
            title: `Closed PR ${i + 7}`,
            merged_at: null,
            created_at: '2024-01-01T00:00:00Z',
          })),
        ],
      });

      const report = await collector.collect();
      const cc81Result = report.evaluations.find((c) => c.controlId === 'CC8.1');

      expect(cc81Result).toBeDefined();
      expect(cc81Result?.result).toBe(ControlResult.PARTIAL);
    });
  });

    describe('CC1.1 - Code Review Process', () => {
    it('should PASS when branch protection requires approval', async () => {
      setupDefaultMocks();

      // Override workflows to have no workflows (zero total_count)
      mockOctokit.actions.listRepoWorkflows.mockResolvedValue({
        data: { total_count: 0, workflows: [] },
      });
      mockOctokit.repos.listDeployments.mockResolvedValue({ data: [] });
      mockOctokit.repos.listCollaborators.mockResolvedValue({ data: [] });

      const report = await collector.collect();
      const cc11Result = report.evaluations.find((c) => c.controlId === 'CC1.1');

      expect(cc11Result).toBeDefined();
      expect(cc11Result?.result).toBe(ControlResult.PASS);
      expect(cc11Result?.evidence.length).toBeGreaterThan(0);
    });

    it('should FAIL when branch protection does not require approval', async () => {
      setupDefaultMocks();

      // Override branch protection to have no required reviews
      mockOctokit.repos.getBranchProtection.mockResolvedValue({
        data: {
          required_pull_request_reviews: null,
        },
      });

      mockOctokit.pulls.list.mockResolvedValue({ data: [] });
      mockOctokit.actions.listRepoWorkflows.mockResolvedValue({
        data: { total_count: 0, workflows: [] },
      });
      mockOctokit.repos.listDeployments.mockResolvedValue({ data: [] });
      mockOctokit.repos.listCollaborators.mockResolvedValue({ data: [] });

      const report = await collector.collect();
      const cc11Result = report.evaluations.find((c) => c.controlId === 'CC1.1');

      expect(cc11Result).toBeDefined();
      expect(cc11Result?.result).toBe(ControlResult.FAIL);
      expect(cc11Result?.findings).toBeDefined();
      expect(cc11Result?.findings?.length).toBeGreaterThan(0);
    });
  });
});
