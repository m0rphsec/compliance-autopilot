/**
 * ISO27001 Compliance Evidence Collector
 *
 * Collects evidence for ISO27001 Information Security Management System (ISMS) controls
 * using GitHub API data.
 *
 * Key control areas covered:
 * - A.9: Access Control
 * - A.12: Operations Security
 * - A.14: System Acquisition, Development, Maintenance
 * - A.16: Information Security Incident Management
 */
import { ComplianceReport } from '../types/evidence';
/**
 * ISO27001 Collector Configuration
 */
export interface ISO27001CollectorConfig {
    githubToken: string;
    owner: string;
    repo: string;
    gitRef?: string;
    maxApiRequests?: number;
    apiTimeout?: number;
}
/**
 * ISO27001 Compliance Evidence Collector
 */
export declare class ISO27001Collector {
    private octokit;
    private config;
    constructor(config: ISO27001CollectorConfig);
    /**
     * Collect all ISO27001 evidence
     */
    collect(): Promise<ComplianceReport>;
    /**
     * Create evidence artifact
     */
    private createEvidence;
    /**
     * A.9.2.3 - Management of Privileged Access Rights
     * Check: Admin/privileged access is limited
     */
    private evaluateA9_2_3;
    /**
     * A.9.4.1 - Information Access Restriction
     * Check: Branch protection restricts access
     */
    private evaluateA9_4_1;
    /**
     * A.12.1.2 - Change Management
     * Check: Changes go through PRs with reviews
     */
    private evaluateA12_1_2;
    /**
     * A.12.6.1 - Management of Technical Vulnerabilities
     * Check: Dependabot or vulnerability scanning enabled
     */
    private evaluateA12_6_1;
    /**
     * A.14.2.2 - System Change Control Procedures
     * Check: Required reviews before merge
     */
    private evaluateA14_2_2;
    /**
     * A.14.2.5 - Secure System Engineering Principles
     * Check: Security-related files/configurations present
     */
    private evaluateA14_2_5;
    /**
     * A.14.2.8 - System Security Testing
     * Check: Test workflows exist
     */
    private evaluateA14_2_8;
    /**
     * A.16.1.2 - Reporting Information Security Events
     * Check: Issue templates for security reporting exist
     */
    private evaluateA16_1_2;
    /**
     * A.16.1.5 - Response to Information Security Incidents
     * Check: Security issues are being addressed
     */
    private evaluateA16_1_5;
    /**
     * Create error result for failed control evaluation
     */
    private createErrorResult;
    /**
     * Calculate summary statistics
     */
    private calculateSummary;
}
//# sourceMappingURL=iso27001.d.ts.map