"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISO27001Collector = void 0;
const rest_1 = require("@octokit/rest");
const evidence_1 = require("../types/evidence");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('iso27001-collector');
const ISO27001_CONTROL_DEFS = {
    'A.9.2.3': {
        name: 'Management of Privileged Access Rights',
        description: 'Privileged access rights are restricted and controlled',
        category: 'Access Control',
    },
    'A.9.4.1': {
        name: 'Information Access Restriction',
        description: 'Access to information is restricted based on access control policy',
        category: 'Access Control',
    },
    'A.12.1.2': {
        name: 'Change Management',
        description: 'Changes are controlled through formal change management procedures',
        category: 'Operations Security',
    },
    'A.12.6.1': {
        name: 'Management of Technical Vulnerabilities',
        description: 'Technical vulnerabilities are identified and remediated',
        category: 'Operations Security',
    },
    'A.14.2.2': {
        name: 'System Change Control Procedures',
        description: 'Changes to systems are controlled using formal procedures',
        category: 'System Development',
    },
    'A.14.2.5': {
        name: 'Secure System Engineering Principles',
        description: 'Security is incorporated into system development lifecycle',
        category: 'System Development',
    },
    'A.14.2.8': {
        name: 'System Security Testing',
        description: 'Security testing is performed during development',
        category: 'System Development',
    },
    'A.16.1.2': {
        name: 'Reporting Information Security Events',
        description: 'Security events are reported through appropriate channels',
        category: 'Incident Management',
    },
    'A.16.1.5': {
        name: 'Response to Information Security Incidents',
        description: 'Security incidents are responded to in accordance with procedures',
        category: 'Incident Management',
    },
};
/**
 * ISO27001 Compliance Evidence Collector
 */
class ISO27001Collector {
    octokit;
    config;
    constructor(config) {
        this.config = {
            ...config,
            maxApiRequests: config.maxApiRequests ?? 100,
            apiTimeout: config.apiTimeout ?? 30000,
        };
        this.octokit = new rest_1.Octokit({
            auth: config.githubToken,
            request: {
                timeout: this.config.apiTimeout,
            },
        });
    }
    /**
     * Collect all ISO27001 evidence
     */
    async collect() {
        logger.info('Starting ISO27001 evidence collection', {
            owner: this.config.owner,
            repo: this.config.repo,
        });
        const evaluations = [];
        // A.9 - Access Control
        try {
            const a9_2_3 = await this.evaluateA9_2_3();
            evaluations.push(a9_2_3);
        }
        catch (error) {
            logger.error('Failed to evaluate A.9.2.3', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.9.2.3', error));
        }
        try {
            const a9_4_1 = await this.evaluateA9_4_1();
            evaluations.push(a9_4_1);
        }
        catch (error) {
            logger.error('Failed to evaluate A.9.4.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.9.4.1', error));
        }
        // A.12 - Operations Security
        try {
            const a12_1_2 = await this.evaluateA12_1_2();
            evaluations.push(a12_1_2);
        }
        catch (error) {
            logger.error('Failed to evaluate A.12.1.2', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.12.1.2', error));
        }
        try {
            const a12_6_1 = await this.evaluateA12_6_1();
            evaluations.push(a12_6_1);
        }
        catch (error) {
            logger.error('Failed to evaluate A.12.6.1', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.12.6.1', error));
        }
        // A.14 - System Development
        try {
            const a14_2_2 = await this.evaluateA14_2_2();
            evaluations.push(a14_2_2);
        }
        catch (error) {
            logger.error('Failed to evaluate A.14.2.2', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.14.2.2', error));
        }
        try {
            const a14_2_5 = await this.evaluateA14_2_5();
            evaluations.push(a14_2_5);
        }
        catch (error) {
            logger.error('Failed to evaluate A.14.2.5', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.14.2.5', error));
        }
        try {
            const a14_2_8 = await this.evaluateA14_2_8();
            evaluations.push(a14_2_8);
        }
        catch (error) {
            logger.error('Failed to evaluate A.14.2.8', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.14.2.8', error));
        }
        // A.16 - Incident Management
        try {
            const a16_1_2 = await this.evaluateA16_1_2();
            evaluations.push(a16_1_2);
        }
        catch (error) {
            logger.error('Failed to evaluate A.16.1.2', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.16.1.2', error));
        }
        try {
            const a16_1_5 = await this.evaluateA16_1_5();
            evaluations.push(a16_1_5);
        }
        catch (error) {
            logger.error('Failed to evaluate A.16.1.5', error instanceof Error ? error : undefined);
            evaluations.push(this.createErrorResult('A.16.1.5', error));
        }
        // Calculate summary
        const summary = this.calculateSummary(evaluations);
        const report = {
            id: `iso27001-${Date.now()}`,
            framework: evidence_1.ComplianceFramework.ISO27001,
            repository: `${this.config.owner}/${this.config.repo}`,
            generatedAt: new Date().toISOString(),
            period: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString(),
            },
            summary,
            evaluations,
        };
        logger.info('ISO27001 evidence collection complete', {
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
     * A.9.2.3 - Management of Privileged Access Rights
     * Check: Admin/privileged access is limited
     */
    async evaluateA9_2_3() {
        const control = ISO27001_CONTROL_DEFS['A.9.2.3'];
        const { data: collaborators } = await this.octokit.repos.listCollaborators({
            owner: this.config.owner,
            repo: this.config.repo,
            per_page: 100,
        });
        const adminCount = collaborators.filter((c) => c.permissions?.admin || c.role_name === 'admin').length;
        const totalCount = collaborators.length;
        const evidence = [
            this.createEvidence('api_response', 'github_collaborators', {
                total_collaborators: totalCount,
                admin_count: adminCount,
                admin_percentage: totalCount > 0 ? Math.round((adminCount / totalCount) * 100) : 0,
            }),
        ];
        // Less than 25% admins is good for ISO27001
        const adminRatio = totalCount > 0 ? adminCount / totalCount : 0;
        const pass = adminRatio < 0.25;
        return {
            controlId: 'A.9.2.3',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.PARTIAL,
            evidence,
            notes: `${adminCount}/${totalCount} users (${Math.round(adminRatio * 100)}%) have admin access.`,
            findings: pass ? [] : ['Consider reducing the number of admin accounts'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.9.4.1 - Information Access Restriction
     * Check: Branch protection restricts access
     */
    async evaluateA9_4_1() {
        const control = ISO27001_CONTROL_DEFS['A.9.4.1'];
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
            branchProtection = null;
        }
        const evidence = [];
        if (branchProtection) {
            evidence.push(this.createEvidence('api_response', 'github_branch_protection', {
                enforce_admins: branchProtection.enforce_admins?.enabled ?? false,
                require_code_owner_reviews: branchProtection.required_pull_request_reviews?.require_code_owner_reviews ?? false,
                required_approving_review_count: branchProtection.required_pull_request_reviews?.required_approving_review_count ?? 0,
            }));
        }
        const hasRestrictions = branchProtection !== null;
        return {
            controlId: 'A.9.4.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: hasRestrictions ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: hasRestrictions
                ? 'Branch protection is enabled with access restrictions.'
                : 'No branch protection configured.',
            findings: hasRestrictions ? [] : ['Enable branch protection on main branch'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.12.1.2 - Change Management
     * Check: Changes go through PRs with reviews
     */
    async evaluateA12_1_2() {
        const control = ISO27001_CONTROL_DEFS['A.12.1.2'];
        const { data: pulls } = await this.octokit.pulls.list({
            owner: this.config.owner,
            repo: this.config.repo,
            state: 'closed',
            sort: 'updated',
            direction: 'desc',
            per_page: 50,
        });
        const mergedPRs = pulls.filter((pr) => pr.merged_at);
        let reviewedCount = 0;
        // Check a sample of merged PRs for reviews
        for (const pr of mergedPRs.slice(0, 10)) {
            try {
                const { data: reviews } = await this.octokit.pulls.listReviews({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    pull_number: pr.number,
                });
                if (reviews.some((r) => r.state === 'APPROVED')) {
                    reviewedCount++;
                }
            }
            catch {
                // Skip if we can't get reviews
            }
        }
        const sampleSize = Math.min(10, mergedPRs.length);
        const reviewRate = sampleSize > 0 ? (reviewedCount / sampleSize) * 100 : 0;
        const evidence = [
            this.createEvidence('api_response', 'github_pulls', {
                total_merged_prs: mergedPRs.length,
                sample_size: sampleSize,
                reviewed_count: reviewedCount,
                review_rate: Math.round(reviewRate),
            }),
        ];
        const pass = reviewRate >= 80;
        return {
            controlId: 'A.12.1.2',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass
                ? evidence_1.ControlResult.PASS
                : reviewRate >= 50
                    ? evidence_1.ControlResult.PARTIAL
                    : evidence_1.ControlResult.FAIL,
            evidence,
            notes: `${Math.round(reviewRate)}% of recent PRs had approved reviews.`,
            findings: pass ? [] : ['Ensure all changes go through reviewed PRs'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.12.6.1 - Management of Technical Vulnerabilities
     * Check: Dependabot or vulnerability scanning enabled
     */
    async evaluateA12_6_1() {
        const control = ISO27001_CONTROL_DEFS['A.12.6.1'];
        // Check for Dependabot alerts
        let hasVulnerabilityManagement = false;
        let alertCount = 0;
        try {
            const { data: alerts } = await this.octokit.rest.dependabot.listAlertsForRepo({
                owner: this.config.owner,
                repo: this.config.repo,
                per_page: 10,
            });
            hasVulnerabilityManagement = true;
            alertCount = alerts.length;
        }
        catch (error) {
            // 403 means Dependabot is not enabled or no access
            if (error.status !== 403 && error.status !== 404) {
                throw error;
            }
        }
        // Also check for security-related workflows
        let hasSecurityWorkflow = false;
        try {
            const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
                owner: this.config.owner,
                repo: this.config.repo,
            });
            hasSecurityWorkflow = workflows.workflows.some((w) => w.name.toLowerCase().includes('security') ||
                w.name.toLowerCase().includes('codeql') ||
                w.name.toLowerCase().includes('snyk') ||
                w.name.toLowerCase().includes('dependabot'));
        }
        catch {
            // Ignore if we can't check workflows
        }
        const evidence = [
            this.createEvidence('api_response', 'github_security', {
                dependabot_enabled: hasVulnerabilityManagement,
                alert_count: alertCount,
                has_security_workflow: hasSecurityWorkflow,
            }),
        ];
        const pass = hasVulnerabilityManagement || hasSecurityWorkflow;
        return {
            controlId: 'A.12.6.1',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: pass ? 'Vulnerability management is active.' : 'No vulnerability scanning detected.',
            findings: pass ? [] : ['Enable Dependabot or add security scanning workflow'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.14.2.2 - System Change Control Procedures
     * Check: Required reviews before merge
     */
    async evaluateA14_2_2() {
        const control = ISO27001_CONTROL_DEFS['A.14.2.2'];
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
            branchProtection = null;
        }
        const requiredReviews = branchProtection?.required_pull_request_reviews?.required_approving_review_count ?? 0;
        const evidence = [];
        if (branchProtection) {
            evidence.push(this.createEvidence('api_response', 'github_branch_protection', {
                required_approving_review_count: requiredReviews,
                dismiss_stale_reviews: branchProtection.required_pull_request_reviews?.dismiss_stale_reviews ?? false,
            }));
        }
        const pass = requiredReviews >= 1;
        return {
            controlId: 'A.14.2.2',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: pass
                ? `${requiredReviews} approving review(s) required before merge.`
                : 'No review requirements configured.',
            findings: pass ? [] : ['Configure required reviews in branch protection'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.14.2.5 - Secure System Engineering Principles
     * Check: Security-related files/configurations present
     */
    async evaluateA14_2_5() {
        const control = ISO27001_CONTROL_DEFS['A.14.2.5'];
        const securityFiles = [
            'SECURITY.md',
            '.github/SECURITY.md',
            'security.txt',
            '.well-known/security.txt',
        ];
        let hasSecurityPolicy = false;
        let foundFile = '';
        for (const file of securityFiles) {
            try {
                await this.octokit.repos.getContent({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    path: file,
                });
                hasSecurityPolicy = true;
                foundFile = file;
                break;
            }
            catch {
                // File doesn't exist, continue checking
            }
        }
        const evidence = [
            this.createEvidence('api_response', 'github_files', {
                security_policy_present: hasSecurityPolicy,
                security_file: foundFile || null,
            }),
        ];
        return {
            controlId: 'A.14.2.5',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: hasSecurityPolicy ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.PARTIAL,
            evidence,
            notes: hasSecurityPolicy
                ? `Security policy found at ${foundFile}.`
                : 'No SECURITY.md or security policy file found.',
            findings: hasSecurityPolicy ? [] : ['Add a SECURITY.md file with security policies'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.14.2.8 - System Security Testing
     * Check: Test workflows exist
     */
    async evaluateA14_2_8() {
        const control = ISO27001_CONTROL_DEFS['A.14.2.8'];
        const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
            owner: this.config.owner,
            repo: this.config.repo,
        });
        const testWorkflows = workflows.workflows.filter((w) => w.name.toLowerCase().includes('test') ||
            w.name.toLowerCase().includes('ci') ||
            w.name.toLowerCase().includes('build'));
        const evidence = [
            this.createEvidence('api_response', 'github_workflows', {
                total_workflows: workflows.total_count,
                test_workflows: testWorkflows.map((w) => w.name),
            }),
        ];
        const pass = testWorkflows.length > 0;
        return {
            controlId: 'A.14.2.8',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.FAIL,
            evidence,
            notes: pass
                ? `${testWorkflows.length} test/CI workflow(s) found.`
                : 'No testing workflows found.',
            findings: pass ? [] : ['Add automated testing workflows'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.16.1.2 - Reporting Information Security Events
     * Check: Issue templates for security reporting exist
     */
    async evaluateA16_1_2() {
        const control = ISO27001_CONTROL_DEFS['A.16.1.2'];
        const templatePaths = [
            '.github/ISSUE_TEMPLATE/security.md',
            '.github/ISSUE_TEMPLATE/security.yml',
            '.github/ISSUE_TEMPLATE/bug_report.md',
        ];
        let hasSecurityTemplate = false;
        let foundTemplate = '';
        for (const path of templatePaths) {
            try {
                await this.octokit.repos.getContent({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    path,
                });
                hasSecurityTemplate = true;
                foundTemplate = path;
                break;
            }
            catch {
                // Continue checking
            }
        }
        // Also check if repo has security advisories enabled
        let hasSecurityAdvisories = false;
        try {
            const { data: repo } = await this.octokit.repos.get({
                owner: this.config.owner,
                repo: this.config.repo,
            });
            hasSecurityAdvisories = repo.security_and_analysis?.secret_scanning?.status === 'enabled';
        }
        catch {
            // Ignore
        }
        const evidence = [
            this.createEvidence('api_response', 'github_templates', {
                has_security_template: hasSecurityTemplate,
                template_path: foundTemplate || null,
                security_advisories_enabled: hasSecurityAdvisories,
            }),
        ];
        const pass = hasSecurityTemplate || hasSecurityAdvisories;
        return {
            controlId: 'A.16.1.2',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.PARTIAL,
            evidence,
            notes: pass
                ? 'Security event reporting mechanisms are in place.'
                : 'Consider adding security issue templates.',
            findings: pass ? [] : ['Add security-focused issue templates'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * A.16.1.5 - Response to Information Security Incidents
     * Check: Security issues are being addressed
     */
    async evaluateA16_1_5() {
        const control = ISO27001_CONTROL_DEFS['A.16.1.5'];
        const { data: issues } = await this.octokit.issues.listForRepo({
            owner: this.config.owner,
            repo: this.config.repo,
            labels: 'security,bug',
            state: 'all',
            per_page: 50,
        });
        const openSecurity = issues.filter((i) => i.state === 'open').length;
        const closedSecurity = issues.filter((i) => i.state === 'closed').length;
        const totalSecurity = issues.length;
        const evidence = [
            this.createEvidence('api_response', 'github_issues', {
                total_security_issues: totalSecurity,
                open_security_issues: openSecurity,
                closed_security_issues: closedSecurity,
                closure_rate: totalSecurity > 0 ? Math.round((closedSecurity / totalSecurity) * 100) : 100,
            }),
        ];
        // Pass if closure rate is high or no issues exist
        const closureRate = totalSecurity > 0 ? closedSecurity / totalSecurity : 1;
        const pass = closureRate >= 0.7;
        return {
            controlId: 'A.16.1.5',
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
            result: pass ? evidence_1.ControlResult.PASS : evidence_1.ControlResult.PARTIAL,
            evidence,
            notes: totalSecurity > 0
                ? `${Math.round(closureRate * 100)}% of security issues resolved.`
                : 'No security issues tracked.',
            findings: pass ? [] : ['Address open security issues promptly'],
            evaluatedAt: new Date().toISOString(),
        };
    }
    /**
     * Create error result for failed control evaluation
     */
    createErrorResult(controlId, error) {
        const control = ISO27001_CONTROL_DEFS[controlId] ?? { name: controlId, description: '' };
        return {
            controlId,
            controlName: control.name,
            framework: evidence_1.ComplianceFramework.ISO27001,
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
}
exports.ISO27001Collector = ISO27001Collector;
//# sourceMappingURL=iso27001.js.map