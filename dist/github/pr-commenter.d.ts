/**
 * PR Comment Manager
 *
 * Formats and posts compliance status comments to pull requests
 * with professional markdown formatting and clear status indicators.
 */
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
export declare class PRCommenter {
    private octokit;
    private owner;
    private repo;
    private commentMarker;
    constructor(token: string, owner: string, repo: string);
    /**
     * Post or update compliance status comment on PR
     */
    postComment(config: PRCommentConfig): Promise<number>;
    /**
     * Format compliance status as markdown comment
     */
    private formatComment;
    /**
     * Format progress bar for visual status
     */
    private formatProgressBar;
    /**
     * Get status emoji
     */
    private getStatusEmoji;
    /**
     * Find existing compliance comment
     */
    private findExistingComment;
    /**
     * Create new comment
     */
    private createComment;
    /**
     * Update existing comment
     */
    private updateComment;
    /**
     * Delete comment (for cleanup)
     */
    deleteComment(prNumber: number): Promise<void>;
}
/**
 * Factory function for creating PR commenter
 */
export declare function createPRCommenter(token: string, owner: string, repo: string): PRCommenter;
//# sourceMappingURL=pr-commenter.d.ts.map