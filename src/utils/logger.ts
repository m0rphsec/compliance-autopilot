/**
 * Structured logging utility using @actions/core
 * @module utils/logger
 */

import * as core from '@actions/core';

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
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
export class Logger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      includeTimestamp: config.includeTimestamp ?? false,
      defaultMetadata: config.defaultMetadata ?? {},
    };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log message with metadata
   */
  private formatMessage(message: string, metadata?: LogMetadata): string {
    const combinedMetadata = { ...this.config.defaultMetadata, ...metadata };

    if (Object.keys(combinedMetadata).length === 0) {
      return message;
    }

    const metadataStr = JSON.stringify(combinedMetadata);
    return `${message} ${metadataStr}`;
  }

  /**
   * Log debug message
   * @param message - Log message
   * @param metadata - Optional structured metadata
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage(message, metadata);
      core.debug(formatted);
    }
  }

  /**
   * Log info message
   * @param message - Log message
   * @param metadata - Optional structured metadata
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage(message, metadata);
      core.info(formatted);
    }
  }

  /**
   * Log warning message
   * @param message - Log message
   * @param metadata - Optional structured metadata
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage(message, metadata);
      core.warning(formatted);
    }
  }

  /**
   * Log error message
   * @param message - Log message
   * @param error - Optional error object
   * @param metadata - Optional structured metadata
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMetadata = error
        ? {
            ...metadata,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : metadata;

      const formatted = this.formatMessage(message, errorMetadata);
      core.error(formatted);
    }
  }

  /**
   * Create a child logger with additional default metadata
   * @param metadata - Additional metadata to include in all logs
   */
  child(metadata: LogMetadata): Logger {
    return new Logger({
      ...this.config,
      defaultMetadata: {
        ...this.config.defaultMetadata,
        ...metadata,
      },
    });
  }

  /**
   * Start a log group (collapsible in GitHub Actions UI)
   * @param name - Group name
   */
  startGroup(name: string): void {
    core.startGroup(name);
  }

  /**
   * End a log group
   */
  endGroup(): void {
    core.endGroup();
  }

  /**
   * Log operation timing
   * @param operation - Operation name
   * @param durationMs - Duration in milliseconds
   * @param metadata - Optional metadata
   */
  timing(operation: string, durationMs: number, metadata?: LogMetadata): void {
    this.info(`Operation completed: ${operation}`, {
      ...metadata,
      operation,
      durationMs,
      durationSeconds: (durationMs / 1000).toFixed(2),
    });
  }

  /**
   * Measure and log operation execution time
   * @param operation - Operation name
   * @param fn - Function to measure
   * @param metadata - Optional metadata
   * @returns Function result
   */
  async measure<T>(operation: string, fn: () => Promise<T>, metadata?: LogMetadata): Promise<T> {
    const startTime = Date.now();
    this.debug(`Starting operation: ${operation}`, { ...metadata, operation });

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.timing(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(
        `Operation failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        { ...metadata, operation, durationMs: duration }
      );
      throw error;
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) ?? LogLevel.INFO,
});

/**
 * Create a logger with component context
 * @param component - Component name
 * @returns Logger instance with component metadata
 */
export function createLogger(component: string): Logger {
  return logger.child({ component });
}
