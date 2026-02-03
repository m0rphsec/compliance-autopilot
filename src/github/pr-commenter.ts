/**
 * PR Comment Manager
 *
 * Formats and posts compliance status comments to pull requests
 * with professional markdown formatting and clear status indicators.
 */

import { Octokit } from '@octokit/rest';
// import { GitHubClient } from './api-client.js';

export interface ComplianceStatus {
  status: 'PASS' | 'FAIL' | 'WARNING';
  frameworks: string[];
  controlsPassed: number;
  controlsTotal: number;
  summary: ComplianceSummaryItem[];
  reportUrl?: string;
  scanDuration?: number;
  timestamp: Date;
}

export interface ComplianceSummaryItem {
  control: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  description: string;
  details?: string;
}

export interface PRCommentConfig {
  prNumber: number;
  owner: string;
  repo: string;
  status: ComplianceStatus;
  includeDetails?: boolean;
  collapseDetails?: boolean;
}

/**
 * PR Comment Manager for posting compliance reports
 */
export class PRCommenter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private commentMarker: string = '<!-- compliance-autopilot-comment -->';

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Post or update compliance status comment on PR
   */
  async postComment(config: PRCommentConfig): Promise<number> {
    const commentBody = this.formatComment(
      config.status,
      config.includeDetails,
      config.collapseDetails
    );

    // Check if comment already exists
    const existingCommentId = await this.findExistingComment(config.prNumber);

    if (existingCommentId) {
      // Update existing comment
      await this.updateComment(existingCommentId, commentBody);
      return existingCommentId;
    } else {
      // Create new comment
      return await this.createComment(config.prNumber, commentBody);
    }
  }

  /**
   * Format compliance status as markdown comment
   */
  private formatComment(
    status: ComplianceStatus,
    includeDetails: boolean = true,
    collapseDetails: boolean = true
  ): string {
    const statusEmoji = this.getStatusEmoji(status.status);
    const passRate = ((status.controlsPassed / status.controlsTotal) * 100).toFixed(1);

    let comment = this.commentMarker + '\n\n';

    // Header with status badge
    comment += `## ${statusEmoji} Compliance Autopilot Report\n\n`;
    comment += `**Status**: \`${status.status}\` ${statusEmoji}\n`;
    comment += `**Frameworks**: ${status.frameworks.join(', ')}\n`;
    comment += `**Controls Passed**: ${status.controlsPassed}/${status.controlsTotal} (${passRate}%)\n`;

    if (status.scanDuration) {
      comment += `**Scan Duration**: ${(status.scanDuration / 1000).toFixed(1)}s\n`;
    }

    comment += `**Timestamp**: ${status.timestamp.toISOString()}\n\n`;

    // Progress bar
    comment += this.formatProgressBar(status.controlsPassed, status.controlsTotal);
    comment += '\n\n';

    // Summary section
    comment += '### 📋 Summary\n\n';

    const passed = status.summary.filter((s) => s.status === 'PASS');
    const failed = status.summary.filter((s) => s.status === 'FAIL');
    const warnings = status.summary.filter((s) => s.status === 'WARNING');
    const skipped = status.summary.filter((s) => s.status === 'SKIPPED');

    if (passed.length > 0) {
      comment += `✅ **${passed.length} controls passed**\n`;
      if (!collapseDetails) {
        passed.slice(0, 5).forEach((item) => {
          comment += `  - ${item.control}: ${item.description}\n`;
        });
        if (passed.length > 5) {
          comment += `  - ... and ${passed.length - 5} more\n`;
        }
      }
      comment += '\n';
    }

    if (failed.length > 0) {
      comment += `❌ **${failed.length} controls failed**\n`;
      failed.forEach((item) => {
        comment += `  - ${item.control}: ${item.description}\n`;
        if (item.details) {
          comment += `    > ${item.details}\n`;
        }
      });
      comment += '\n';
    }

    if (warnings.length > 0) {
      comment += `⚠️ **${warnings.length} warnings**\n`;
      warnings.forEach((item) => {
        comment += `  - ${item.control}: ${item.description}\n`;
      });
      comment += '\n';
    }

    if (skipped.length > 0 && !collapseDetails) {
      comment += `⏭️ **${skipped.length} controls skipped**\n\n`;
    }

    // Detailed findings (collapsible)
    if (includeDetails && (failed.length > 0 || warnings.length > 0)) {
      comment += '<details>\n';
      comment += '<summary><strong>🔍 Detailed Findings</strong></summary>\n\n';

      if (failed.length > 0) {
        comment += '#### ❌ Failed Controls\n\n';
        failed.forEach((item) => {
          comment += `**${item.control}** - ${item.description}\n`;
          if (item.details) {
            comment += `\`\`\`\n${item.details}\n\`\`\`\n`;
          }
          comment += '\n';
        });
      }

      if (warnings.length > 0) {
        comment += '#### ⚠️ Warnings\n\n';
        warnings.forEach((item) => {
          comment += `**${item.control}** - ${item.description}\n`;
          if (item.details) {
            comment += `\`\`\`\n${item.details}\n\`\`\`\n`;
          }
          comment += '\n';
        });
      }

      comment += '</details>\n\n';
    }

    // Report link
    if (status.reportUrl) {
      comment += `📊 **[View Full Report](${status.reportUrl})**\n\n`;
    }

    // Footer
    comment += '---\n';
    comment +=
      '_Generated by [Compliance Autopilot](https://github.com/marketplace/actions/compliance-autopilot)';
    comment += ` • Last updated: ${new Date().toISOString()}_\n`;

    return comment;
  }

  /**
   * Format progress bar for visual status
   */
  private formatProgressBar(passed: number, total: number): string {
    const percentage = (passed / total) * 100;
    const barLength = 20;
    const filledLength = Math.round((barLength * passed) / total);
    const emptyLength = barLength - filledLength;

    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(emptyLength);

    let color = '🟢';
    if (percentage < 50) color = '🔴';
    else if (percentage < 80) color = '🟡';

    return `${color} \`[${filledBar}${emptyBar}]\` ${percentage.toFixed(1)}%`;
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'PASS':
        return '✅';
      case 'FAIL':
        return '❌';
      case 'WARNING':
        return '⚠️';
      default:
        return '❓';
    }
  }

  /**
   * Find existing compliance comment
   */
  private async findExistingComment(prNumber: number): Promise<number | null> {
    try {
      const comments = await this.octokit.rest.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
      });

      const existingComment = comments.data.find((comment) =>
        comment.body?.includes(this.commentMarker)
      );

      return existingComment ? existingComment.id : null;
    } catch (error) {
      console.error('Error finding existing comment:', error);
      return null;
    }
  }

  /**
   * Create new comment
   */
  private async createComment(prNumber: number, body: string): Promise<number> {
    try {
      const response = await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        body,
      });

      return response.data.id;
    } catch (error: any) {
      throw new Error(
        `Failed to create PR comment: ${error.message}\n\n` +
          `This usually means the GitHub token lacks 'issues:write' permission.\n` +
          `Add to your workflow:\n` +
          `  permissions:\n` +
          `    issues: write\n` +
          `    pull-requests: write`
      );
    }
  }

  /**
   * Update existing comment
   */
  private async updateComment(commentId: number, body: string): Promise<void> {
    try {
      await this.octokit.rest.issues.updateComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: commentId,
        body,
      });
    } catch (error: any) {
      throw new Error(`Failed to update PR comment: ${error.message}`);
    }
  }

  /**
   * Delete comment (for cleanup)
   */
  async deleteComment(prNumber: number): Promise<void> {
    const commentId = await this.findExistingComment(prNumber);

    if (commentId) {
      try {
        await this.octokit.rest.issues.deleteComment({
          owner: this.owner,
          repo: this.repo,
          comment_id: commentId,
        });
      } catch (error: any) {
        console.error(`Failed to delete comment: ${error.message}`);
      }
    }
  }
}

/**
 * Factory function for creating PR commenter
 */
export function createPRCommenter(token: string, owner: string, repo: string): PRCommenter {
  return new PRCommenter(token, owner, repo);
}
