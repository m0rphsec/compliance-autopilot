/**
 * SOC2 Compliance Evidence Collector
 *
 * Collects evidence for SOC2 Trust Services Criteria (TSC) controls
 * using GitHub API.
 */
import { ComplianceReport } from '../types/evidence';
/**
 * SOC2 Collector Configuration
 */
export interface SOC2CollectorConfig {
    githubToken: string;
    owner: string;
    repo: string;
    gitRef?: string;
    maxApiRequests?: number;
    apiTimeout?: number;
    enableCache?: boolean;
}
/**
 * SOC2 Compliance Evidence Collector
 */
export declare class SOC2Collector {
    private octokit;
    private config;
    private cache;
    constructor(config: SOC2CollectorConfig);
    /**
     * Collect all SOC2 evidence
     */
    collect(): Promise<ComplianceReport>;
    /**
     * Create evidence artifact
     */
    private createEvidence;
    /**
     * CC1.1 - Code Review Process
     * Check: Every PR has ≥1 approval before merge
     */
    private evaluateCC1_1;
    /**
     * CC6.1 - Deployment Controls
     * Check: Deployments happen through CI/CD
     */
    private evaluateCC6_1;
    /**
     * CC6.6 - Access Controls
     * Check: Principle of least privilege
     */
    private evaluateCC6_6;
    /**
     * CC7.1 - System Monitoring
     * Check: Security incidents tracked
     */
    private evaluateCC7_1;
    /**
     * CC3.1 - Risk Assessment
     * Check: SECURITY.md exists and security issues are tracked
     */
    private evaluateCC3_1;
    /**
     * CC5.2 - Dependency Risk Management
     * Check: Dependabot configuration exists
     */
    private evaluateCC5_2;
    /**
     * CC6.3 - Environment Protection
     * Check: At least one environment with protection rules
     */
    private evaluateCC6_3;
    /**
     * CC6.8 - Software Development Lifecycle
     * Check: 2+ workflows with SDLC keywords (test, lint, build)
     */
    private evaluateCC6_8;
    /**
     * CC7.2 - Monitoring & Anomaly Detection
     * Check: 1+ security scanning workflows (security, scan, codeql, snyk)
     */
    private evaluateCC7_2;
    /**
     * CC8.1 - Change Management
     * Check: 80%+ of recent closed PRs were merged (vs direct pushes)
     */
    private evaluateCC8_1;
    /**
     * Create error result for failed control evaluation
     */
    private createErrorResult;
    /**
     * Calculate summary statistics
     */
    private calculateSummary;
    /**
     * Clear cache
     */
    clearCache(): void;
}
//# sourceMappingURL=soc2.d.ts.map