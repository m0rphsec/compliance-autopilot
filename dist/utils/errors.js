"use strict";
/**
 * Custom error classes for Compliance Autopilot
 * @module utils/errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceCollectionError = exports.PermissionError = exports.RateLimitError = exports.GitHubAPIError = exports.ConfigError = exports.ComplianceError = exports.ValidationError = exports.APIError = exports.BaseError = exports.ErrorCode = void 0;
exports.isBaseError = isBaseError;
exports.isAPIError = isAPIError;
exports.isValidationError = isValidationError;
exports.isComplianceError = isComplianceError;
exports.isConfigError = isConfigError;
exports.isRetryableError = isRetryableError;
exports.getRetryDelay = getRetryDelay;
exports.formatErrorForUser = formatErrorForUser;
/**
 * Error codes for categorizing failures
 */
var ErrorCode;
(function (ErrorCode) {
    // API errors (1xxx)
    ErrorCode["API_REQUEST_FAILED"] = "API_1001";
    ErrorCode["API_RATE_LIMIT"] = "API_1002";
    ErrorCode["API_UNAUTHORIZED"] = "API_1003";
    ErrorCode["API_NOT_FOUND"] = "API_1004";
    ErrorCode["API_INVALID_RESPONSE"] = "API_1005";
    // Validation errors (2xxx)
    ErrorCode["VALIDATION_FAILED"] = "VAL_2001";
    ErrorCode["VALIDATION_INVALID_INPUT"] = "VAL_2002";
    ErrorCode["VALIDATION_MISSING_REQUIRED"] = "VAL_2003";
    ErrorCode["VALIDATION_INVALID_FORMAT"] = "VAL_2004";
    // Compliance errors (3xxx)
    ErrorCode["COMPLIANCE_CONTROL_FAILED"] = "CMP_3001";
    ErrorCode["COMPLIANCE_EVIDENCE_MISSING"] = "CMP_3002";
    ErrorCode["COMPLIANCE_EVALUATION_ERROR"] = "CMP_3003";
    ErrorCode["COMPLIANCE_INVALID_FRAMEWORK"] = "CMP_3004";
    ErrorCode["COMPLIANCE_REPORT_GENERATION"] = "CMP_3005";
    // Configuration errors (4xxx)
    ErrorCode["CONFIG_INVALID"] = "CFG_4001";
    ErrorCode["CONFIG_MISSING"] = "CFG_4002";
    ErrorCode["CONFIG_PARSE_ERROR"] = "CFG_4003";
    // System errors (5xxx)
    ErrorCode["SYSTEM_INTERNAL_ERROR"] = "SYS_5001";
    ErrorCode["SYSTEM_TIMEOUT"] = "SYS_5002";
    ErrorCode["SYSTEM_RESOURCE_EXHAUSTED"] = "SYS_5003";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Base error class with error code support
 */
class BaseError extends Error {
    /** Error code for categorization */
    code;
    /** HTTP status code (for API errors) */
    statusCode;
    /** Additional error context */
    context;
    /** Original error that caused this error */
    cause;
    constructor(message, code, options) {
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
    toJSON() {
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
exports.BaseError = BaseError;
/**
 * API-related errors
 */
class APIError extends BaseError {
    constructor(message, code = ErrorCode.API_REQUEST_FAILED, options) {
        super(message, code, options);
    }
    static rateLimitExceeded(resetTime) {
        return new APIError('GitHub API rate limit exceeded', ErrorCode.API_RATE_LIMIT, {
            statusCode: 429,
            context: { resetTime: resetTime?.toISOString() },
        });
    }
    static unauthorized(reason) {
        return new APIError(`Authentication failed${reason ? ': ' + reason : ''}`, ErrorCode.API_UNAUTHORIZED, { statusCode: 401, context: { reason } });
    }
    static notFound(resource) {
        return new APIError('Resource not found: ' + resource, ErrorCode.API_NOT_FOUND, {
            statusCode: 404,
            context: { resource },
        });
    }
    static invalidResponse(reason) {
        return new APIError('Invalid API response: ' + reason, ErrorCode.API_INVALID_RESPONSE, {
            statusCode: 500,
            context: { reason },
        });
    }
}
exports.APIError = APIError;
/**
 * Validation-related errors
 */
class ValidationError extends BaseError {
    field;
    expected;
    received;
    constructor(message, code = ErrorCode.VALIDATION_FAILED, options) {
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
    static missingRequired(field) {
        return new ValidationError('Missing required field: ' + field, ErrorCode.VALIDATION_MISSING_REQUIRED, { field, expected: 'non-empty value' });
    }
    static invalidFormat(field, expected, received) {
        return new ValidationError("Invalid format for field '" + field + "': expected " + expected, ErrorCode.VALIDATION_INVALID_FORMAT, { field, expected, received });
    }
    static invalidInput(message, field) {
        return new ValidationError(message, ErrorCode.VALIDATION_INVALID_INPUT, { field });
    }
}
exports.ValidationError = ValidationError;
/**
 * Compliance-related errors
 */
class ComplianceError extends BaseError {
    controlId;
    framework;
    constructor(message, code = ErrorCode.COMPLIANCE_EVALUATION_ERROR, options) {
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
    static controlFailed(controlId, reason) {
        return new ComplianceError('Control ' + controlId + ' failed: ' + reason, ErrorCode.COMPLIANCE_CONTROL_FAILED, { controlId, context: { reason } });
    }
    static evidenceMissing(controlId, evidenceType) {
        return new ComplianceError('Missing required evidence for control ' + controlId + ': ' + evidenceType, ErrorCode.COMPLIANCE_EVIDENCE_MISSING, { controlId, context: { evidenceType } });
    }
    static invalidFramework(framework) {
        return new ComplianceError('Invalid compliance framework: ' + framework, ErrorCode.COMPLIANCE_INVALID_FRAMEWORK, { framework });
    }
    static reportGenerationFailed(reason, cause) {
        return new ComplianceError('Failed to generate compliance report: ' + reason, ErrorCode.COMPLIANCE_REPORT_GENERATION, { context: { reason }, cause });
    }
}
exports.ComplianceError = ComplianceError;
/**
 * Configuration-related errors
 */
class ConfigError extends BaseError {
    constructor(message, code = ErrorCode.CONFIG_INVALID, options) {
        super(message, code, options);
    }
    static missing(configName) {
        return new ConfigError('Missing required configuration: ' + configName, ErrorCode.CONFIG_MISSING, { context: { configName } });
    }
    static parseError(reason, cause) {
        return new ConfigError('Failed to parse configuration: ' + reason, ErrorCode.CONFIG_PARSE_ERROR, { context: { reason }, cause });
    }
}
exports.ConfigError = ConfigError;
function isBaseError(error) {
    return error instanceof BaseError;
}
function isAPIError(error) {
    return error instanceof APIError;
}
function isValidationError(error) {
    return error instanceof ValidationError;
}
function isComplianceError(error) {
    return error instanceof ComplianceError;
}
function isConfigError(error) {
    return error instanceof ConfigError;
}
/**
 * GitHub-specific error classes
 */
class GitHubAPIError extends APIError {
    url;
    constructor(message, statusCode, url, cause) {
        super(message, ErrorCode.API_REQUEST_FAILED, {
            statusCode,
            context: { url },
            cause,
        });
        this.url = url;
    }
}
exports.GitHubAPIError = GitHubAPIError;
class RateLimitError extends APIError {
    resetTime;
    limit;
    remaining;
    constructor(message, resetTime, limit = 5000, remaining = 0) {
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
exports.RateLimitError = RateLimitError;
class PermissionError extends APIError {
    requiredScopes;
    constructor(message, requiredScopes = []) {
        super(message, ErrorCode.API_UNAUTHORIZED, {
            statusCode: 403,
            context: { requiredScopes },
        });
        this.requiredScopes = requiredScopes;
    }
}
exports.PermissionError = PermissionError;
class EvidenceCollectionError extends ComplianceError {
    constructor(message, controlId) {
        super(message, ErrorCode.COMPLIANCE_EVIDENCE_MISSING, {
            controlId,
        });
    }
}
exports.EvidenceCollectionError = EvidenceCollectionError;
/**
 * Check if error is retryable
 */
function isRetryableError(error) {
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
function getRetryDelay(error, attempt) {
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
function formatErrorForUser(error) {
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
//# sourceMappingURL=errors.js.map