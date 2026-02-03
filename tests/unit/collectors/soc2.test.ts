/**
 * Unit tests for SOC2 Collector
 */

import { SOC2Collector } from '../../../src/collectors/soc2';
import {
  ComplianceStatus,
  Framework,
  CollectorConfig,
} from '../../../src/types/evidence';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('SOC2Collector', () => {
  let collector: SOC2Collector;
  let mockOctokit: jest.Mocked<any>;
  let config: CollectorConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOctokit = {
      rest: {
        repos: {
          getBranchProtection: jest.fn(),
          getContent: jest.fn(),
          listCollaborators: jest.fn(),
          listDeployments: jest.fn(),
        },
        pulls: {
          list: jest.fn(),
          listReviews: jest.fn(),
        },
        issues: {
          listForRepo: jest.fn(),
          listComments: jest.fn(),
        },
        actions: {
          listRepoWorkflows: jest.fn(),
        },
      },
      request: jest.fn(),
    };

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(
      () => mockOctokit
    );

    config = {
      owner: 'test-owner',
      repo: 'test-repo',
      githubToken: 'test-token',
      gitRef: 'main',
    };

    collector = new SOC2Collector(config);
  });

  describe('collect', () => {
    it('should collect SOC2 compliance evidence successfully', async () => {
      mockOctokit.rest.repos.getBranchProtection.mockResolvedValue({
        data: {
          required_pull_request_reviews: {
            required_approving_review_count: 1,
          },
        },
      });

      mockOctokit.rest.pulls.list.mockResolvedValue({
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

      mockOctokit.rest.pulls.listReviews.mockResolvedValue({
        data: [{ state: 'APPROVED' }],
      });

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from('# Code of Conduct').toString('base64'),
        },
      });

      mockOctokit.rest.actions.listRepoWorkflows.mockResolvedValue({
        data: {
          workflows: [
            {
              id: 1,
              name: 'Deploy',
              state: 'active',
              path: '.github/workflows/deploy.yml',
              html_url: 'https://github.com/test/test/actions',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      mockOctokit.rest.repos.listDeployments.mockResolvedValue({
        data: [
          {
            id: 1,
            environment: 'production',
            ref: 'main',
            created_at: '2024-01-01T00:00:00Z',
            url: 'https://api.github.com/repos/test/test/deployments/1',
            creator: { login: 'test-user' },
          },
        ],
      });

      mockOctokit.rest.repos.listCollaborators.mockResolvedValue({
        data: [
          { login: 'admin1', permissions: { admin: true, push: true, pull: true } },
          { login: 'dev1', permissions: { admin: false, push: true, pull: true } },
          { login: 'dev2', permissions: { admin: false, push: true, pull: true } },
        ],
      });

      mockOctokit.rest.issues.listForRepo.mockResolvedValue({
        data: [],
      });

      mockOctokit.request.mockResolvedValue({
        data: [],
      });

      const report = await collector.collect();

      expect(report).toBeDefined();
      expect(report.framework).toBe(Framework.SOC2);
      expect(report.repository.owner).toBe('test-owner');
      expect(report.repository.name).toBe('test-repo');
      expect(report.controls).toHaveLength(20);
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBe(20);
    });

    it('should handle API errors gracefully', async () => {
      mockOctokit.rest.repos.getBranchProtection.mockRejectedValue(
        new Error('API Error')
      );

      await expect(collector.collect()).rejects.toThrow();
    });
  });

  describe('CC1.1 - Code Review Process', () => {
    it('should PASS when branch protection requires approval', async () => {
      mockOctokit.rest.repos.getBranchProtection.mockResolvedValue({
        data: {
          required_pull_request_reviews: {
            required_approving_review_count: 1,
          },
        },
      });

      mockOctokit.rest.pulls.list.mockResolvedValue({
        data: [
          {
            number: 1,
            title: 'Test PR',
            merged_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            html_url: 'https://github.com/test/test/pull/1',
          },
        ],
      });

      mockOctokit.rest.pulls.listReviews.mockResolvedValue({
        data: [{ state: 'APPROVED' }],
      });

      mockOctokit.rest.repos.getContent.mockRejectedValue({ status: 404 });
      mockOctokit.rest.actions.listRepoWorkflows.mockResolvedValue({
        data: { workflows: [] },
      });
      mockOctokit.rest.repos.listDeployments.mockResolvedValue({ data: [] });
      mockOctokit.rest.repos.listCollaborators.mockResolvedValue({ data: [] });
      mockOctokit.rest.issues.listForRepo.mockResolvedValue({ data: [] });
      mockOctokit.request.mockResolvedValue({ data: [] });

      const report = await collector.collect();
      const cc11Result = report.controls.find((c) => c.controlId === 'CC1.1');

      expect(cc11Result).toBeDefined();
      expect(cc11Result?.status).toBe(ComplianceStatus.PASS);
      expect(cc11Result?.evidence.length).toBeGreaterThan(0);
    });

    it('should FAIL when branch protection does not require approval', async () => {
      mockOctokit.rest.repos.getBranchProtection.mockResolvedValue({
        data: {
          required_pull_request_reviews: null,
        },
      });

      mockOctokit.rest.pulls.list.mockResolvedValue({ data: [] });
      mockOctokit.rest.repos.getContent.mockRejectedValue({ status: 404 });
      mockOctokit.rest.actions.listRepoWorkflows.mockResolvedValue({
        data: { workflows: [] },
      });
      mockOctokit.rest.repos.listDeployments.mockResolvedValue({ data: [] });
      mockOctokit.rest.repos.listCollaborators.mockResolvedValue({ data: [] });
      mockOctokit.rest.issues.listForRepo.mockResolvedValue({ data: [] });
      mockOctokit.request.mockResolvedValue({ data: [] });

      const report = await collector.collect();
      const cc11Result = report.controls.find((c) => c.controlId === 'CC1.1');

      expect(cc11Result).toBeDefined();
      expect(cc11Result?.status).toBe(ComplianceStatus.FAIL);
      expect(cc11Result?.recommendations).toBeDefined();
    });
  });
});
