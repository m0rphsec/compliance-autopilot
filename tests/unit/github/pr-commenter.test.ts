/**
 * Unit tests for PR Commenter
 *
 * Tests comment formatting, updating, and markdown generation
 */

import { PRCommenter, ComplianceStatus, ComplianceSummaryItem } from '../../../src/github/pr-commenter';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('PRCommenter', () => {
  let commenter: PRCommenter;
  let mockOctokit: jest.Mocked<Octokit>;

  const mockStatus: ComplianceStatus = {
    status: 'PASS',
    frameworks: ['SOC2', 'GDPR'],
    controlsPassed: 58,
    controlsTotal: 64,
    summary: [
      {
        control: 'CC1.1',
        status: 'PASS',
        description: 'Code review process',
        details: 'All PRs have required approvals',
      },
      {
        control: 'CC6.1',
        status: 'FAIL',
        description: 'Deployment controls',
        details: 'No CI/CD workflow detected',
      },
      {
        control: 'GDPR-PII',
        status: 'PASS',
        description: 'GDPR PII detection',
        details: 'No violations found',
      },
    ],
    reportUrl: 'https://github.com/test/repo/releases/tag/compliance-123',
    scanDuration: 45000,
    timestamp: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOctokit = {
      rest: {
        issues: {
          listComments: jest.fn(),
          createComment: jest.fn(),
          updateComment: jest.fn(),
          deleteComment: jest.fn(),
        },
      },
    } as any;

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);

    commenter = new PRCommenter('test-token', 'test-owner', 'test-repo');
  });

  describe('postComment', () => {
    it('should create new comment when none exists', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({
        data: { id: 123 },
      } as any);

      const commentId = await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      expect(commentId).toBe(123);
      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith(
        expect.objectContaining({
          issue_number: 1,
          body: expect.stringContaining('Compliance Autopilot Report'),
        })
      );
    });

    it('should update existing comment', async () => {
      const existingComment = {
        id: 456,
        body: '<!-- compliance-autopilot-comment -->\nOld content',
      };

      mockOctokit.rest.issues.listComments.mockResolvedValue({
        data: [existingComment],
      } as any);
      mockOctokit.rest.issues.updateComment.mockResolvedValue({} as any);

      const commentId = await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      expect(commentId).toBe(456);
      expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith(
        expect.objectContaining({
          comment_id: 456,
          body: expect.stringContaining('Compliance Autopilot Report'),
        })
      );
      expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    });

    it('should handle create comment permission error', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockRejectedValue(new Error('Forbidden'));

      await expect(
        commenter.postComment({
          prNumber: 1,
          owner: 'test-owner',
          repo: 'test-repo',
          status: mockStatus,
        })
      ).rejects.toThrow(/Failed to create PR comment/);
    });
  });

  describe('Comment Formatting', () => {
    it('should include status header with emoji', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('## ✅ Compliance Autopilot Report');
      expect(call.body).toContain('**Status**: `PASS` ✅');
    });

    it('should show correct emoji for FAIL status', async () => {
      const failStatus = { ...mockStatus, status: 'FAIL' as const };

      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: failStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('## ❌ Compliance Autopilot Report');
      expect(call.body).toContain('**Status**: `FAIL` ❌');
    });

    it('should show frameworks list', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('**Frameworks**: SOC2, GDPR');
    });

    it('should show controls passed with percentage', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('**Controls Passed**: 58/64 (90.6%)');
    });

    it('should show scan duration', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('**Scan Duration**: 45.0s');
    });

    it('should include progress bar', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toMatch(/\[█+░*\]/); // Progress bar pattern
      expect(call.body).toContain('90.6%');
    });

    it('should show correct progress bar color', async () => {
      // Test red for <50%
      const lowStatus = { ...mockStatus, controlsPassed: 20, controlsTotal: 64 };
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: lowStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('🔴'); // Red for low percentage
    });
  });

  describe('Summary Section', () => {
    it('should show passed controls summary', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('✅ **2 controls passed**');
    });

    it('should show failed controls with details', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('❌ **1 controls failed**');
      expect(call.body).toContain('CC6.1: Deployment controls');
      expect(call.body).toContain('> No CI/CD workflow detected');
    });

    it('should not show passed control details when collapsed', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
        collapseDetails: true,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).not.toContain('CC1.1: Code review process');
    });
  });

  describe('Detailed Findings', () => {
    it('should include collapsible detailed findings', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
        includeDetails: true,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('<details>');
      expect(call.body).toContain('<summary><strong>🔍 Detailed Findings</strong></summary>');
      expect(call.body).toContain('#### ❌ Failed Controls');
      expect(call.body).toContain('**CC6.1** - Deployment controls');
    });

    it('should not include details when disabled', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
        includeDetails: false,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).not.toContain('<details>');
      expect(call.body).not.toContain('Detailed Findings');
    });
  });

  describe('Report Link', () => {
    it('should include report URL when provided', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('📊 **[View Full Report]');
      expect(call.body).toContain(mockStatus.reportUrl);
    });

    it('should not show report link when URL missing', async () => {
      const statusWithoutUrl = { ...mockStatus, reportUrl: undefined };

      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: statusWithoutUrl,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).not.toContain('View Full Report');
    });
  });

  describe('Comment Marker', () => {
    it('should include marker for finding existing comments', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: mockStatus,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('<!-- compliance-autopilot-comment -->');
    });
  });

  describe('deleteComment', () => {
    it('should delete existing comment', async () => {
      const existingComment = {
        id: 789,
        body: '<!-- compliance-autopilot-comment -->\nOld content',
      };

      mockOctokit.rest.issues.listComments.mockResolvedValue({
        data: [existingComment],
      } as any);
      mockOctokit.rest.issues.deleteComment.mockResolvedValue({} as any);

      await commenter.deleteComment(1);

      expect(mockOctokit.rest.issues.deleteComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        comment_id: 789,
      });
    });

    it('should handle missing comment gracefully', async () => {
      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);

      await expect(commenter.deleteComment(1)).resolves.not.toThrow();
      expect(mockOctokit.rest.issues.deleteComment).not.toHaveBeenCalled();
    });
  });

  describe('Warnings', () => {
    it('should show warnings section', async () => {
      const statusWithWarnings: ComplianceStatus = {
        ...mockStatus,
        summary: [
          ...mockStatus.summary,
          {
            control: 'CC2.1',
            status: 'WARNING',
            description: 'Communication policy needs review',
          },
        ],
      };

      mockOctokit.rest.issues.listComments.mockResolvedValue({ data: [] } as any);
      mockOctokit.rest.issues.createComment.mockResolvedValue({ data: { id: 1 } } as any);

      await commenter.postComment({
        prNumber: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        status: statusWithWarnings,
      });

      const call = mockOctokit.rest.issues.createComment.mock.calls[0][0];
      expect(call.body).toContain('⚠️ **1 warnings**');
      expect(call.body).toContain('CC2.1: Communication policy needs review');
    });
  });
});
