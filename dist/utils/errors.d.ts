/**
 * Custom error classes for Compliance Autopilot
 * @module utils/errors
 */
/**
 * Error codes for categorizing failures
 */
export declare enum ErrorCode {
    API_REQUEST_FAILED = "API_1001",
    API_RATE_LIMIT = "API_1002",
    API_UNAUTHORIZED = "API_1003",
    API_NOT_FOUND = "API_1004",
    API_INVALID_RESPONSE = "API_1005",
    VALIDATION_FAILED = "VAL_2001",
    VALIDATION_INVALID_INPUT = "VAL_2002",
    VALIDATION_MISSING_REQUIRED = "VAL_2003",
    VALIDATION_INVALID_FORMAT = "VAL_2004",
    COMPLIANCE_CONTROL_FAILED = "CMP_3001",
    COMPLIANCE_EVIDENCE_MISSING = "CMP_3002",
    COMPLIANCE_EVALUATION_ERROR = "CMP_3003",
    COMPLIANCE_INVALID_FRAMEWORK = "CMP_3004",
    COMPLIANCE_REPORT_GENERATION = "CMP_3005",
    CONFIG_INVALID = "CFG_4001",
    CONFIG_MISSING = "CFG_4002",
    CONFIG_PARSE_ERROR = "CFG_4003",
    SYSTEM_INTERNAL_ERROR = "SYS_5001",
    SYSTEM_TIMEOUT = "SYS_5002",
    SYSTEM_RESOURCE_EXHAUSTED = "SYS_5003"
}
/**
 * Base error class with error code support
 */
export declare abstract class BaseError extends Error {
    /** Error code for categorization */
    readonly code: ErrorCode;
    /** HTTP status code (for API errors) */
    readonly statusCode?: number;
    /** Additional error context */
    readonly context?: Record<string, unknown>;
    /** Original error that caused this error */
    readonly cause?: Error;
    constructor(message: string, code: ErrorCode, options?: {
        statusCode?: number;
        context?: Record<string, unknown>;
        cause?: Error;
    });
    /**
     * Convert error to JSON representation
     */
    toJSON(): Record<string, unknown>;
}
/**
 * API-related errors
 */
export declare class APIError extends BaseError {
    constructor(message: string, code?: ErrorCode, options?: {
        statusCode?: number;
        context?: Record<string, unknown>;
        cause?: Error;
    });
    static rateLimitExceeded(resetTime?: Date): APIError;
    static unauthorized(reason?: string): APIError;
    static notFound(resource: string): APIError;
    static invalidResponse(reason: string): APIError;
}
/**
 * Validation-related errors
 */
export declare class ValidationError extends BaseError {
    readonly field?: string;
    readonly expected?: string;
    readonly received?: unknown;
    constructor(message: string, code?: ErrorCode, options?: {
        field?: string;
        expected?: string;
        received?: unknown;
        context?: Record<string, unknown>;
        cause?: Error;
    });
    static missingRequired(field: string): ValidationError;
    static invalidFormat(field: string, expected: string, received: unknown): ValidationError;
    static invalidInput(message: string, field?: string): ValidationError;
}
/**
 * Compliance-related errors
 */
export declare class ComplianceError extends BaseError {
    readonly controlId?: string;
    readonly framework?: string;
    constructor(message: string, code?: ErrorCode, options?: {
        controlId?: string;
        framework?: string;
        context?: Record<string, unknown>;
        cause?: Error;
    });
    static controlFailed(controlId: string, reason: string): ComplianceError;
    static evidenceMissing(controlId: string, evidenceType: string): ComplianceError;
    static invalidFramework(framework: string): ComplianceError;
    static reportGenerationFailed(reason: string, cause?: Error): ComplianceError;
}
/**
 * Configuration-related errors
 */
export declare class ConfigError extends BaseError {
    constructor(message: string, code?: ErrorCode, options?: {
        context?: Record<string, unknown>;
        cause?: Error;
    });
    static missing(configName: string): ConfigError;
    static parseError(reason: string, cause?: Error): ConfigError;
}
export declare function isBaseError(error: unknown): error is BaseError;
export declare function isAPIError(error: unknown): error is APIError;
export declare function isValidationError(error: unknown): error is ValidationError;
export declare function isComplianceError(error: unknown): error is ComplianceError;
export declare function isConfigError(error: unknown): error is ConfigError;
/**
 * GitHub-specific error classes
 */
export declare class GitHubAPIError extends APIError {
    readonly url?: string;
    constructor(message: string, statusCode?: number, url?: string, cause?: Error);
}
export declare class RateLimitError extends APIError {
    readonly resetTime: Date;
    readonly limit: number;
    readonly remaining: number;
    constructor(message: string, resetTime: Date, limit?: number, remaining?: number);
}
export declare class PermissionError extends APIError {
    readonly requiredScopes: string[];
    constructor(message: string, requiredScopes?: string[]);
}
export declare class EvidenceCollectionError extends ComplianceError {
    constructor(message: string, controlId?: string);
}
/**
 * Check if error is retryable
 */
export declare function isRetryableError(error: unknown): boolean;
/**
 * Get retry delay for an error
 */
export declare function getRetryDelay(error: unknown, attempt: number): number;
/**
 * Format error for user-friendly display
 */
export declare function formatErrorForUser(error: Error): string;
//# sourceMappingURL=errors.d.ts.map