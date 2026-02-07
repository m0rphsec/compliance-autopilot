/**
 * Structured logging utility using @actions/core
 * @module utils/logger
 */
/**
 * Log levels for structured logging
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
/**
 * Structured log entry metadata
 */
export interface LogMetadata {
    /** Component or module name */
    component?: string;
    /** Operation or function name */
    operation?: string;
    /** Request/correlation ID */
    correlationId?: string;
    /** Additional context data */
    [key: string]: unknown;
}
/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Minimum log level to output */
    level?: LogLevel;
    /** Whether to include timestamps (GitHub Actions adds these automatically) */
    includeTimestamp?: boolean;
    /** Default metadata to include in all logs */
    defaultMetadata?: LogMetadata;
}
/**
 * Structured logger implementation
 */
export declare class Logger {
    private config;
    constructor(config?: LoggerConfig);
    /**
     * Check if a log level should be output
     */
    private shouldLog;
    /**
     * Format log message with metadata
     */
    private formatMessage;
    /**
     * Log debug message
     * @param message - Log message
     * @param metadata - Optional structured metadata
     */
    debug(message: string, metadata?: LogMetadata): void;
    /**
     * Log info message
     * @param message - Log message
     * @param metadata - Optional structured metadata
     */
    info(message: string, metadata?: LogMetadata): void;
    /**
     * Log warning message
     * @param message - Log message
     * @param metadata - Optional structured metadata
     */
    warn(message: string, metadata?: LogMetadata): void;
    /**
     * Log error message
     * @param message - Log message
     * @param error - Optional error object
     * @param metadata - Optional structured metadata
     */
    error(message: string, error?: Error, metadata?: LogMetadata): void;
    /**
     * Create a child logger with additional default metadata
     * @param metadata - Additional metadata to include in all logs
     */
    child(metadata: LogMetadata): Logger;
    /**
     * Start a log group (collapsible in GitHub Actions UI)
     * @param name - Group name
     */
    startGroup(name: string): void;
    /**
     * End a log group
     */
    endGroup(): void;
    /**
     * Log operation timing
     * @param operation - Operation name
     * @param durationMs - Duration in milliseconds
     * @param metadata - Optional metadata
     */
    timing(operation: string, durationMs: number, metadata?: LogMetadata): void;
    /**
     * Measure and log operation execution time
     * @param operation - Operation name
     * @param fn - Function to measure
     * @param metadata - Optional metadata
     * @returns Function result
     */
    measure<T>(operation: string, fn: () => Promise<T>, metadata?: LogMetadata): Promise<T>;
}
/**
 * Default logger instance
 */
export declare const logger: Logger;
/**
 * Create a logger with component context
 * @param component - Component name
 * @returns Logger instance with component metadata
 */
export declare function createLogger(component: string): Logger;
//# sourceMappingURL=logger.d.ts.map