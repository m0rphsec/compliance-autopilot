"use strict";
/**
 * SOC2 Compliance Evidence Collector
 *
 * Collects evidence for SOC2 Trust Services Criteria (TSC) controls
 * using GitHub API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOC2Collector = void 0;
const rest_1 = require("@octokit/rest");
const evidence_1 = require("../types/evidence");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('soc2-collector');
const SOC2_CONTROL_DEFS = {
    'CC1.1': {
        name: 'Code Review Process',
        description: 'PRs require approval before merge',
    },
    'CC6.1': {
        name: 'Deployment Controls',
        description: 'Deployments through CI/CD',
    },
    'CC6.6': {
        name: 'Access Controls',
        description: 'Principle of least privilege',
    },
    'CC7.1': {
        name: 'System Monitoring',
        description: 'Security incidents tracked',
    },
};
/**
 * SOC2 Compliance Evidence Collector
 */
class SOC2Collector {
    octokit;
    config;
    cache = new Map();
    constructor(config) {
        this.config = {
            ...config,
            maxApiRequests: config.maxApiRequests ?? 100,
            apiTimeout: config.apiTimeout ?? 30000,
            enableCache: config.enableCache ?? true,
        };
        this.octokit = new rest_1.Octokit({
            auth: config.githubToken,
            request: {
                timeout: this.config.apiTimeout,
            },
        });
    }
    /**
     * Collect all SOC2 evidence
     */
    async collect() {
        logger.info('Starting SOC2 evidence collection', {
            owner: this.config.owner,
            repo: this.config.repo,
        });
        const evaluations = [];
        // Evaluate CC1.1 - Code Review Process
        try {
            const cc1_1 = await this.evaluateCC1_1();
            evaluations.push(cc1_1);
        }
        catch (error) {
            logger.error('Failed to evaluate CC1.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC1.1', error));
        }
        // Evaluate CC6.1 - Deployment Controls
        try {
            const cc6_1 = await this.evaluateCC6_1();
            evaluations.push(cc6_1);
        }
        catch (error) {
            logger.error('Failed to evaluate CC6.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC6.1', error));
        }
        // Evaluate CC6.6 - Access Controls
        try {
            const cc6_6 = await this.evaluateCC6_6();
            evaluations.push(cc6_6);
        }
        catch (error) {
            logger.error('Failed to evaluate CC6.6', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC6.6', error));
        }
        // Evaluate CC7.1 - System Monitoring
        try {
            const cc7_1 = await this.evaluateCC7_1();
            evaluations.push(cc7_1);
        }
        catch (error) {
            logger.error('Failed to evaluate CC7.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC7.1', error));
        }
        // Calculate summary
        const summary = this.calculateSummary(evaluations);
        const report = {
            id: `soc2-${Date.now()}`,
            framework: evidence_1.ComplianceFramework.SOC2,
            repository: `${this.config.owner}/${this.config.repo}`,
            generatedAt: new Date().toISOString(),
            period: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString(),
            },
            summary,
            evaluations,
        };
        logger.info('SOC2 evidence collection complete', {
            totalControls: summary.totalControls,
            passedControls: summary.passedControls,
            compliancePercentage: summary.compliancePercentage,
        });
        return report;
    }
    /**
     * Create evidence artifact
     */
    createEvidence(type, source, data) {
        return {
            id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            source,
            timestamp: new Date().toISOString(),
            data,
        };
    }
    /**
     * CC1.1 - Code Review Process
     * Check: Every PR has ≥1 approval before merge
     */
    async evaluateCC1_1() {
        const control = SOC2_CONTROL_DEFS['CC1.1'];
        // Get branch protection rules
        let branchProtection;
        try {
            const { data } = await this.octokit.repos.getBranchProtection({
                owner: this.config.owner,
                repo: this.config.repo,
                branch: 'main',
            });
            branchProtection = data;
        }
        catch {
            // Branch protection not enabled
            branchProtection = null;
        }
        // Get recent merged PRs
        const { data: pulls } = await this.octokit.pulls.list({
            owner: this.config.owner,
            repo: this.config.repo,
            state: 'closed',
            sort: 'updated',
            direction: 'desc',
            per_page: 50,
        });
        const mergedPRs = pulls.filter((pr) => pr.merged_at);
        const evidence = [];
        if (branchProtection) {
            evidence.push(this.createEvidence('api_response', 'github_branch_protection', {
                required_approving_review_count: branchProtection.required_pull_request_reviews?.required_approving_review_count ?? 0,
                dismiss_stale_reviews: branchProtection.required_pull_request_reviews?.dismiss_stale_reviews ?? false,
            }));
        }
        evidence.push(this.createEvidence('api_response', 'github_pulls', {
            total_merged_prs: mergedPRs.length,
            sample_prs: mergedPRs.slice(0, 5).map((pr) => ({
                number: pr.number,
                title: pr.title,
                merged_at: pr.merged_at,
            })),
        }));
        const requiresReview = (branchProtection?.required_pull_request_reviews?.required_approving_review_count ?? 0) > 0;
        return {
            controlId: 'CC1.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: requiresReview ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: requiresReview
                ? `Branch protection requires review approvals.`
                : 'Branch protection does not require review approvals.',
            findings: requiresReview ? [] : ['Enable required reviews in branch protection'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC6.1 - Deployment Controls
     * Check: Deployments happen through CI/CD
     */
    async evaluateCC6_1() {
        const control = SOC2_CONTROL_DEFS['CC6.1'];
        // Get workflows
        const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
            owner: this.config.owner,
            repo: this.config.repo,
        });
        // Get recent deployments
        let deployments = [];
        try {
            const { data } = await this.octokit.repos.listDeployments({
                owner: this.config.owner,
                repo: this.config.repo,
                per_page: 20,
            });
            deployments = data.map((d) => ({
                id: d.id,
                environment: d.environment,
                created_at: d.created_at,
            }));
        }
        catch {
            deployments = [];
        }
        const evidence = [
            this.createEvidence('api_response', 'github_workflows', {
                total_workflows: workflows.total_count,
                workflows: workflows.workflows.map((w) => ({
                    name: w.name,
                    path: w.path,
                    state: w.state,
                })),
            }),
            this.createEvidence('api_response', 'github_deployments', {
                total_deployments: deployments.length,
                recent_deployments: deployments.slice(0, 5),
            }),
        ];
        const hasWorkflows = workflows.total_count > 0;
        return {
            controlId: 'CC6.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: hasWorkflows ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: hasWorkflows
                ? `${workflows.total_count} GitHub Actions workflows configured.`
                : 'No GitHub Actions workflows found.',
            findings: hasWorkflows ? [] : ['Set up GitHub Actions for automated deployments'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC6.6 - Access Controls
     * Check: Principle of least privilege
     */
    async evaluateCC6_6() {
        const control = SOC2_CONTROL_DEFS['CC6.6'];
        // Get collaborators
        const { data: collaborators } = await this.octokit.repos.listCollaborators({
            owner: this.config.owner,
            repo: this.config.repo,
            per_page: 100,
        });
        const adminCount = collaborators.filter((c) => c.permissions?.admin || c.role_name === 'admin').length;
        const evidence = [
            this.createEvidence('api_response', 'github_collaborators', {
                total_collaborators: collaborators.length,
                admin_count: adminCount,
                permission_breakdown: {
                    admin: adminCount,
                    write: collaborators.filter((c) => c.permissions?.push && !c.permissions?.admin).length,
                    read: collaborators.filter((c) => !c.permissions?.push && !c.permissions?.admin).length,
                },
            }),
        ];
        // Less than 30% admins is good
        const adminRatio = collaborators.length > 0 ? adminCount / collaborators.length : 0;
        const pass = adminRatio < 0.3;
        return {
            controlId: 'CC6.6',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.PARTIAL,
            evidence,
            notes: `${adminCount}/${collaborators.length} collaborators have admin access (${Math.round(adminRatio * 100)}%).`,
            findings: pass ? [] : ['Review and reduce admin access where possible'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC7.1 - System Monitoring
     * Check: Security incidents tracked
     */
    async evaluateCC7_1() {
        const control = SOC2_CONTROL_DEFS['CC7.1'];
        // Get security issues
        const { data: issues } = await this.octokit.issues.listForRepo({
            owner: this.config.owner,
            repo: this.config.repo,
            labels: 'security,bug,vulnerability',
            state: 'all',
            per_page: 50,
        });
        const evidence = [
            this.createEvidence('api_response', 'github_issues', {
                total_security_issues: issues.length,
                open_issues: issues.filter((i) => i.state === 'open').length,
                closed_issues: issues.filter((i) => i.state === 'closed').length,
            }),
        ];
        return {
            controlId: 'CC7.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: evidence_1.ControlResult.PASS,
            evidence,
            notes: `${issues.length} security-related issues tracked.`,
            findings: [],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * Create error result for failed control evaluation
     */
    createErrorResult(controlId, error) {
        const control = SOC2_CONTROL_DEFS[controlId] ?? { name: controlId, description: '' };
        return {
            controlId,
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: evidence_1.ControlResult.ERROR,
            evidence: [],
            notes: `Error evaluating control: ${error instanceof Error ? error.message : 'Unknown error'}`,
            findings: ['Unable to evaluate control due to error'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * Calculate summary statistics
     */
    calculateSummary(evaluations) {
        const passed = evaluations.filter((e) => e.result === evidence_1.ControlResult.PASS).length;
        const failed = evaluations.filter((e) => e.result === evidence_1.ControlResult.FAIL).length;
        const partial = evaluations.filter((e) => e.result === evidence_1.ControlResult.PARTIAL).length;
        const error = evaluations.filter((e) => e.result === evidence_1.ControlResult.ERROR).length;
        const notApplicable = evaluations.filter((e) => e.result === evidence_1.ControlResult.NOT_APPLICABLE).length;
        const total = evaluations.length;
        return {
            totalControls: total,
            passedControls: passed,
            failedControls: failed,
            partialControls: partial,
            notApplicableControls: notApplicable,
            errorControls: error,
            compliancePercentage: total > 0 ? Math.round((passed / total) * 100) : 0,
            severityBreakdown: {
                [evidence_1.Severity.CRITICAL]: failed,
                [evidence_1.Severity.HIGH]: partial,
                [evidence_1.Severity.MEDIUM]: 0,
                [evidence_1.Severity.LOW]: 0,
                [evidence_1.Severity.INFO]: 0,
            },
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}
exports.SOC2Collector = SOC2Collector;
//# sourceMappingURL=soc2.js.map