/**
 * Unit tests for configuration utility
 * Tests input parsing, validation, and GitHub context extraction
 */

import { describe, it, expect, jest, beforeEach, afterAll } from "@jest/globals";
import { ValidationError } from "../../../src/utils/errors";

// We need to set up mocks BEFORE importing config
const mockGetInput = jest.fn();
const mockGetBooleanInput = jest.fn();

jest.mock("@actions/core", () => ({
  getInput: (...args: any[]) => mockGetInput(...args),
  getBooleanInput: (...args: any[]) => mockGetBooleanInput(...args),
}));

const mockContext = {
  repo: { owner: "test-org", repo: "test-repo" },
  ref: "refs/heads/main",
  sha: "abc123def456",
  payload: {} as any,
};

jest.mock("@actions/github", () => ({
  context: mockContext,
}));

import { parseInputs, getGitHubContext, validatePermissions } from "../../../src/utils/config";

// Helper: set up mocked getInput/getBooleanInput for valid defaults
function setupValidInputs(overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    "github-token": "ghp_test1234567890",
    "anthropic-api-key": "sk-ant-test123",
    "frameworks": "soc2",
    "report-format": "both",
    "license-key": "",
    "slack-webhook": "",
    "fail-on-violations": "false",
  };
  const merged = { ...defaults, ...overrides };

  mockGetInput.mockImplementation((name: string) => {
    return merged[name] ?? "";
  });
  mockGetBooleanInput.mockImplementation((name: string) => {
    const val = merged[name];
    return val === "true" || val === "True" || val === "TRUE";
  });
}

describe("Config Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset payload between tests
    mockContext.payload = {};
  });

  describe("parseInputs - valid inputs", () => {
    it("should parse valid inputs and return ActionInputs", () => {
      setupValidInputs();
      const config = parseInputs();
      expect(config.githubToken).toBe("ghp_test1234567890");
      expect(config.anthropicApiKey).toBe("sk-ant-test123");
      expect(config.frameworks).toEqual(["soc2"]);
      expect(config.reportFormat).toBe("both");
      expect(config.failOnViolations).toBe(false);
    });

    it("should parse multiple frameworks from comma-separated input", () => {
      setupValidInputs({ "frameworks": "soc2,gdpr,iso27001" });
      const config = parseInputs();
      expect(config.frameworks).toEqual(["soc2", "gdpr", "iso27001"]);
    });

    it("should trim whitespace in framework names", () => {
      setupValidInputs({ "frameworks": " soc2 , gdpr " });
      const config = parseInputs();
      expect(config.frameworks).toEqual(["soc2", "gdpr"]);
    });

    it("should lowercase framework names", () => {
      setupValidInputs({ "frameworks": "SOC2,GDPR" });
      const config = parseInputs();
      expect(config.frameworks).toEqual(["soc2", "gdpr"]);
    });

    it("should accept pdf report format", () => {
      setupValidInputs({ "report-format": "pdf" });
      const config = parseInputs();
      expect(config.reportFormat).toBe("pdf");
    });

    it("should accept json report format", () => {
      setupValidInputs({ "report-format": "json" });
      const config = parseInputs();
      expect(config.reportFormat).toBe("json");
    });

    it("should set licenseKey to undefined when empty", () => {
      setupValidInputs({ "license-key": "" });
      const config = parseInputs();
      expect(config.licenseKey).toBeUndefined();
    });

    it("should set slackWebhook to undefined when empty", () => {
      setupValidInputs({ "slack-webhook": "" });
      const config = parseInputs();
      expect(config.slackWebhook).toBeUndefined();
    });

    it("should accept valid slack webhook URL", () => {
      setupValidInputs({ "slack-webhook": "https://hooks.slack.com/services/T00/B00/xxx" });
      const config = parseInputs();
      expect(config.slackWebhook).toBe("https://hooks.slack.com/services/T00/B00/xxx");
    });

    it("should parse failOnViolations as boolean", () => {
      setupValidInputs({ "fail-on-violations": "true" });
      const config = parseInputs();
      expect(config.failOnViolations).toBe(true);
    });
  });

  describe("parseInputs - validation errors", () => {
    it("should throw on empty github-token", () => {
      setupValidInputs({ "github-token": "" });
      expect(() => parseInputs()).toThrow("github-token is required");
    });

    it("should throw on empty anthropic-api-key", () => {
      setupValidInputs({ "anthropic-api-key": "" });
      expect(() => parseInputs()).toThrow("anthropic-api-key is required");
    });

    it("should throw on invalid anthropic-api-key prefix", () => {
      setupValidInputs({ "anthropic-api-key": "invalid-key-123" });
      expect(() => parseInputs()).toThrow("sk-ant-");
    });

    it("should throw on invalid framework name", () => {
      setupValidInputs({ "frameworks": "soc2,soc3" });
      expect(() => parseInputs()).toThrow("soc3");
    });

    it("should throw on invalid report format", () => {
      setupValidInputs({ "report-format": "xml" });
      expect(() => parseInputs()).toThrow("xml");
    });

    it("should throw on invalid slack webhook URL", () => {
      setupValidInputs({ "slack-webhook": "https://not-slack.com/hook" });
      expect(() => parseInputs()).toThrow("hooks.slack.com");
    });
  });

  describe("getGitHubContext", () => {
    it("should extract repository info from github context", () => {
      const ctx = getGitHubContext();
      expect(ctx.owner).toBe("test-org");
      expect(ctx.repo).toBe("test-repo");
      expect(ctx.ref).toBe("refs/heads/main");
      expect(ctx.sha).toBe("abc123def456");
    });

    it("should include pullRequest when present in payload", () => {
      mockContext.payload = {
        pull_request: {
          number: 42,
          head: { ref: "feature-branch" },
          base: { ref: "main" },
        },
      };
      const ctx = getGitHubContext();
      expect(ctx.pullRequest).toEqual({
        number: 42,
        head: "feature-branch",
        base: "main",
      });
    });

    it("should not include pullRequest when not in payload", () => {
      mockContext.payload = {};
      const ctx = getGitHubContext();
      expect(ctx.pullRequest).toBeUndefined();
    });
  });

  describe("validatePermissions", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should throw when not running in GitHub Actions", () => {
      delete process.env.GITHUB_ACTIONS;
      expect(() => validatePermissions()).toThrow("GitHub Actions");
    });

    it("should throw when required env vars are missing", () => {
      process.env.GITHUB_ACTIONS = "true";
      delete process.env.GITHUB_REPOSITORY;
      delete process.env.GITHUB_SHA;
      delete process.env.GITHUB_REF;
      expect(() => validatePermissions()).toThrow("GITHUB_REPOSITORY");
    });

    it("should pass when all env vars are present", () => {
      process.env.GITHUB_ACTIONS = "true";
      process.env.GITHUB_REPOSITORY = "test-org/test-repo";
      process.env.GITHUB_SHA = "abc123";
      process.env.GITHUB_REF = "refs/heads/main";
      expect(() => validatePermissions()).not.toThrow();
    });
  });
});
