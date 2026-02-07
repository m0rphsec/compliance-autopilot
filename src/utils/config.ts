/**
 * Configuration utilities for Compliance Autopilot
 *
 * @module utils/config
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { ActionInputs, GitHubContext, ComplianceFramework } from '../types';
import { ValidationError } from './errors';

/**
 * Parse and validate action inputs
 */
export function parseInputs(): ActionInputs {
  const githubToken = core.getInput('github-token', { required: true });
  const anthropicApiKey = core.getInput('anthropic-api-key', { required: true });
  const licenseKey = core.getInput('license-key', { required: false }) || undefined;
  const frameworksInput = core.getInput('frameworks', { required: false }) || 'soc2';
  const reportFormat = core.getInput('report-format', { required: false }) || 'both';
  const failOnViolations = core.getBooleanInput('fail-on-violations', { required: false });
  const slackWebhook = core.getInput('slack-webhook', { required: false }) || undefined;

  // Validate GitHub token
  if (!githubToken || githubToken.length === 0) {
    throw new ValidationError('github-token is required');
  }

  // Validate Anthropic API key
  if (!anthropicApiKey || anthropicApiKey.length === 0) {
    throw new ValidationError('anthropic-api-key is required');
  }

  if (!anthropicApiKey.startsWith('sk-ant-')) {
    throw new ValidationError(
      'anthropic-api-key must be a valid Anthropic API key starting with "sk-ant-"'
    );
  }

  // Parse and validate frameworks
  const frameworks = frameworksInput
    .split(',')
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f.length > 0);

  const validFrameworks: ComplianceFramework[] = ['soc2', 'gdpr', 'iso27001'];
  const invalidFrameworks = frameworks.filter(
    (f) => !validFrameworks.includes(f as ComplianceFramework)
  );

  if (invalidFrameworks.length > 0) {
    throw new ValidationError(
      `Invalid frameworks: ${invalidFrameworks.join(', ')}. Valid options: ${validFrameworks.join(', ')}`
    );
  }

  if (frameworks.length === 0) {
    throw new ValidationError(
      'At least one framework must be specified. Valid options: soc2, gdpr, iso27001'
    );
  }

  // Validate report format
  const validFormats = ['pdf', 'json', 'both'];
  if (!validFormats.includes(reportFormat)) {
    throw new ValidationError(
      `Invalid report-format: ${reportFormat}. Valid options: ${validFormats.join(', ')}`
    );
  }

  // Validate Slack webhook if provided
  if (slackWebhook && !slackWebhook.startsWith('https://hooks.slack.com/')) {
    throw new ValidationError(
      'slack-webhook must be a valid Slack webhook URL starting with "https://hooks.slack.com/"'
    );
  }

  return {
    githubToken,
    anthropicApiKey,
    licenseKey,
    frameworks: frameworks as ComplianceFramework[],
    reportFormat: reportFormat as 'pdf' | 'json' | 'both',
    failOnViolations,
    slackWebhook,
  };
}

/**
 * Extract GitHub context information
 */
export function getGitHubContext(): GitHubContext {
  const { context } = github;

  const ctx: GitHubContext = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: context.ref,
    sha: context.sha,
  };

  // Add PR information if available
  if (context.payload.pull_request) {
    ctx.pullRequest = {
      number: context.payload.pull_request.number,
      head: context.payload.pull_request.head.ref,
      base: context.payload.pull_request.base.ref,
    };
  }

  return ctx;
}

/**
 * Validate required permissions
 */
export function validatePermissions(): void {
  // Check if running in GitHub Actions
  if (!process.env.GITHUB_ACTIONS) {
    throw new ValidationError('This action must be run in GitHub Actions environment');
  }

  // Check if required environment variables are set
  const requiredEnvVars = ['GITHUB_REPOSITORY', 'GITHUB_SHA', 'GITHUB_REF'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    throw new ValidationError(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
