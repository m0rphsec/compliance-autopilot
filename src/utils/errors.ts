/**
 * Custom error classes for Compliance Autopilot
 * @module utils/errors
 */

/**
 * Error codes for categorizing failures
 */
export enum ErrorCode {
  // API errors (1xxx)
  API_REQUEST_FAILED = 'API_1001',
  API_RATE_LIMIT = 'API_1002',
  API_UNAUTHORIZED = 'API_1003',
  API_NOT_FOUND = 'API_1004',
  API_INVALID_RESPONSE = 'API_1005',

  // Validation errors (2xxx)
  VALIDATION_FAILED = 'VAL_2001',
  VALIDATION_INVALID_INPUT = 'VAL_2002',
  VALIDATION_MISSING_REQUIRED = 'VAL_2003',
  VALIDATION_INVALID_FORMAT = 'VAL_2004',

  // Compliance errors (3xxx)
  COMPLIANCE_CONTROL_FAILED = 'CMP_3001',
  COMPLIANCE_EVIDENCE_MISSING = 'CMP_3002',
  COMPLIANCE_EVALUATION_ERROR = 'CMP_3003',
  COMPLIANCE_INVALID_FRAMEWORK = 'CMP_3004',
  COMPLIANCE_REPORT_GENERATION = 'CMP_3005',

  // Configuration errors (4xxx)
  CONFIG_INVALID = 'CFG_4001',
  CONFIG_MISSING = 'CFG_4002',
  CONFIG_PARSE_ERROR = 'CFG_4003',

  // System errors (5xxx)
  SYSTEM_INTERNAL_ERROR = 'SYS_5001',
  SYSTEM_TIMEOUT = 'SYS_5002',
  SYSTEM_RESOURCE_EXHAUSTED = 'SYS_5003',
}

/**
 * Base error class with error code support
 */
export abstract class BaseError extends Error {
  /** Error code for categorization */
  public readonly code: ErrorCode;

  /** HTTP status code (for API errors) */
  public readonly statusCode?: number;

  /** Additional error context */
  public readonly context?: Record<string, unknown>;

  /** Original error that caused this error */
  public readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      statusCode?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = options?.statusCode;
    this.context = options?.context;
    this.cause = options?.cause;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }
}

/**
 * API-related errors
 */
export class APIError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.API_REQUEST_FAILED,
    options?: {
      statusCode?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, code, options);
  }

  static rateLimitExceeded(resetTime?: Date): APIError {
    return new APIError('GitHub API rate limit exceeded', ErrorCode.API_RATE_LIMIT, {
      statusCode: 429,
      context: { resetTime: resetTime?.toISOString() },
    });
  }

  static unauthorized(reason?: string): APIError {
    return new APIError(
      `Authentication failed${reason ? ': ' + reason : ''}`,
      ErrorCode.API_UNAUTHORIZED,
      { statusCode: 401, context: { reason } },
    );
  }

  static notFound(resource: string): APIError {
    return new APIError('Resource not found: ' + resource, ErrorCode.API_NOT_FOUND, {
      statusCode: 404,
      context: { resource },
    });
  }

  static invalidResponse(reason: string): APIError {
    return new APIError('Invalid API response: ' + reason, ErrorCode.API_INVALID_RESPONSE, {
      statusCode: 500,
      context: { reason },
    });
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends BaseError {
  public readonly field?: string;
  public readonly expected?: string;
  public readonly received?: unknown;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.VALIDATION_FAILED,
    options?: {
      field?: string;
      expected?: string;
      received?: unknown;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, code, {
      statusCode: 400,
      context: {
        ...options?.context,
        field: options?.field,
        expected: options?.expected,
        received: options?.received,
      },
      cause: options?.cause,
    });

    this.field = options?.field;
    this.expected = options?.expected;
    this.received = options?.received;
  }

  static missingRequired(field: string): ValidationError {
    return new ValidationError(
      'Missing required field: ' + field,
      ErrorCode.VALIDATION_MISSING_REQUIRED,
      { field, expected: 'non-empty value' },
    );
  }

  static invalidFormat(
    field: string,
    expected: string,
    received: unknown,
  ): ValidationError {
    return new ValidationError(
      "Invalid format for field '" + field + "': expected " + expected,
      ErrorCode.VALIDATION_INVALID_FORMAT,
      { field, expected, received },
    );
  }

  static invalidInput(message: string, field?: string): ValidationError {
    return new ValidationError(message, ErrorCode.VALIDATION_INVALID_INPUT, { field });
  }
}

/**
 * Compliance-related errors
 */
export class ComplianceError extends BaseError {
  public readonly controlId?: string;
  public readonly framework?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.COMPLIANCE_EVALUATION_ERROR,
    options?: {
      controlId?: string;
      framework?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, code, {
      context: {
        ...options?.context,
        controlId: options?.controlId,
        framework: options?.framework,
      },
      cause: options?.cause,
    });

    this.controlId = options?.controlId;
    this.framework = options?.framework;
  }

  static controlFailed(controlId: string, reason: string): ComplianceError {
    return new ComplianceError(
      'Control ' + controlId + ' failed: ' + reason,
      ErrorCode.COMPLIANCE_CONTROL_FAILED,
      { controlId, context: { reason } },
    );
  }

  static evidenceMissing(controlId: string, evidenceType: string): ComplianceError {
    return new ComplianceError(
      'Missing required evidence for control ' + controlId + ': ' + evidenceType,
      ErrorCode.COMPLIANCE_EVIDENCE_MISSING,
      { controlId, context: { evidenceType } },
    );
  }

  static invalidFramework(framework: string): ComplianceError {
    return new ComplianceError(
      'Invalid compliance framework: ' + framework,
      ErrorCode.COMPLIANCE_INVALID_FRAMEWORK,
      { framework },
    );
  }

  static reportGenerationFailed(reason: string, cause?: Error): ComplianceError {
    return new ComplianceError(
      'Failed to generate compliance report: ' + reason,
      ErrorCode.COMPLIANCE_REPORT_GENERATION,
      { context: { reason }, cause },
    );
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CONFIG_INVALID,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, code, options);
  }

  static missing(configName: string): ConfigError {
    return new ConfigError(
      'Missing required configuration: ' + configName,
      ErrorCode.CONFIG_MISSING,
      { context: { configName } },
    );
  }

  static parseError(reason: string, cause?: Error): ConfigError {
    return new ConfigError(
      'Failed to parse configuration: ' + reason,
      ErrorCode.CONFIG_PARSE_ERROR,
      { context: { reason }, cause },
    );
  }
}

export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isComplianceError(error: unknown): error is ComplianceError {
  return error instanceof ComplianceError;
}

export function isConfigError(error: unknown): error is ConfigError {
  return error instanceof ConfigError;
}

/**
 * GitHub-specific error classes
 */
export class GitHubAPIError extends APIError {
  public readonly url?: string;

  constructor(message: string, statusCode?: number, url?: string, cause?: Error) {
    super(message, ErrorCode.API_REQUEST_FAILED, {
      statusCode,
      context: { url },
      cause,
    });
    this.url = url;
  }
}

export class RateLimitError extends APIError {
  public readonly resetTime: Date;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(message: string, resetTime: Date, limit = 5000, remaining = 0) {
    super(message, ErrorCode.API_RATE_LIMIT, {
      statusCode: 429,
      context: {
        resetTime: resetTime.toISOString(),
        limit,
        remaining,
      },
    });
    this.resetTime = resetTime;
    this.limit = limit;
    this.remaining = remaining;
  }
}

export class PermissionError extends APIError {
  public readonly requiredScopes: string[];

  constructor(message: string, requiredScopes: string[] = []) {
    super(message, ErrorCode.API_UNAUTHORIZED, {
      statusCode: 403,
      context: { requiredScopes },
    });
    this.requiredScopes = requiredScopes;
  }
}

export class EvidenceCollectionError extends ComplianceError {
  constructor(message: string, controlId?: string) {
    super(message, ErrorCode.COMPLIANCE_EVIDENCE_MISSING, {
      controlId,
    });
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  if (error instanceof GitHubAPIError) {
    return error.statusCode ? error.statusCode >= 500 : false;
  }
  return false;
}

/**
 * Get retry delay for an error
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  if (error instanceof RateLimitError) {
    const now = Date.now();
    const resetTime = error.resetTime.getTime();
    return Math.max(resetTime - now, 1000);
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

/**
 * Format error for user-friendly display
 */
export function formatErrorForUser(error: Error): string {
  if (error instanceof BaseError) {
    let message = `[${error.code}] ${error.message}`;

    if (error instanceof GitHubAPIError && error.url) {
      message += `\nURL: ${error.url}`;
    }

    if (error instanceof RateLimitError) {
      message += `\nRate limit will reset at: ${error.resetTime.toISOString()}`;
    }

    if (error.cause) {
      message += `\nCaused by: ${error.cause.message}`;
    }

    return message;
  }

  return error.message;
}
