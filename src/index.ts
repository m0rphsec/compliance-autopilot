/**
 * Compliance Autopilot - GitHub Action Entry Point
 *
 * Automates SOC2, GDPR, and ISO27001 compliance evidence collection
 *
 * @module index
 */

import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ActionInputs,
  ComplianceReport,
  FrameworkResults,
  ReportResult,
  ActionOutputs,
  GitHubContext,
  ComplianceFramework,
  GDPRCollectorResult,
  ControlResult,
  ControlEvaluation,
} from './types';
import { ComplianceFramework as CFEnum, Severity } from './types/evidence';
import { createLogger } from './utils/logger';
import { parseInputs, getGitHubContext, validatePermissions } from './utils/config';
import {
  getLicenseValidator,
  LicenseEnforcer,
  LicenseValidationResult,
  EnforcementResult,
} from './licensing';

// Import collectors
import { SOC2Collector } from './collectors/soc2';
import { GDPRCollector } from './collectors/gdpr';
import { ISO27001Collector } from './collectors/iso27001';

// Import report generators
import { PDFGenerator, ComplianceData } from './reports/pdf-generator';
import { JSONFormatter } from './reports/json-formatter';

// Import GitHub integrations
import { PRCommenter, ComplianceStatus, ComplianceSummaryItem } from './github/pr-commenter';
import { ArtifactStore } from './github/artifact-store';

const logger = createLogger('main');

/**
 * Main entry point
 */
async function run(): Promise<void> {
  const startTime = Date.now();
  let inputs: ActionInputs;
  let githubContext: GitHubContext;
  let octokit: Octokit;

  try {
    // Phase 1: Validate environment and parse inputs
    logger.startGroup('Validating Inputs');
    logger.info('Compliance Autopilot starting...');
    validatePermissions();
    inputs = parseInputs();
    githubContext = getGitHubContext();

    logger.info('Configuration validated', {
      frameworks: inputs.frameworks.join(', '),
      reportFormat: inputs.reportFormat,
      failOnViolations: inputs.failOnViolations,
      repository: `${githubContext.owner}/${githubContext.repo}`,
      ref: githubContext.ref,
      sha: githubContext.sha.substring(0, 7),
      isPR: !!githubContext.pullRequest,
    });
    logger.endGroup();

    // Phase 1.5: Validate license and enforce tier limits
    logger.startGroup('Validating License');
    const licenseValidator = getLicenseValidator();
    const licenseResult: LicenseValidationResult = await licenseValidator.validate(
      inputs.licenseKey
    );

    logger.info(`License tier: ${LicenseEnforcer.getTierDisplayName(licenseResult.tier)}`);

    if (licenseResult.error) {
      logger.warn(`License warning: ${licenseResult.error}`);
    }

    // Check if this is a private repo (we'll verify after GitHub API init)
    // For now, assume public - we'll re-check after API init
    let isPrivateRepo = false;

    const enforcer = new LicenseEnforcer(licenseResult.limits);
    let enforcement: EnforcementResult = enforcer.enforce({
      isPrivateRepo,
      requestedFrameworks: inputs.frameworks,
      reportFormat: inputs.reportFormat,
      slackWebhook: inputs.slackWebhook,
    });

    // Apply tier adjustments to inputs
    inputs.frameworks = enforcement.adjustedFrameworks;
    inputs.reportFormat = enforcement.adjustedReportFormat as 'pdf' | 'json' | 'both';

    // Show warnings for any restricted features
    enforcement.warnings.forEach((warning) => {
      core.warning(warning);
    });

    logger.endGroup();

    // Phase 2: Initialize GitHub API client
    logger.startGroup('Initializing GitHub API');
    octokit = new Octokit({
      auth: inputs.githubToken,
      userAgent: 'compliance-autopilot/1.0.0',
    });

    // Verify API access by checking the target repo (works with GITHUB_TOKEN)
    // Note: octokit.rest.users.getAuthenticated() doesn't work with the
    // default GITHUB_TOKEN in Actions, so we verify via repo access instead.

    // Check if repo is private and re-enforce license limits
    const { data: repoData } = await octokit.rest.repos.get({
      owner: githubContext.owner,
      repo: githubContext.repo,
    });
    isPrivateRepo = repoData.private;

    if (isPrivateRepo) {
      logger.info('Repository visibility: private');
      // Re-enforce with correct private repo status
      enforcement = enforcer.enforce({
        isPrivateRepo: true,
        requestedFrameworks: inputs.frameworks,
        reportFormat: inputs.reportFormat,
        slackWebhook: inputs.slackWebhook,
      });

      if (!enforcement.allowed) {
        const upgradePrompt = LicenseEnforcer.getUpgradePrompt(enforcement.blockedFeatures);
        logger.info(upgradePrompt);
        core.setFailed(
          'Private repository scanning requires a paid license. ' +
            'Get one at https://compliance-autopilot.com/pricing'
        );
        return;
      }

      // Show any additional warnings
      enforcement.warnings.forEach((warning) => {
        core.warning(warning);
      });
    } else {
      logger.info('Repository visibility: public');
    }

    // Show upgrade prompt if there are blocked features (but still allowed to proceed)
    if (enforcement.blockedFeatures.length > 0 && enforcement.allowed) {
      const upgradePrompt = LicenseEnforcer.getUpgradePrompt(enforcement.blockedFeatures);
      logger.info(upgradePrompt);
    }

    // Check if any frameworks remain after license enforcement
    if (inputs.frameworks.length === 0) {
      logger.warn('No frameworks available after license enforcement. Exiting gracefully.');
      const upgradePrompt = LicenseEnforcer.getUpgradePrompt(enforcement.blockedFeatures);
      logger.info(upgradePrompt);

      const outputs: ActionOutputs = {
        complianceStatus: 'PASS',
        controlsPassed: 0,
        controlsTotal: 0,
        reportUrl: undefined,
      };
      setOutputs(outputs);
      logger.endGroup();
      return;
    }

    logger.endGroup();

    // Phase 3: Run framework collectors in parallel
    logger.startGroup('Collecting Compliance Evidence');
    const frameworkResults = await collectEvidence(
      inputs.frameworks,
      githubContext,
      octokit,
      inputs
    );

    const totalControls = frameworkResults.reduce((sum, fr) => sum + fr.totalControls, 0);
    const passedControls = frameworkResults.reduce((sum, fr) => sum + fr.passedControls, 0);
    const failedControls = frameworkResults.reduce(
      (sum, fr) => sum + fr.failedControls + fr.warnControls + fr.errorControls,
      0
    );

    logger.info('Evidence collection complete', {
      frameworks: frameworkResults.length,
      totalControls,
      passedControls,
      failedControls,
    });
    logger.endGroup();

    // Phase 4: Aggregate results
    logger.startGroup('Aggregating Results');
    const report: ComplianceReport = {
      timestamp: new Date().toISOString(),
      repository: `${githubContext.owner}/${githubContext.repo}`,
      commit: githubContext.sha,
      pullRequest: githubContext.pullRequest?.number,
      frameworks: frameworkResults,
      overallStatus: failedControls === 0 ? 'PASS' : 'FAIL',
      totalControls,
      passedControls,
      failedControls,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info('Compliance report generated', {
      status: report.overallStatus,
      executionTimeSeconds: Math.round(report.executionTimeMs / 1000),
    });
    logger.endGroup();

    // Phase 5: Generate reports
    logger.startGroup('Generating Reports');
    const reportResult = await generateReports(report, inputs, githubContext);
    logger.info('Reports generated', {
      pdf: !!reportResult.pdfPath,
      json: !!reportResult.jsonPath,
    });
    logger.endGroup();

    // Phase 6: Upload to GitHub Releases
    logger.startGroup('Uploading Evidence');
    const reportUrls = await uploadReports(reportResult, githubContext, inputs.githubToken);
    logger.info('Evidence uploaded', {
      pdfUrl: reportUrls.pdfUrl,
      jsonUrl: reportUrls.jsonUrl,
    });
    logger.endGroup();

    // Phase 7: Post PR comment
    if (githubContext.pullRequest) {
      logger.startGroup('Posting PR Comment');
      await postPRComment(report, reportUrls, githubContext, inputs.githubToken);
      logger.info('PR comment posted', {
        pr: githubContext.pullRequest.number,
      });
      logger.endGroup();
    }

    // Phase 8: Send Slack alert if configured
    if (inputs.slackWebhook && report.overallStatus === 'FAIL') {
      logger.startGroup('Sending Slack Alert');
      await sendSlackAlert(report, reportUrls, inputs.slackWebhook, githubContext);
      logger.info('Slack alert sent');
      logger.endGroup();
    }

    // Phase 9: Set action outputs
    logger.startGroup('Setting Outputs');
    const outputs: ActionOutputs = {
      complianceStatus: report.overallStatus,
      controlsPassed: report.passedControls,
      controlsTotal: report.totalControls,
      reportUrl: reportUrls.pdfUrl || reportUrls.jsonUrl,
    };

    setOutputs(outputs);
    logger.info('Outputs set', { outputs: JSON.stringify(outputs) });
    logger.endGroup();

    // Phase 10: Final status
    const executionTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    if (report.overallStatus === 'PASS') {
      logger.info(`Compliance check PASSED in ${executionTimeSeconds}s`, {
        passed: report.passedControls,
        total: report.totalControls,
      });
    } else {
      logger.warn(`Compliance check FAILED in ${executionTimeSeconds}s`, {
        passed: report.passedControls,
        failed: report.failedControls,
        total: report.totalControls,
      });
    }

    // Exit with appropriate code
    if (inputs.failOnViolations && report.overallStatus === 'FAIL') {
      core.setFailed(`Compliance violations detected: ${report.failedControls} controls failed`);
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Compliance check failed', err);

    const userMessage = err.message;
    core.setFailed(userMessage);

    // Log stack trace for debugging
    if (err.stack) {
      logger.debug('Error stack trace', { stack: err.stack });
    }

    throw error;
  }
}

/**
 * Collect evidence from all enabled frameworks
 */
async function collectEvidence(
  frameworks: ComplianceFramework[],
  githubContext: GitHubContext,
  _octokit: Octokit,
  inputs: ActionInputs
): Promise<FrameworkResults[]> {
  const results: FrameworkResults[] = [];

  // Run collectors in parallel for better performance
  const collectionPromises = frameworks.map(async (framework) => {
    const startTime = Date.now();

    try {
      logger.info(`Collecting ${framework.toUpperCase()} evidence...`);

      let collectorReport;

      switch (framework) {
        case 'soc2': {
          const soc2Collector = new SOC2Collector({
            githubToken: inputs.githubToken,
            owner: githubContext.owner,
            repo: githubContext.repo,
            gitRef: githubContext.ref,
          });
          collectorReport = await soc2Collector.collect();
          break;
        }

        case 'gdpr': {
          const gdprCollector = new GDPRCollector({
            apiKey: inputs.anthropicApiKey,
          });
          // Collect source files from the checked-out repo for GDPR scanning
          const sourceFiles = await collectSourceFiles();
          logger.info(`GDPR scanning ${sourceFiles.length} source files`);
          const gdprResult = await gdprCollector.scanRepository(sourceFiles);

          // Build proper GDPR control evaluations from scan results
          const gdprEvaluations = buildGDPREvaluations(gdprResult, sourceFiles);
          const gdprPassed = gdprEvaluations.filter((e) => e.result === ControlResult.PASS).length;
          const gdprFailed = gdprEvaluations.filter((e) => e.result === ControlResult.FAIL).length;
          const gdprNA = gdprEvaluations.filter(
            (e) => e.result === ControlResult.NOT_APPLICABLE
          ).length;

          collectorReport = {
            id: `gdpr-${Date.now()}`,
            framework: 'GDPR',
            repository: `${githubContext.owner}/${githubContext.repo}`,
            generatedAt: new Date().toISOString(),
            period: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
            },
            summary: {
              totalControls: gdprEvaluations.length,
              passedControls: gdprPassed,
              failedControls: gdprFailed,
              partialControls: 0,
              notApplicableControls: gdprNA,
              errorControls: 0,
              compliancePercentage: gdprResult.score,
              severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
            },
            evaluations: gdprEvaluations,
          };
          break;
        }

        case 'iso27001': {
          const iso27001Collector = new ISO27001Collector({
            githubToken: inputs.githubToken,
            owner: githubContext.owner,
            repo: githubContext.repo,
            gitRef: githubContext.ref,
          });
          collectorReport = await iso27001Collector.collect();
          break;
        }

        default:
          throw new Error(`Unknown framework: ${framework}`);
      }

      // Convert collector report to FrameworkResults
      const result: FrameworkResults = {
        framework,
        totalControls: collectorReport.summary.totalControls,
        passedControls: collectorReport.summary.passedControls,
        failedControls: collectorReport.summary.failedControls,
        warnControls: collectorReport.summary.partialControls || 0,
        skippedControls: collectorReport.summary.notApplicableControls || 0,
        errorControls: collectorReport.summary.errorControls || 0,
        controls: collectorReport.evaluations || [],
        executionTimeMs: Date.now() - startTime,
      };

      logger.info(`${framework.toUpperCase()} collection complete`, {
        passed: result.passedControls,
        failed: result.failedControls,
        total: result.totalControls,
      });

      return result;
    } catch (error) {
      logger.error(`Failed to collect ${framework.toUpperCase()} evidence`, error as Error);

      // Return error result instead of failing completely
      return {
        framework,
        totalControls: 0,
        passedControls: 0,
        failedControls: 0,
        warnControls: 0,
        skippedControls: 0,
        errorControls: 1,
        controls: [],
        executionTimeMs: Date.now() - startTime,
      };
    }
  });

  results.push(...(await Promise.all(collectionPromises)));
  return results;
}

/**
 * Build proper GDPR ControlEvaluation entries from scan results.
 * Maps GDPR collector findings to specific GDPR articles.
 */
function buildGDPREvaluations(result: GDPRCollectorResult, sourceFiles: Array<{ code: string; path: string }>): ControlEvaluation[] {
  const now = new Date().toISOString();
  const noPII = result.summary.files_with_pii === 0;

  // Group violations by category for control-level assessment
  const violationsByType: Record<string, GDPRCollectorResult['violations']> = {};
  for (const v of result.violations) {
    const key = v.description.toLowerCase();
    if (key.includes('encryption in transit') || key.includes('https') || key.includes('tls')) {
      (violationsByType['transit'] ??= []).push(v);
    } else if (key.includes('encryption at rest') || key.includes('database encryption')) {
      (violationsByType['rest'] ??= []).push(v);
    } else if (key.includes('consent')) {
      (violationsByType['consent'] ??= []).push(v);
    } else if (key.includes('retention')) {
      (violationsByType['retention'] ??= []).push(v);
    } else if (key.includes('deletion')) {
      (violationsByType['deletion'] ??= []).push(v);
    } else {
      (violationsByType['other'] ??= []).push(v);
    }
  }

  const makeEval = (
    id: string,
    name: string,
    pass: boolean,
    na: boolean,
    notes: string,
    findings: string[]
  ): ControlEvaluation => ({
    controlId: id,
    controlName: name,
    framework: CFEnum.GDPR,
    result: na ? ControlResult.NOT_APPLICABLE : pass ? ControlResult.PASS : ControlResult.FAIL,
    evidence: [],
    evaluatedAt: now,
    notes,
    severity: pass || na ? undefined : Severity.HIGH,
    findings: pass || na ? [] : findings,
  });

  const transitViolations = violationsByType['transit'] || [];
  const restViolations = violationsByType['rest'] || [];
  const consentViolations = violationsByType['consent'] || [];
  const retentionViolations = violationsByType['retention'] || [];
  const deletionViolations = violationsByType['deletion'] || [];
  const otherViolations = violationsByType['other'] || [];

  const evaluations: ControlEvaluation[] = [
    makeEval(
      'GDPR-5.1f',
      'Data Security - Encryption in Transit (Art. 5(1)(f))',
      transitViolations.length === 0,
      noPII,
      noPII
        ? 'No PII detected in source files.'
        : transitViolations.length === 0
          ? 'HTTPS/TLS usage detected in files handling PII.'
          : `${transitViolations.length} file(s) lack encryption in transit.`,
      transitViolations.map((v) => `${v.file}: ${v.recommendation}`)
    ),
    makeEval(
      'GDPR-32',
      'Security of Processing - Encryption at Rest (Art. 32)',
      restViolations.length === 0,
      noPII,
      noPII
        ? 'No PII detected in source files.'
        : restViolations.length === 0
          ? 'Database encryption patterns detected.'
          : `${restViolations.length} file(s) lack encryption at rest.`,
      restViolations.map((v) => `${v.file}: ${v.recommendation}`)
    ),
    makeEval(
      'GDPR-7',
      'Conditions for Consent (Art. 7)',
      consentViolations.length === 0,
      noPII,
      noPII
        ? 'No PII detected in source files.'
        : consentViolations.length === 0
          ? 'Consent mechanisms detected in codebase.'
          : `${consentViolations.length} file(s) lack consent mechanisms.`,
      consentViolations.map((v) => `${v.file}: ${v.recommendation}`)
    ),
    makeEval(
      'GDPR-5.1e',
      'Storage Limitation - Data Retention (Art. 5(1)(e))',
      retentionViolations.length === 0,
      noPII,
      noPII
        ? 'No PII detected in source files.'
        : retentionViolations.length === 0
          ? 'Data retention policies detected.'
          : `${retentionViolations.length} file(s) lack retention policies.`,
      retentionViolations.map((v) => `${v.file}: ${v.recommendation}`)
    ),
    makeEval(
      'GDPR-17',
      'Right to Erasure (Art. 17)',
      deletionViolations.length === 0,
      noPII,
      noPII
        ? 'No PII detected in source files.'
        : deletionViolations.length === 0
          ? 'Data deletion capabilities detected.'
          : `${deletionViolations.length} file(s) lack deletion capabilities.`,
      deletionViolations.map((v) => `${v.file}: ${v.recommendation}`)
    ),
    makeEval(
      'GDPR-6',
      'PII Processing Controls (Art. 6)',
      otherViolations.length === 0 && result.summary.files_with_pii <= 0,
      false,
      result.summary.files_with_pii > 0
        ? `${result.summary.files_with_pii} of ${result.summary.total_files_scanned} files contain PII.`
        : `${result.summary.total_files_scanned} files scanned, no PII detected.`,
      otherViolations.map((v) => `${v.file}: ${v.description}`)
    ),
  ];

  // GDPR Art. 25 - Data Protection by Design
  const privacySignals: string[] = [];

  // 1. Check for privacy policy files among scanned source files
  const privacyPolicyPattern = /privacy[-_.]?(policy|notice)?\.(md|txt|html?)/i;
  for (const file of sourceFiles) {
    const basename = file.path.split('/').pop() || '';
    if (privacyPolicyPattern.test(basename)) {
      privacySignals.push(`Privacy policy file found: ${file.path}`);
      break;
    }
  }

  // Also check if any file contains substantial privacy policy text
  if (privacySignals.length === 0) {
    for (const file of sourceFiles) {
      if (
        /privacy\s+policy/i.test(file.code) &&
        /personal\s+(data|information)/i.test(file.code) &&
        file.code.length > 500
      ) {
        privacySignals.push(`Privacy policy content detected in: ${file.path}`);
        break;
      }
    }
  }

  // 2. Check for data minimization patterns in code
  const minimizationPatterns = [
    /\.select\s*\(/,                         // ORM .select() explicit field selection
    /SELECT\s+(?!\*)\w+\s*,/i,              // SQL SELECT with explicit columns (not SELECT *)
    /\.pick\s*\(/,                           // Zod/lodash .pick()
    /\.omit\s*\(/,                           // Zod/lodash .omit()
  ];
  let foundMinimization = false;
  for (const file of sourceFiles) {
    for (const pattern of minimizationPatterns) {
      if (pattern.test(file.code)) {
        privacySignals.push(`Data minimization pattern found in: ${file.path}`);
        foundMinimization = true;
        break;
      }
    }
    if (foundMinimization) break;
  }

  // 3. Check for privacy-aware code patterns (annotations, comments, function names)
  const privacyCodePatterns = [
    /@privacy/i,
    /gdpr[-_]?compliant/i,
    /anonymize/i,
    /pseudonymize/i,
    /data[-_]?minimization/i,
    /privacy[-_]?by[-_]?design/i,
    /data[-_]?protection/i,
  ];
  let foundPrivacyCode = false;
  for (const file of sourceFiles) {
    for (const pattern of privacyCodePatterns) {
      if (pattern.test(file.code)) {
        privacySignals.push(`Privacy-aware code pattern found in: ${file.path}`);
        foundPrivacyCode = true;
        break;
      }
    }
    if (foundPrivacyCode) break;
  }

  const dpbdScore = privacySignals.length;
  const dpbdPass = dpbdScore >= 2;
  const dpbdPartial = dpbdScore >= 1;

  evaluations.push({
    controlId: 'GDPR-Art25',
    controlName: 'Data Protection by Design (Art. 25)',
    framework: CFEnum.GDPR,
    result: dpbdPass ? ControlResult.PASS : dpbdPartial ? ControlResult.PARTIAL : ControlResult.FAIL,
    evidence: [],
    evaluatedAt: now,
    notes: dpbdPass
      ? `Privacy-by-design artifacts found: ${privacySignals.join('; ')}`
      : dpbdPartial
        ? `Limited privacy-by-design signals: ${privacySignals.join('; ')}`
        : 'No privacy-by-design signals detected in scanned files.',
    severity: dpbdPass ? undefined : Severity.HIGH,
    findings: dpbdScore < 2
      ? [
          'Add PRIVACY.md or privacy policy documentation',
          'Use data minimization patterns (explicit field selection)',
          'Add privacy-aware code annotations',
        ]
      : [],
  });

  return evaluations;
}

/**
 * Collect source files from the checked-out repository for GDPR scanning
 */
async function collectSourceFiles(): Promise<Array<{ code: string; path: string }>> {
  const files: Array<{ code: string; path: string }> = [];
  const cwd = process.cwd();
  const skipDirs = new Set([
    'node_modules',
    'dist',
    '.git',
    'coverage',
    '.github',
    'assets',
    '__pycache__',
    '.next',
    '.nuxt',
  ]);
  const sourceExts = new Set([
    '.ts',
    '.js',
    '.tsx',
    '.jsx',
    '.py',
    '.java',
    '.go',
    '.rb',
    '.php',
    '.cs',
    '.rs',
    '.swift',
  ]);
  const maxFileSize = 50_000; // 50KB per file
  const maxFiles = 50;

  async function walk(dir: string) {
    if (files.length >= maxFiles) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (sourceExts.has(ext)) {
          try {
            const stat = await fs.stat(fullPath);
            if (stat.size <= maxFileSize) {
              const code = await fs.readFile(fullPath, 'utf-8');
              const relPath = path.relative(cwd, fullPath);
              files.push({ code, path: relPath });
            }
          } catch {
            // Skip files we can't read
          }
        }
      }
    }
  }

  await walk(cwd);
  return files;
}

/**
 * Generate PDF and/or JSON reports
 */
async function generateReports(
  report: ComplianceReport,
  inputs: ActionInputs,
  githubContext: GitHubContext
): Promise<ReportResult> {
  const result: ReportResult = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // Prepare report data for generators
    const framework = report.frameworks[0]?.framework?.toUpperCase() || 'SOC2';
    const allFrameworks = report.frameworks.map((fw) => fw.framework.toUpperCase());

    const complianceData: ComplianceData = {
      framework: framework as 'SOC2' | 'GDPR' | 'ISO27001',
      frameworks: allFrameworks,
      timestamp: new Date(report.timestamp),
      repositoryName: githubContext.repo,
      repositoryOwner: githubContext.owner,
      overallScore:
        report.totalControls > 0 ? (report.passedControls / report.totalControls) * 100 : 0,
      controls: report.frameworks.flatMap((fw) =>
        (fw.controls || []).map((ctrl: any) => ({
          id: ctrl.controlId || ctrl.id || 'Unknown',
          name: ctrl.controlName || ctrl.name || 'Unknown Control',
          status: mapControlStatus(ctrl.result || ctrl.status),
          evidence: ctrl.notes || ctrl.evidence || 'Evidence collected',
          severity: (ctrl.severity || 'medium') as 'critical' | 'high' | 'medium' | 'low',
          framework: fw.framework.toUpperCase(),
          violations: [],
          recommendations: ctrl.findings || [],
        }))
      ),
      summary: {
        total: report.totalControls,
        passed: report.passedControls,
        failed: report.failedControls,
        partial: report.frameworks.reduce((sum, fw) => sum + fw.warnControls, 0),
        notApplicable: report.frameworks.reduce((sum, fw) => sum + fw.skippedControls, 0),
      },
      frameworkSummaries: report.frameworks.map((fw) => ({
        framework: fw.framework.toUpperCase(),
        total: fw.totalControls,
        passed: fw.passedControls,
        failed: fw.failedControls + fw.warnControls + fw.errorControls,
      })),
    };

    // Ensure we have at least one control for the generators
    if (complianceData.controls.length === 0) {
      complianceData.controls.push({
        id: 'AUTO-1',
        name: 'Automated Compliance Check',
        status: report.overallStatus === 'PASS' ? 'PASS' : 'FAIL',
        evidence: `Compliance scan completed with ${report.passedControls}/${report.totalControls} controls passing.`,
        severity: 'medium',
        violations: [],
      });
      complianceData.summary.total = 1;
      complianceData.summary.passed = report.overallStatus === 'PASS' ? 1 : 0;
      complianceData.summary.failed = report.overallStatus === 'PASS' ? 0 : 1;
    }

    // Generate PDF report
    if (inputs.reportFormat === 'pdf' || inputs.reportFormat === 'both') {
      const pdfGenerator = new PDFGenerator();
      const pdfBytes = await pdfGenerator.generate(complianceData);

      const pdfPath = path.join(process.cwd(), `compliance-report-${timestamp}.pdf`);
      await fs.writeFile(pdfPath, pdfBytes);
      result.pdfPath = pdfPath;

      logger.info('PDF report generated', { path: pdfPath });
    }

    // Generate JSON report
    if (inputs.reportFormat === 'json' || inputs.reportFormat === 'both') {
      const jsonFormatter = new JSONFormatter();
      const jsonContent = jsonFormatter.formatPretty(complianceData);

      const jsonPath = path.join(process.cwd(), `compliance-evidence-${timestamp}.json`);
      await fs.writeFile(jsonPath, jsonContent);
      result.jsonPath = jsonPath;

      logger.info('JSON report generated', { path: jsonPath });
    }

    return result;
  } catch (error) {
    logger.error('Failed to generate reports', error as Error);
    throw error;
  }
}

/**
 * Map control result to PDF status
 */
function mapControlStatus(result: string): 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_APPLICABLE' {
  const normalized = (result || '').toLowerCase();
  if (normalized === 'pass' || normalized === 'passed') return 'PASS';
  if (normalized === 'fail' || normalized === 'failed') return 'FAIL';
  if (normalized === 'partial') return 'PARTIAL';
  return 'NOT_APPLICABLE';
}

/**
 * Upload reports to GitHub Releases
 */
async function uploadReports(
  reportResult: ReportResult,
  githubContext: GitHubContext,
  githubToken: string
): Promise<{ pdfUrl?: string; jsonUrl?: string }> {
  try {
    const artifactStore = new ArtifactStore(githubToken, githubContext.owner, githubContext.repo);

    const urls: { pdfUrl?: string; jsonUrl?: string } = {};

    if (reportResult.pdfPath) {
      const pdfResult = await artifactStore.uploadEvidence(reportResult.pdfPath, {
        commitSha: githubContext.sha,
        prNumber: githubContext.pullRequest?.number,
        framework: 'compliance',
      });
      urls.pdfUrl = pdfResult.downloadUrl;
    }

    if (reportResult.jsonPath) {
      const jsonResult = await artifactStore.uploadEvidence(reportResult.jsonPath, {
        commitSha: githubContext.sha,
        prNumber: githubContext.pullRequest?.number,
        framework: 'compliance',
      });
      urls.jsonUrl = jsonResult.downloadUrl;
    }

    return urls;
  } catch (error) {
    logger.error('Failed to upload reports', error as Error);
    // Don't fail the action if upload fails - reports are still generated locally
    return {};
  }
}

/**
 * Post compliance status as PR comment
 */
async function postPRComment(
  report: ComplianceReport,
  reportUrls: { pdfUrl?: string; jsonUrl?: string },
  githubContext: GitHubContext,
  githubToken: string
): Promise<void> {
  if (!githubContext.pullRequest) {
    return;
  }

  try {
    const prCommenter = new PRCommenter(githubToken, githubContext.owner, githubContext.repo);

    // Build summary items from framework results
    const summaryItems: ComplianceSummaryItem[] = [];

    for (const fw of report.frameworks) {
      for (const ctrl of fw.controls || []) {
        summaryItems.push({
          control: ctrl.controlId || ctrl.id || 'Unknown',
          status: mapControlStatusForComment(ctrl.result || ctrl.status),
          description: ctrl.controlName || ctrl.name || 'Control',
          details: ctrl.notes,
        });
      }
    }

    // If no controls, add a summary item
    if (summaryItems.length === 0) {
      summaryItems.push({
        control: 'Overall',
        status: report.overallStatus === 'PASS' ? 'PASS' : 'FAIL',
        description: 'Compliance scan completed',
        details: `${report.passedControls}/${report.totalControls} controls passed`,
      });
    }

    const status: ComplianceStatus = {
      status: report.overallStatus === 'PASS' ? 'PASS' : 'FAIL',
      frameworks: report.frameworks.map((f) => f.framework.toUpperCase()),
      controlsPassed: report.passedControls,
      controlsTotal: report.totalControls,
      summary: summaryItems,
      reportUrl: reportUrls.pdfUrl || reportUrls.jsonUrl,
      scanDuration: report.executionTimeMs,
      timestamp: new Date(report.timestamp),
    };

    await prCommenter.postComment({
      prNumber: githubContext.pullRequest.number,
      owner: githubContext.owner,
      repo: githubContext.repo,
      status,
      includeDetails: true,
      collapseDetails: true,
    });
  } catch (error) {
    logger.error('Failed to post PR comment', error as Error);
    // Don't throw - PR comment is not critical
  }
}

/**
 * Map control result to comment status
 */
function mapControlStatusForComment(result: string): 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED' {
  const normalized = (result || '').toLowerCase();
  if (normalized === 'pass' || normalized === 'passed') return 'PASS';
  if (normalized === 'fail' || normalized === 'failed') return 'FAIL';
  if (normalized === 'partial') return 'WARNING';
  if (normalized === 'not_applicable' || normalized === 'skipped') return 'SKIPPED';
  return 'WARNING';
}

/**
 * Send Slack alert on violations
 */
async function sendSlackAlert(
  report: ComplianceReport,
  reportUrls: { pdfUrl?: string; jsonUrl?: string },
  webhookUrl: string,
  githubContext: GitHubContext
): Promise<void> {
  try {
    const message = {
      text: `Compliance Violations Detected`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Compliance Violations Detected',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Repository:*\n${githubContext.owner}/${githubContext.repo}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${report.overallStatus}`,
            },
            {
              type: 'mrkdwn',
              text: `*Failed Controls:*\n${report.failedControls}/${report.totalControls}`,
            },
            {
              type: 'mrkdwn',
              text: `*Frameworks:*\n${report.frameworks.map((f) => f.framework.toUpperCase()).join(', ')}`,
            },
          ],
        },
      ],
    };

    if (reportUrls.pdfUrl) {
      (message.blocks as any[]).push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${reportUrls.pdfUrl}|View Report>`,
        },
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.error('Failed to send Slack alert', error as Error);
    // Don't throw - Slack alert is not critical
  }
}

/**
 * Set GitHub Action outputs
 */
function setOutputs(outputs: ActionOutputs): void {
  core.setOutput('compliance-status', outputs.complianceStatus);
  core.setOutput('controls-passed', outputs.controlsPassed.toString());
  core.setOutput('controls-total', outputs.controlsTotal.toString());

  if (outputs.reportUrl) {
    core.setOutput('report-url', outputs.reportUrl);
  }
}

// Execute main function only when run directly (not when imported by tests)
if (!process.env.JEST_WORKER_ID) {
  run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { run };
