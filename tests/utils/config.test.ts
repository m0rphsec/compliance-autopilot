/**
 * Tests for configuration management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseInputs, getGitHubContext, validatePermissions } from '../../src/utils/config.js';
import { ValidationError } from '../../src/utils/errors.js';

// Mock @actions/core
jest.mock('@actions/core');
jest.mock('@actions/github');

const mockedCore = core as jest.Mocked<typeof core>;
const mockedGithub = github as jest.Mocked<typeof github>;

describe('parseInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for getInput - returns empty string by default
    mockedCore.getInput.mockImplementation((name: string, options?: core.InputOptions) => {
      return '';
    });
    mockedCore.getBooleanInput.mockReturnValue(false);
  });

  it('should parse minimal valid inputs', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.githubToken).toBe('ghp_testtoken123456789012345678901234567890');
    expect(inputs.anthropicApiKey).toBe('sk-ant-testkey123456789');
    expect(inputs.frameworks).toEqual(['soc2']);
    expect(inputs.reportFormat).toBe('both');
    expect(inputs.failOnViolations).toBe(false);
  });

  it('should parse multiple frameworks', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2,gdpr,iso27001';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.frameworks).toEqual(['soc2', 'gdpr', 'iso27001']);
  });

  it('should parse json report format', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'json';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.reportFormat).toBe('json');
  });

  it('should parse pdf report format', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'pdf';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.reportFormat).toBe('pdf');
  });

  it('should parse slack webhook', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return 'https://hooks.slack.com/services/T00/B00/xxx';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.slackWebhook).toBe('https://hooks.slack.com/services/T00/B00/xxx');
  });

  it('should parse license key', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return 'my-license-key';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.licenseKey).toBe('my-license-key');
  });

  it('should parse failOnViolations as true', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(true);

    const inputs = parseInputs();

    expect(inputs.failOnViolations).toBe(true);
  });

  it('should throw ValidationError if github-token is empty', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return '';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    expect(() => parseInputs()).toThrow(ValidationError);
    expect(() => parseInputs()).toThrow('github-token is required');
  });

  it('should throw ValidationError if anthropic-api-key is empty', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return '';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    expect(() => parseInputs()).toThrow(ValidationError);
    expect(() => parseInputs()).toThrow('anthropic-api-key is required');
  });

  it('should throw ValidationError if anthropic-api-key does not start with sk-ant-', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'invalid-key-format';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    expect(() => parseInputs()).toThrow(ValidationError);
    expect(() => parseInputs()).toThrow('anthropic-api-key must be a valid Anthropic API key');
  });

  it('should throw ValidationError for invalid framework', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'INVALID';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    expect(() => parseInputs()).toThrow(ValidationError);
    expect(() => parseInputs()).toThrow('Invalid frameworks');
  });

  it('should throw ValidationError for invalid report format', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'csv';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    expect(() => parseInputs()).toThrow(ValidationError);
    expect(() => parseInputs()).toThrow('Invalid report-format');
  });

  it('should throw ValidationError for invalid slack webhook', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return 'https://not-slack.com/webhook';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    expect(() => parseInputs()).toThrow(ValidationError);
    expect(() => parseInputs()).toThrow('slack-webhook must be a valid Slack webhook URL');
  });

  it('should set undefined for optional fields when empty', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.slackWebhook).toBeUndefined();
    expect(inputs.licenseKey).toBeUndefined();
  });

  it('should trim and lowercase framework names', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return ' SOC2 , GDPR ';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.frameworks).toEqual(['soc2', 'gdpr']);
  });

  it('should use default framework when frameworks input is empty', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return '';
        case 'report-format': return 'both';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.frameworks).toEqual(['soc2']);
  });

  it('should use default report format when report-format input is empty', () => {
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token': return 'ghp_testtoken123456789012345678901234567890';
        case 'anthropic-api-key': return 'sk-ant-testkey123456789';
        case 'frameworks': return 'soc2';
        case 'report-format': return '';
        case 'slack-webhook': return '';
        case 'license-key': return '';
        default: return '';
      }
    });
    mockedCore.getBooleanInput.mockReturnValue(false);

    const inputs = parseInputs();

    expect(inputs.reportFormat).toBe('both');
  });
});

describe('getGitHubContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract basic GitHub context', () => {
    Object.defineProperty(github, 'context', {
      value: {
        repo: { owner: 'test-owner', repo: 'test-repo' },
        ref: 'refs/heads/main',
        sha: 'abc123',
        payload: {},
      },
      writable: true,
    });

    const ctx = getGitHubContext();

    expect(ctx.owner).toBe('test-owner');
    expect(ctx.repo).toBe('test-repo');
    expect(ctx.ref).toBe('refs/heads/main');
    expect(ctx.sha).toBe('abc123');
    expect(ctx.pullRequest).toBeUndefined();
  });

  it('should include pull request information when available', () => {
    Object.defineProperty(github, 'context', {
      value: {
        repo: { owner: 'test-owner', repo: 'test-repo' },
        ref: 'refs/pull/42/merge',
        sha: 'abc123',
        payload: {
          pull_request: {
            number: 42,
            head: { ref: 'feature-branch' },
            base: { ref: 'main' },
          },
        },
      },
      writable: true,
    });

    const ctx = getGitHubContext();

    expect(ctx.pullRequest).toBeDefined();
    expect(ctx.pullRequest?.number).toBe(42);
    expect(ctx.pullRequest?.head).toBe('feature-branch');
    expect(ctx.pullRequest?.base).toBe('main');
  });
});

describe('validatePermissions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw if not running in GitHub Actions', () => {
    delete process.env.GITHUB_ACTIONS;

    expect(() => validatePermissions()).toThrow(ValidationError);
    expect(() => validatePermissions()).toThrow('must be run in GitHub Actions');
  });

  it('should throw if required env vars are missing', () => {
    process.env.GITHUB_ACTIONS = 'true';
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_SHA;
    delete process.env.GITHUB_REF;

    expect(() => validatePermissions()).toThrow(ValidationError);
    expect(() => validatePermissions()).toThrow('Missing required environment variables');
  });

  it('should not throw when all required env vars are present', () => {
    process.env.GITHUB_ACTIONS = 'true';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.GITHUB_SHA = 'abc123';
    process.env.GITHUB_REF = 'refs/heads/main';

    expect(() => validatePermissions()).not.toThrow();
  });
});
