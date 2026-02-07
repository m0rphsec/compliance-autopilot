/**
 * GitHub API Client
 *
 * Provides a robust wrapper around Octokit with:
 * - Exponential backoff for rate limiting
 * - Clear permission error messages
 * - Request retry logic
 * - Comprehensive error handling
 */
export interface GitHubClientConfig {
    token: string;
    owner: string;
    repo: string;
    baseUrl?: string;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    used: number;
}
export interface PRReview {
    id: number;
    user: string;
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
    submittedAt: Date;
}
export interface Collaborator {
    login: string;
    permissions: {
        admin: boolean;
        maintain: boolean;
        push: boolean;
        triage: boolean;
        pull: boolean;
    };
}
export interface Deployment {
    id: number;
    environment: string;
    createdAt: Date;
    creator: string;
    ref: string;
}
export declare class GitHubAPIError extends Error {
    statusCode?: number | undefined;
    errorType?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, errorType?: string | undefined);
}
export declare class RateLimitError extends GitHubAPIError {
    resetAt: Date;
    limit: number;
    remaining: number;
    constructor(message: string, resetAt: Date, limit: number, remaining: number);
}
export declare class PermissionError extends GitHubAPIError {
    requiredScopes: string[];
    constructor(message: string, requiredScopes: string[]);
}
/**
 * GitHub API Client with enterprise-grade error handling
 */
export declare class GitHubClient {
    private octokit;
    private owner;
    private repo;
    constructor(config: GitHubClientConfig);
    /**
     * Get current rate limit status
     */
    getRateLimit(): Promise<RateLimitInfo>;
    /**
     * Get PR reviews with retry and rate limit handling
     */
    getPRReviews(prNumber: number): Promise<PRReview[]>;
    /**
     * Get repository collaborators
     */
    getCollaborators(): Promise<Collaborator[]>;
    /**
     * Get deployment history
     */
    getDeployments(limit?: number): Promise<Deployment[]>;
    /**
     * Get file content
     */
    getFileContent(path: string, ref?: string): Promise<string>;
    /**
     * List issues with labels
     */
    getIssues(labels?: string[], state?: 'open' | 'closed' | 'all'): Promise<any[]>;
    /**
     * Compare commits between two refs
     */
    compareCommits(base: string, head: string): Promise<any>;
    /**
     * Get vulnerability alerts (requires admin permissions)
     */
    getVulnerabilityAlerts(): Promise<any[]>;
    /**
     * Check if error is a permission error
     */
    private isPermissionError;
    /**
     * Check if error is a rate limit error
     */
    private isRateLimitError;
    /**
     * Comprehensive error handler with actionable messages
     */
    private handleError;
}
/**
 * Factory function for creating GitHub client
 */
export declare function createGitHubClient(config: GitHubClientConfig): GitHubClient;
//# sourceMappingURL=api-client.d.ts.map