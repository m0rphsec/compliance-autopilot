"use strict";
/**
 * Structured logging utility using @actions/core
 * @module utils/logger
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
exports.logger = exports.Logger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
const core = __importStar(require("@actions/core"));
/**
 * Log levels for structured logging
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Structured logger implementation
 */
class Logger {
    config;
    constructor(config = {}) {
        this.config = {
            level: config.level ?? LogLevel.INFO,
            includeTimestamp: config.includeTimestamp ?? false,
            defaultMetadata: config.defaultMetadata ?? {},
        };
    }
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    /**
     * Format log message with metadata
     */
    formatMessage(message, metadata) {
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
    debug(message, metadata) {
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
    info(message, metadata) {
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
    warn(message, metadata) {
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
    error(message, error, metadata) {
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
    child(metadata) {
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
    startGroup(name) {
        core.startGroup(name);
    }
    /**
     * End a log group
     */
    endGroup() {
        core.endGroup();
    }
    /**
     * Log operation timing
     * @param operation - Operation name
     * @param durationMs - Duration in milliseconds
     * @param metadata - Optional metadata
     */
    timing(operation, durationMs, metadata) {
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
    async measure(operation, fn, metadata) {
        const startTime = Date.now();
        this.debug(`Starting operation: ${operation}`, { ...metadata, operation });
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            this.timing(operation, duration, metadata);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.error(`Operation failed: ${operation}`, error instanceof Error ? error : new Error(String(error)), { ...metadata, operation, durationMs: duration });
            throw error;
        }
    }
}
exports.Logger = Logger;
/**
 * Default logger instance
 */
exports.logger = new Logger({
    level: process.env.LOG_LEVEL ?? LogLevel.INFO,
});
/**
 * Create a logger with component context
 * @param component - Component name
 * @returns Logger instance with component metadata
 */
function createLogger(component) {
    return exports.logger.child({ component });
}
//# sourceMappingURL=logger.js.map