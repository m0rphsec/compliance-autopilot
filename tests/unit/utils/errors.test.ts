/**
 * Unit tests for error handling utilities
 * Tests custom error classes, error formatting, and error utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  ErrorCode,
  BaseError,
  APIError,
  ValidationError,
  ComplianceError,
  ConfigError,
  GitHubAPIError,
  RateLimitError,
  PermissionError,
  EvidenceCollectionError,
  isBaseError,
  isAPIError,
  isValidationError,
  isComplianceError,
  isConfigError,
  isRetryableError,
  getRetryDelay,
  formatErrorForUser,
} from "../../../src/utils/errors";

describe("Error Utilities", () => {
  describe("APIError", () => {
    it("should construct with message, code, and options", () => {
      const err = new APIError("request failed", ErrorCode.API_REQUEST_FAILED, {
        statusCode: 500,
        context: { url: "/api/test" },
      });
      expect(err.message).toBe("request failed");
      expect(err.name).toBe("APIError");
      expect(err.code).toBe(ErrorCode.API_REQUEST_FAILED);
      expect(err.statusCode).toBe(500);
      expect(err.context).toEqual({ url: "/api/test" });
    });

    it("should be an instance of Error and BaseError", () => {
      const err = new APIError("test");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(BaseError);
      expect(err).toBeInstanceOf(APIError);
    });

    it("should preserve stack trace", () => {
      const err = new APIError("test");
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain("APIError");
    });

    it("should create rate limit error via static method", () => {
      const resetTime = new Date("2026-01-01T00:00:00Z");
      const err = APIError.rateLimitExceeded(resetTime);
      expect(err.code).toBe(ErrorCode.API_RATE_LIMIT);
      expect(err.statusCode).toBe(429);
      expect(err.context?.resetTime).toBe(resetTime.toISOString());
    });

    it("should create unauthorized error via static method", () => {
      const err = APIError.unauthorized("bad token");
      expect(err.code).toBe(ErrorCode.API_UNAUTHORIZED);
      expect(err.statusCode).toBe(401);
      expect(err.message).toContain("bad token");
    });

    it("should create not-found error via static method", () => {
      const err = APIError.notFound("repo/foo");
      expect(err.code).toBe(ErrorCode.API_NOT_FOUND);
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain("repo/foo");
    });

    it("should create invalid-response error via static method", () => {
      const err = APIError.invalidResponse("missing body");
      expect(err.code).toBe(ErrorCode.API_INVALID_RESPONSE);
      expect(err.statusCode).toBe(500);
      expect(err.message).toContain("missing body");
    });
  });

  describe("ValidationError", () => {
    it("should construct with field, expected, and received", () => {
      const err = new ValidationError("bad input", ErrorCode.VALIDATION_FAILED, {
        field: "email",
        expected: "string",
        received: 42,
      });
      expect(err.message).toBe("bad input");
      expect(err.name).toBe("ValidationError");
      expect(err.field).toBe("email");
      expect(err.expected).toBe("string");
      expect(err.received).toBe(42);
      expect(err.statusCode).toBe(400);
    });

    it("should create missing-required error via static method", () => {
      const err = ValidationError.missingRequired("name");
      expect(err.code).toBe(ErrorCode.VALIDATION_MISSING_REQUIRED);
      expect(err.field).toBe("name");
      expect(err.message).toContain("name");
    });

    it("should create invalid-format error via static method", () => {
      const err = ValidationError.invalidFormat("age", "number", "abc");
      expect(err.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      expect(err.field).toBe("age");
      expect(err.expected).toBe("number");
      expect(err.received).toBe("abc");
    });

    it("should create invalid-input error via static method", () => {
      const err = ValidationError.invalidInput("bad data", "payload");
      expect(err.code).toBe(ErrorCode.VALIDATION_INVALID_INPUT);
      expect(err.field).toBe("payload");
    });
  });

  describe("ComplianceError", () => {
    it("should store controlId and framework", () => {
      const err = new ComplianceError("failed", ErrorCode.COMPLIANCE_CONTROL_FAILED, {
        controlId: "CC1.1",
        framework: "soc2",
      });
      expect(err.controlId).toBe("CC1.1");
      expect(err.framework).toBe("soc2");
      expect(err.name).toBe("ComplianceError");
    });

    it("should create controlFailed error via static method", () => {
      const err = ComplianceError.controlFailed("CC6.1", "no MFA");
      expect(err.code).toBe(ErrorCode.COMPLIANCE_CONTROL_FAILED);
      expect(err.controlId).toBe("CC6.1");
      expect(err.message).toContain("CC6.1");
      expect(err.message).toContain("no MFA");
    });

    it("should create evidenceMissing error via static method", () => {
      const err = ComplianceError.evidenceMissing("CC7.1", "audit log");
      expect(err.code).toBe(ErrorCode.COMPLIANCE_EVIDENCE_MISSING);
      expect(err.controlId).toBe("CC7.1");
      expect(err.message).toContain("audit log");
    });

    it("should create invalidFramework error via static method", () => {
      const err = ComplianceError.invalidFramework("soc3");
      expect(err.code).toBe(ErrorCode.COMPLIANCE_INVALID_FRAMEWORK);
      expect(err.framework).toBe("soc3");
    });

    it("should create reportGenerationFailed error via static method", () => {
      const cause = new Error("disk full");
      const err = ComplianceError.reportGenerationFailed("write failed", cause);
      expect(err.code).toBe(ErrorCode.COMPLIANCE_REPORT_GENERATION);
      expect(err.cause).toBe(cause);
    });
  });

  describe("ConfigError", () => {
    it("should construct with message and code", () => {
      const err = new ConfigError("bad config", ErrorCode.CONFIG_INVALID);
      expect(err.name).toBe("ConfigError");
      expect(err.code).toBe(ErrorCode.CONFIG_INVALID);
    });

    it("should create missing error via static method", () => {
      const err = ConfigError.missing("API_KEY");
      expect(err.code).toBe(ErrorCode.CONFIG_MISSING);
      expect(err.message).toContain("API_KEY");
    });

    it("should create parseError via static method", () => {
      const cause = new Error("unexpected token");
      const err = ConfigError.parseError("invalid JSON", cause);
      expect(err.code).toBe(ErrorCode.CONFIG_PARSE_ERROR);
      expect(err.cause).toBe(cause);
    });
  });

  describe("GitHubAPIError", () => {
    it("should store url and statusCode", () => {
      const err = new GitHubAPIError("not found", 404, "https://api.github.com/repos/x");
      expect(err.url).toBe("https://api.github.com/repos/x");
      expect(err.statusCode).toBe(404);
      expect(err).toBeInstanceOf(APIError);
      expect(err).toBeInstanceOf(BaseError);
    });
  });

  describe("RateLimitError", () => {
    it("should store resetTime, limit, and remaining", () => {
      const reset = new Date("2026-06-01T00:00:00Z");
      const err = new RateLimitError("rate limited", reset, 5000, 0);
      expect(err.resetTime).toBe(reset);
      expect(err.limit).toBe(5000);
      expect(err.remaining).toBe(0);
      expect(err.statusCode).toBe(429);
      expect(err).toBeInstanceOf(APIError);
    });
  });

  describe("PermissionError", () => {
    it("should store requiredScopes", () => {
      const err = new PermissionError("forbidden", ["repo", "admin"]);
      expect(err.requiredScopes).toEqual(["repo", "admin"]);
      expect(err.statusCode).toBe(403);
      expect(err).toBeInstanceOf(APIError);
    });
  });

  describe("EvidenceCollectionError", () => {
    it("should store controlId and extend ComplianceError", () => {
      const err = new EvidenceCollectionError("missing logs", "CC7.2");
      expect(err.controlId).toBe("CC7.2");
      expect(err.code).toBe(ErrorCode.COMPLIANCE_EVIDENCE_MISSING);
      expect(err).toBeInstanceOf(ComplianceError);
    });
  });

  describe("Type guard functions", () => {
    it("isBaseError returns true for BaseError subclasses", () => {
      expect(isBaseError(new APIError("test"))).toBe(true);
      expect(isBaseError(new ValidationError("test"))).toBe(true);
      expect(isBaseError(new ComplianceError("test"))).toBe(true);
      expect(isBaseError(new ConfigError("test"))).toBe(true);
      expect(isBaseError(new Error("plain"))).toBe(false);
      expect(isBaseError("string")).toBe(false);
    });

    it("isAPIError returns true only for APIError instances", () => {
      expect(isAPIError(new APIError("test"))).toBe(true);
      expect(isAPIError(new GitHubAPIError("test"))).toBe(true);
      expect(isAPIError(new ValidationError("test"))).toBe(false);
    });

    it("isValidationError returns true only for ValidationError instances", () => {
      expect(isValidationError(new ValidationError("test"))).toBe(true);
      expect(isValidationError(new APIError("test"))).toBe(false);
    });

    it("isComplianceError returns true only for ComplianceError instances", () => {
      expect(isComplianceError(new ComplianceError("test"))).toBe(true);
      expect(isComplianceError(new EvidenceCollectionError("test"))).toBe(true);
      expect(isComplianceError(new APIError("test"))).toBe(false);
    });

    it("isConfigError returns true only for ConfigError instances", () => {
      expect(isConfigError(new ConfigError("test"))).toBe(true);
      expect(isConfigError(new APIError("test"))).toBe(false);
    });
  });

  describe("isRetryableError", () => {
    it("should return true for RateLimitError", () => {
      const err = new RateLimitError("limited", new Date());
      expect(isRetryableError(err)).toBe(true);
    });

    it("should return true for GitHubAPIError with 5xx status", () => {
      const err = new GitHubAPIError("server error", 500);
      expect(isRetryableError(err)).toBe(true);
    });

    it("should return false for GitHubAPIError with 4xx status", () => {
      const err = new GitHubAPIError("not found", 404);
      expect(isRetryableError(err)).toBe(false);
    });

    it("should return false for non-retryable errors", () => {
      expect(isRetryableError(new ValidationError("bad"))).toBe(false);
      expect(isRetryableError(new Error("plain"))).toBe(false);
    });
  });

  describe("getRetryDelay", () => {
    it("should return time until reset for RateLimitError", () => {
      const futureReset = new Date(Date.now() + 5000);
      const err = new RateLimitError("limited", futureReset);
      const delay = getRetryDelay(err, 0);
      expect(delay).toBeGreaterThanOrEqual(4000);
      expect(delay).toBeLessThanOrEqual(6000);
    });

    it("should return at least 1000ms for RateLimitError with past reset", () => {
      const pastReset = new Date(Date.now() - 5000);
      const err = new RateLimitError("limited", pastReset);
      const delay = getRetryDelay(err, 0);
      expect(delay).toBe(1000);
    });

    it("should use exponential backoff for other errors", () => {
      const err = new Error("generic");
      expect(getRetryDelay(err, 0)).toBe(1000);
      expect(getRetryDelay(err, 1)).toBe(2000);
      expect(getRetryDelay(err, 2)).toBe(4000);
      expect(getRetryDelay(err, 3)).toBe(8000);
    });

    it("should cap exponential backoff at 30000ms", () => {
      const err = new Error("generic");
      expect(getRetryDelay(err, 10)).toBe(30000);
    });
  });

  describe("toJSON serialization", () => {
    it("should serialize BaseError subclass to JSON", () => {
      const cause = new Error("root cause");
      const err = new APIError("failed", ErrorCode.API_REQUEST_FAILED, {
        statusCode: 500,
        context: { endpoint: "/api" },
        cause,
      });
      const json = err.toJSON();
      expect(json.name).toBe("APIError");
      expect(json.message).toBe("failed");
      expect(json.code).toBe(ErrorCode.API_REQUEST_FAILED);
      expect(json.statusCode).toBe(500);
      expect(json.context).toEqual({ endpoint: "/api" });
      expect(json.stack).toBeDefined();
      expect((json.cause as any).message).toBe("root cause");
    });

    it("should serialize without cause when none provided", () => {
      const err = new ConfigError("bad");
      const json = err.toJSON();
      expect(json.cause).toBeUndefined();
    });
  });

  describe("formatErrorForUser", () => {
    it("should format BaseError with code prefix", () => {
      const err = new APIError("request failed", ErrorCode.API_REQUEST_FAILED);
      const formatted = formatErrorForUser(err);
      expect(formatted).toContain("[API_1001]");
      expect(formatted).toContain("request failed");
    });

    it("should include URL for GitHubAPIError", () => {
      const err = new GitHubAPIError("not found", 404, "https://api.github.com/repos/x");
      const formatted = formatErrorForUser(err);
      expect(formatted).toContain("https://api.github.com/repos/x");
    });

    it("should include reset time for RateLimitError", () => {
      const reset = new Date("2026-06-01T00:00:00Z");
      const err = new RateLimitError("limited", reset);
      const formatted = formatErrorForUser(err);
      expect(formatted).toContain("2026-06-01");
    });

    it("should include cause message when present", () => {
      const cause = new Error("network down");
      const err = new APIError("failed", ErrorCode.API_REQUEST_FAILED, { cause });
      const formatted = formatErrorForUser(err);
      expect(formatted).toContain("Caused by: network down");
    });

    it("should return plain message for non-BaseError", () => {
      const err = new Error("plain error");
      const formatted = formatErrorForUser(err);
      expect(formatted).toBe("plain error");
    });
  });
});
