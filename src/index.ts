/**
 * Compliance Autopilot - GitHub Action Entry Point
 *
 * Automates SOC2, GDPR, and ISO27001 compliance evidence collection
 *
 * @module index
 */

import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import {
  ActionInputs,
  ComplianceReport,
  FrameworkResults,
  ReportResult,
  ActionOutputs,
  GitHubContext,
  ComplianceFramework,
} from './types';
import { createLogger } from './utils/logger';
import { parseInputs, getGitHubContext, validatePermissions } from './utils/config';

// Import collectors (will be implemented by other agents)
// import { SOC2Collector } from './collectors/soc2';
// import { GDPRCollector } from './collectors/gdpr';
// import { ISO27001Collector } from './collectors/iso27001';

// Import analyzers (will be implemented by other agents)
// import { CodeAnalyzer } from './analyzers/code-analyzer';

// Import report generators (will be implemented by other agents)
// import { PDFGenerator } from './reports/pdf-generator';
// import { JSONFormatter } from './reports/json-formatter';

// Import GitHub integrations (will be implemented by other agents)
// import { GitHubAPIClient } from './github/api-client';
// import { PRCommenter } from './github/pr-commenter';
// import { ArtifactStore } from './github/artifact-store';

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
    logger.startGroup('🔍 Validating Inputs');
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

    // Phase 2: Initialize GitHub API client
    logger.startGroup('🔌 Initializing GitHub API');
    octokit = new Octokit({
      auth: inputs.githubToken,
      userAgent: 'compliance-autopilot/1.0.0',
    });

    // Verify API access
    const { data: user } = await octokit.rest.users.getAuthenticated();
    logger.info('GitHub API authenticated', { username: user.login });
    logger.endGroup();

    // Phase 3: Run framework collectors in parallel
    logger.startGroup('📊 Collecting Compliance Evidence');
    const frameworkResults = await collectEvidence(
      inputs.frameworks,
      githubContext,
      octokit,
      inputs
    );

    const totalControls = frameworkResults.reduce((sum, fr) => sum + fr.totalControls, 0);
    const passedControls = frameworkResults.reduce((sum, fr) => sum + fr.passedControls, 0);
    const failedControls = frameworkResults.reduce((sum, fr) => sum + fr.failedControls, 0);

    logger.info('Evidence collection complete', {
      frameworks: frameworkResults.length,
      totalControls,
      passedControls,
      failedControls,
    });
    logger.endGroup();

    // Phase 4: Aggregate results
    logger.startGroup('📋 Aggregating Results');
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
    logger.startGroup('📄 Generating Reports');
    const reportResult = await generateReports(report, inputs, githubContext);
    logger.info('Reports generated', {
      pdf: !!reportResult.pdfPath,
      json: !!reportResult.jsonPath,
    });
    logger.endGroup();

    // Phase 6: Upload to GitHub Releases
    logger.startGroup('☁️ Uploading Evidence');
    const reportUrls = await uploadReports(reportResult, githubContext, octokit);
    logger.info('Evidence uploaded', {
      pdfUrl: reportUrls.pdfUrl,
      jsonUrl: reportUrls.jsonUrl,
    });
    logger.endGroup();

    // Phase 7: Post PR comment
    if (githubContext.pullRequest) {
      logger.startGroup('💬 Posting PR Comment');
      await postPRComment(report, reportUrls, githubContext, octokit);
      logger.info('PR comment posted', {
        pr: githubContext.pullRequest.number,
      });
      logger.endGroup();
    }

    // Phase 8: Send Slack alert if configured
    if (inputs.slackWebhook && report.overallStatus === 'FAIL') {
      logger.startGroup('📢 Sending Slack Alert');
      await sendSlackAlert(report, reportUrls, inputs.slackWebhook, githubContext);
      logger.info('Slack alert sent');
      logger.endGroup();
    }

    // Phase 9: Set action outputs
    logger.startGroup('✅ Setting Outputs');
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
      logger.info(`✅ Compliance check PASSED in ${executionTimeSeconds}s`, {
        passed: report.passedControls,
        total: report.totalControls,
      });
    } else {
      logger.warn(`❌ Compliance check FAILED in ${executionTimeSeconds}s`, {
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
    logger.error('❌ Compliance check failed', err);

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
  _githubContext: GitHubContext,
  _octokit: Octokit,
  _inputs: ActionInputs
): Promise<FrameworkResults[]> {
  const results: FrameworkResults[] = [];

  // Run collectors in parallel for better performance
  const collectionPromises = frameworks.map(async (framework) => {
    const startTime = Date.now();

    try {
      logger.info(`Collecting ${framework.toUpperCase()} evidence...`);

      // TODO: Replace with actual collector implementations
      // const collector = createCollector(framework, githubContext, octokit, inputs);
      // return await collector.collect();

      // Placeholder implementation until collectors are ready
      const result: FrameworkResults = {
        framework,
        totalControls: 0,
        passedControls: 0,
        failedControls: 0,
        warnControls: 0,
        skippedControls: 0,
        errorControls: 0,
        controls: [],
        executionTimeMs: Date.now() - startTime,
      };

      logger.warn(`${framework.toUpperCase()} collector not yet implemented`, {
        framework,
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
 * Generate PDF and/or JSON reports
 */
async function generateReports(
  _report: ComplianceReport,
  _inputs: ActionInputs,
  _githubContext: GitHubContext
): Promise<ReportResult> {
  const result: ReportResult = {};

  try {
    // TODO: Replace with actual report generator implementations
    // if (inputs.reportFormat === 'pdf' || inputs.reportFormat === 'both') {
    //   const pdfGenerator = new PDFGenerator();
    //   result.pdfPath = await pdfGenerator.generate(report);
    // }

    // if (inputs.reportFormat === 'json' || inputs.reportFormat === 'both') {
    //   const jsonFormatter = new JSONFormatter();
    //   result.jsonPath = await jsonFormatter.generate(report);
    // }

    logger.warn('Report generators not yet implemented');

    return result;
  } catch (error) {
    logger.error('Failed to generate reports', error as Error);
    throw error;
  }
}

/**
 * Upload reports to GitHub Releases
 */
async function uploadReports(
  _reportResult: ReportResult,
  _githubContext: GitHubContext,
  _octokit: Octokit
): Promise<{ pdfUrl?: string; jsonUrl?: string }> {
  try {
    // TODO: Replace with actual artifact store implementation
    // const artifactStore = new ArtifactStore(octokit, githubContext);
    // return await artifactStore.upload(reportResult);

    logger.warn('Artifact store not yet implemented');

    return {};
  } catch (error) {
    logger.error('Failed to upload reports', error as Error);
    throw error;
  }
}

/**
 * Post compliance status as PR comment
 */
async function postPRComment(
  _report: ComplianceReport,
  _reportUrls: { pdfUrl?: string; jsonUrl?: string },
  githubContext: GitHubContext,
  _octokit: Octokit
): Promise<void> {
  if (!githubContext.pullRequest) {
    return;
  }

  try {
    // TODO: Replace with actual PR commenter implementation
    // const prCommenter = new PRCommenter(octokit, githubContext);
    // await prCommenter.post(report, reportUrls);

    logger.warn('PR commenter not yet implemented');
  } catch (error) {
    logger.error('Failed to post PR comment', error as Error);
    // Don't throw - PR comment is not critical
  }
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
      text: `🚨 Compliance Violations Detected`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Compliance Violations Detected',
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
      if (reportUrls.pdfUrl) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${reportUrls.pdfUrl}|📄 View Report>`,
          },
        });
      }
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

// Execute main function
if (require.main === module) {
  run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { run };
