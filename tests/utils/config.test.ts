/**
 * Tests for configuration management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as core from '@actions/core';
import { loadConfig, validateConfig, getConfig, type ActionConfig } from '../../src/utils/config.js';
import { ComplianceFramework } from '../../src/types/evidence.js';
import { ConfigError } from '../../src/utils/errors.js';

// Mock @actions/core
jest.mock('@actions/core');

describe('loadConfig', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.INPUT_FRAMEWORKS;
    jest.clearAllMocks();
  });

  it('should load minimal valid config', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';

    const config = loadConfig();

    expect(config.githubToken).toBe('ghp_testtoken123456789012345678901234567890');
    expect(config.repository).toBe('owner/repo');
    expect(config.frameworks).toEqual([ComplianceFramework.SOC2]);
  });

  it('should load config with multiple frameworks', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_FRAMEWORKS = 'SOC2,GDPR,ISO27001';

    const config = loadConfig();

    expect(config.frameworks).toEqual([
      ComplianceFramework.SOC2,
      ComplianceFramework.GDPR,
      ComplianceFramework.ISO27001
    ]);
  });

  it('should load config with date range', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_START_DATE = '2024-01-01T00:00:00Z';
    process.env.INPUT_END_DATE = '2024-12-31T23:59:59Z';

    const config = loadConfig();

    expect(config.dateRange).toBeDefined();
    expect(config.dateRange?.start).toBe('2024-01-01T00:00:00.000Z');
    expect(config.dateRange?.end).toBe('2024-12-31T23:59:59.000Z');
  });

  it('should load config with control IDs', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_CONTROL_IDS = 'CC6.1,CC7.2,CC8.1';

    const config = loadConfig();

    expect(config.controlIds).toEqual(['CC6.1', 'CC7.2', 'CC8.1']);
  });

  it('should load config with custom settings', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_FAIL_ON_NON_COMPLIANCE = 'false';
    process.env.INPUT_OUTPUT_FORMAT = 'json';
    process.env.INPUT_OUTPUT_PATH = 'custom-report';
    process.env.INPUT_UPLOAD_ARTIFACT = 'false';
    process.env.INPUT_ARTIFACT_NAME = 'custom-artifact';
    process.env.INPUT_MIN_COMPLIANCE_PERCENTAGE = '90';

    const config = loadConfig();

    expect(config.failOnNonCompliance).toBe(false);
    expect(config.outputFormat).toBe('json');
    expect(config.outputPath).toBe('custom-report');
    expect(config.uploadArtifact).toBe(false);
    expect(config.artifactName).toBe('custom-artifact');
    expect(config.minCompliancePercentage).toBe(90);
  });

  it('should throw error if github token is missing', () => {
    process.env.GITHUB_REPOSITORY = 'owner/repo';

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow('github-token');
  });

  it('should throw error if repository is missing', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow('repository');
  });

  it('should throw error for invalid repository format', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'invalid-repo';

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow('Invalid repository format');
  });

  it('should throw error for invalid framework', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_FRAMEWORKS = 'INVALID';

    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it('should throw error for invalid date', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_START_DATE = 'invalid-date';
    process.env.INPUT_END_DATE = '2024-12-31T00:00:00Z';

    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it('should throw error if start date is after end date', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_START_DATE = '2024-12-31T00:00:00Z';
    process.env.INPUT_END_DATE = '2024-01-01T00:00:00Z';

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow('start-date must be before end-date');
  });

  it('should throw error for invalid output format', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_OUTPUT_FORMAT = 'invalid';

    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it('should throw error for invalid min compliance percentage', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.INPUT_MIN_COMPLIANCE_PERCENTAGE = '150';

    expect(() => loadConfig()).toThrow(ConfigError);
  });
});

describe('validateConfig', () => {
  it('should validate valid config', () => {
    const config: ActionConfig = {
      githubToken: 'ghp_testtoken123456789012345678901234567890',
      repository: 'owner/repo',
      frameworks: [ComplianceFramework.SOC2],
      failOnNonCompliance: true,
      outputFormat: 'both',
      uploadArtifact: true,
      artifactName: 'compliance-report',
      minCompliancePercentage: 80
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should throw error for invalid token format', () => {
    const config: ActionConfig = {
      githubToken: 'invalid-token',
      repository: 'owner/repo',
      frameworks: [ComplianceFramework.SOC2],
      failOnNonCompliance: true,
      outputFormat: 'both',
      uploadArtifact: true,
      artifactName: 'compliance-report',
      minCompliancePercentage: 80
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
    expect(() => validateConfig(config)).toThrow('Invalid GitHub token format');
  });

  it('should throw error for empty frameworks', () => {
    const config: ActionConfig = {
      githubToken: 'ghp_testtoken123456789012345678901234567890',
      repository: 'owner/repo',
      frameworks: [],
      failOnNonCompliance: true,
      outputFormat: 'both',
      uploadArtifact: true,
      artifactName: 'compliance-report',
      minCompliancePercentage: 80
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });

  it('should throw error for invalid date range', () => {
    const config: ActionConfig = {
      githubToken: 'ghp_testtoken123456789012345678901234567890',
      repository: 'owner/repo',
      frameworks: [ComplianceFramework.SOC2],
      dateRange: {
        start: '2024-12-31T00:00:00Z',
        end: '2024-01-01T00:00:00Z'
      },
      failOnNonCompliance: true,
      outputFormat: 'both',
      uploadArtifact: true,
      artifactName: 'compliance-report',
      minCompliancePercentage: 80
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });

  it('should throw error for future end date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const config: ActionConfig = {
      githubToken: 'ghp_testtoken123456789012345678901234567890',
      repository: 'owner/repo',
      frameworks: [ComplianceFramework.SOC2],
      dateRange: {
        start: '2024-01-01T00:00:00Z',
        end: futureDate.toISOString()
      },
      failOnNonCompliance: true,
      outputFormat: 'both',
      uploadArtifact: true,
      artifactName: 'compliance-report',
      minCompliancePercentage: 80
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });

  it('should throw error for invalid min compliance percentage', () => {
    const config: ActionConfig = {
      githubToken: 'ghp_testtoken123456789012345678901234567890',
      repository: 'owner/repo',
      frameworks: [ComplianceFramework.SOC2],
      failOnNonCompliance: true,
      outputFormat: 'both',
      uploadArtifact: true,
      artifactName: 'compliance-report',
      minCompliancePercentage: 150
    };

    expect(() => validateConfig(config)).toThrow(ConfigError);
  });
});

describe('getConfig', () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPOSITORY;
    jest.clearAllMocks();
  });

  it('should return validated config', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123456789012345678901234567890';
    process.env.GITHUB_REPOSITORY = 'owner/repo';

    const config = getConfig();

    expect(config.githubToken).toBeTruthy();
    expect(config.repository).toBe('owner/repo');
  });

  it('should throw error for invalid config', () => {
    process.env.GITHUB_TOKEN = 'invalid-token';
    process.env.GITHUB_REPOSITORY = 'owner/repo';

    expect(() => getConfig()).toThrow(ConfigError);
  });
});
