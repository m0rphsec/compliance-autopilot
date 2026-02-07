"use strict";
/**
 * Configuration utilities for Compliance Autopilot
 *
 * @module utils/config
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInputs = parseInputs;
exports.getGitHubContext = getGitHubContext;
exports.validatePermissions = validatePermissions;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const errors_1 = require("./errors");
/**
 * Parse and validate action inputs
 */
function parseInputs() {
    const githubToken = core.getInput('github-token', { required: true });
    const anthropicApiKey = core.getInput('anthropic-api-key', { required: true });
    const licenseKey = core.getInput('license-key', { required: false }) || undefined;
    const frameworksInput = core.getInput('frameworks', { required: false }) || 'soc2';
    const reportFormat = core.getInput('report-format', { required: false }) || 'both';
    const failOnViolations = core.getBooleanInput('fail-on-violations', { required: false });
    const slackWebhook = core.getInput('slack-webhook', { required: false }) || undefined;
    // Validate GitHub token
    if (!githubToken || githubToken.length === 0) {
        throw new errors_1.ValidationError('github-token is required');
    }
    // Validate Anthropic API key
    if (!anthropicApiKey || anthropicApiKey.length === 0) {
        throw new errors_1.ValidationError('anthropic-api-key is required');
    }
    if (!anthropicApiKey.startsWith('sk-ant-')) {
        throw new errors_1.ValidationError('anthropic-api-key must be a valid Anthropic API key starting with "sk-ant-"');
    }
    // Parse and validate frameworks
    const frameworks = frameworksInput
        .split(',')
        .map((f) => f.trim().toLowerCase())
        .filter((f) => f.length > 0);
    const validFrameworks = ['soc2', 'gdpr', 'iso27001'];
    const invalidFrameworks = frameworks.filter((f) => !validFrameworks.includes(f));
    if (invalidFrameworks.length > 0) {
        throw new errors_1.ValidationError(`Invalid frameworks: ${invalidFrameworks.join(', ')}. Valid options: ${validFrameworks.join(', ')}`);
    }
    if (frameworks.length === 0) {
        throw new errors_1.ValidationError('At least one framework must be specified. Valid options: soc2, gdpr, iso27001');
    }
    // Validate report format
    const validFormats = ['pdf', 'json', 'both'];
    if (!validFormats.includes(reportFormat)) {
        throw new errors_1.ValidationError(`Invalid report-format: ${reportFormat}. Valid options: ${validFormats.join(', ')}`);
    }
    // Validate Slack webhook if provided
    if (slackWebhook && !slackWebhook.startsWith('https://hooks.slack.com/')) {
        throw new errors_1.ValidationError('slack-webhook must be a valid Slack webhook URL starting with "https://hooks.slack.com/"');
    }
    return {
        githubToken,
        anthropicApiKey,
        licenseKey,
        frameworks: frameworks,
        reportFormat: reportFormat,
        failOnViolations,
        slackWebhook,
    };
}
/**
 * Extract GitHub context information
 */
function getGitHubContext() {
    const { context } = github;
    const ctx = {
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
function validatePermissions() {
    // Check if running in GitHub Actions
    if (!process.env.GITHUB_ACTIONS) {
        throw new errors_1.ValidationError('This action must be run in GitHub Actions environment');
    }
    // Check if required environment variables are set
    const requiredEnvVars = ['GITHUB_REPOSITORY', 'GITHUB_SHA', 'GITHUB_REF'];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
    if (missingVars.length > 0) {
        throw new errors_1.ValidationError(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}
//# sourceMappingURL=config.js.map