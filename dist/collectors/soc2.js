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
    'CC3.1': {
        name: 'Risk Assessment',
        description: 'Security risks identified and assessed',
    },
    'CC5.2': {
        name: 'Dependency Risk Management',
        description: 'Dependencies monitored for vulnerabilities',
    },
    'CC6.3': {
        name: 'Environment Protection',
        description: 'Environments have protection rules',
    },
    'CC6.8': {
        name: 'Software Development Lifecycle',
        description: 'SDLC workflows enforced via CI/CD',
    },
    'CC7.2': {
        name: 'Monitoring & Anomaly Detection',
        description: 'Security scanning workflows configured',
    },
    'CC8.1': {
        name: 'Change Management',
        description: 'Changes managed through pull requests',
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
        // Evaluate CC3.1 - Risk Assessment
        try {
            const cc3_1 = await this.evaluateCC3_1();
            evaluations.push(cc3_1);
        }
        catch (error) {
            logger.error('Failed to evaluate CC3.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC3.1', error));
        }
        // Evaluate CC5.2 - Dependency Risk Management
        try {
            const cc5_2 = await this.evaluateCC5_2();
            evaluations.push(cc5_2);
        }
        catch (error) {
            logger.error('Failed to evaluate CC5.2', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC5.2', error));
        }
        // Evaluate CC6.3 - Environment Protection
        try {
            const cc6_3 = await this.evaluateCC6_3();
            evaluations.push(cc6_3);
        }
        catch (error) {
            logger.error('Failed to evaluate CC6.3', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC6.3', error));
        }
        // Evaluate CC6.8 - Software Development Lifecycle
        try {
            const cc6_8 = await this.evaluateCC6_8();
            evaluations.push(cc6_8);
        }
        catch (error) {
            logger.error('Failed to evaluate CC6.8', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC6.8', error));
        }
        // Evaluate CC7.2 - Monitoring & Anomaly Detection
        try {
            const cc7_2 = await this.evaluateCC7_2();
            evaluations.push(cc7_2);
        }
        catch (error) {
            logger.error('Failed to evaluate CC7.2', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC7.2', error));
        }
        // Evaluate CC8.1 - Change Management
        try {
            const cc8_1 = await this.evaluateCC8_1();
            evaluations.push(cc8_1);
        }
        catch (error) {
            logger.error('Failed to evaluate CC8.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('CC8.1', error));
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
     * CC3.1 - Risk Assessment
     * Check: SECURITY.md exists and security issues are tracked
     */
    async evaluateCC3_1() {
        const control = SOC2_CONTROL_DEFS['CC3.1'];
        const evidence = [];
        let securityMdExists = false;
        try {
            await this.octokit.repos.getContent({
                owner: this.config.owner,
                repo: this.config.repo,
                path: 'SECURITY.md',
            });
            securityMdExists = true;
        }
        catch (err) {
            const status = err.status;
            if (status !== 404) {
                throw err;
            }
        }
        const { data: securityIssues } = await this.octokit.issues.listForRepo({
            owner: this.config.owner,
            repo: this.config.repo,
            labels: 'security',
            state: 'all',
            per_page: 50,
        });
        evidence.push(this.createEvidence('api_response', 'github_security_md', {
            exists: securityMdExists,
        }));
        evidence.push(this.createEvidence('api_response', 'github_security_issues', {
            total_security_issues: securityIssues.length,
        }));
        return {
            controlId: 'CC3.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: securityMdExists ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: securityMdExists
                ? `SECURITY.md exists. ${securityIssues.length} security-labeled issues tracked.`
                : 'No SECURITY.md found in repository.',
            findings: securityMdExists ? [] : ['Add a SECURITY.md file to document security policies'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC5.2 - Dependency Risk Management
     * Check: Dependabot configuration exists
     */
    async evaluateCC5_2() {
        const control = SOC2_CONTROL_DEFS['CC5.2'];
        const evidence = [];
        let dependabotConfigExists = false;
        try {
            await this.octokit.repos.getContent({
                owner: this.config.owner,
                repo: this.config.repo,
                path: '.github/dependabot.yml',
            });
            dependabotConfigExists = true;
        }
        catch (err) {
            const status = err.status;
            if (status !== 404) {
                throw err;
            }
        }
        evidence.push(this.createEvidence('api_response', 'github_dependabot_config', {
            exists: dependabotConfigExists,
        }));
        return {
            controlId: 'CC5.2',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: dependabotConfigExists ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: dependabotConfigExists
                ? 'Dependabot configuration found.'
                : 'No Dependabot configuration found.',
            findings: dependabotConfigExists
                ? []
                : ['Add .github/dependabot.yml to manage dependency updates'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC6.3 - Environment Protection
     * Check: At least one environment with protection rules
     */
    async evaluateCC6_3() {
        const control = SOC2_CONTROL_DEFS['CC6.3'];
        const evidence = [];
        let environments = [];
        try {
            const { data } = await this.octokit.repos.getAllEnvironments({
                owner: this.config.owner,
                repo: this.config.repo,
            });
            environments = (data.environments ?? []);
        }
        catch (err) {
            const status = err.status;
            if (status !== 404) {
                throw err;
            }
        }
        const protectedEnvs = environments.filter((env) => env.protection_rules && env.protection_rules.length > 0);
        evidence.push(this.createEvidence('api_response', 'github_environments', {
            total_environments: environments.length,
            protected_environments: protectedEnvs.length,
            environments: environments.map((e) => ({
                name: e.name,
                protection_rules_count: e.protection_rules?.length ?? 0,
            })),
        }));
        const pass = protectedEnvs.length >= 1;
        return {
            controlId: 'CC6.3',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: pass
                ? `${protectedEnvs.length} environment(s) with protection rules.`
                : 'No environments with protection rules found.',
            findings: pass ? [] : ['Configure environment protection rules for deployment targets'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC6.8 - Software Development Lifecycle
     * Check: 2+ workflows with SDLC keywords (test, lint, build)
     */
    async evaluateCC6_8() {
        const control = SOC2_CONTROL_DEFS['CC6.8'];
        const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
            owner: this.config.owner,
            repo: this.config.repo,
        });
        const sdlcKeywords = /test|lint|build|ci|check/i;
        const sdlcWorkflows = workflows.workflows.filter((w) => sdlcKeywords.test(w.name) || sdlcKeywords.test(w.path));
        const evidence = [
            this.createEvidence('api_response', 'github_sdlc_workflows', {
                total_workflows: workflows.total_count,
                sdlc_workflows: sdlcWorkflows.length,
                matching_workflows: sdlcWorkflows.map((w) => ({
                    name: w.name,
                    path: w.path,
                    state: w.state,
                })),
            }),
        ];
        const pass = sdlcWorkflows.length >= 2;
        return {
            controlId: 'CC6.8',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: pass
                ? `${sdlcWorkflows.length} SDLC workflows found (test/lint/build).`
                : `Only ${sdlcWorkflows.length} SDLC workflow(s) found. At least 2 required.`,
            findings: pass ? [] : ['Add CI/CD workflows for testing, linting, and building'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC7.2 - Monitoring & Anomaly Detection
     * Check: 1+ security scanning workflows (security, scan, codeql, snyk)
     */
    async evaluateCC7_2() {
        const control = SOC2_CONTROL_DEFS['CC7.2'];
        const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
            owner: this.config.owner,
            repo: this.config.repo,
        });
        const securityKeywords = /security|scan|codeql|snyk|trivy|dependabot/i;
        const securityWorkflows = workflows.workflows.filter((w) => securityKeywords.test(w.name) || securityKeywords.test(w.path));
        const evidence = [
            this.createEvidence('api_response', 'github_security_workflows', {
                total_workflows: workflows.total_count,
                security_workflows: securityWorkflows.length,
                matching_workflows: securityWorkflows.map((w) => ({
                    name: w.name,
                    path: w.path,
                    state: w.state,
                })),
            }),
        ];
        const pass = securityWorkflows.length >= 1;
        return {
            controlId: 'CC7.2',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: pass
                ? `${securityWorkflows.length} security scanning workflow(s) found.`
                : 'No security scanning workflows found.',
            findings: pass ? [] : ['Add security scanning workflows (e.g., CodeQL, Snyk, Trivy)'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * CC8.1 - Change Management
     * Check: 80%+ of recent closed PRs were merged (vs direct pushes)
     */
    async evaluateCC8_1() {
        const control = SOC2_CONTROL_DEFS['CC8.1'];
        const { data: pulls } = await this.octokit.pulls.list({
            owner: this.config.owner,
            repo: this.config.repo,
            state: 'closed',
            base: this.config.gitRef ?? 'main',
            sort: 'updated',
            direction: 'desc',
            per_page: 50,
        });
        const totalClosed = pulls.length;
        const mergedCount = pulls.filter((pr) => pr.merged_at).length;
        const mergeRate = totalClosed > 0 ? mergedCount / totalClosed : 0;
        const evidence = [
            this.createEvidence('api_response', 'github_change_management', {
                total_closed_prs: totalClosed,
                merged_prs: mergedCount,
                merge_rate: Math.round(mergeRate * 100),
            }),
        ];
        let result;
        if (totalClosed === 0) {
            result = evidence_1.ControlResult.FAIL;
        }
        else if (mergeRate >= 0.8) {
            result = evidence_1.ControlResult.PASS;
        }
        else if (mergeRate >= 0.5) {
            result = evidence_1.ControlResult.PARTIAL;
        }
        else {
            result = evidence_1.ControlResult.FAIL;
        }
        return {
            controlId: 'CC8.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.SOC2,
            result,
            evidence,
            notes: totalClosed > 0
                ? `${Math.round(mergeRate * 100)}% of closed PRs were merged (${mergedCount}/${totalClosed}).`
                : 'No closed pull requests found.',
            findings: result === evidence_1.ControlResult.PASS
                ? []
                : ['Ensure changes are managed through pull requests rather than direct pushes'],
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