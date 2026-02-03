/**
 * Tests for logger utility
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as core from '@actions/core';
import { Logger, LogLevel, createLogger, type LogMetadata } from '../../src/utils/logger.js';

// Mock @actions/core
jest.mock('@actions/core');

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with default config', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom config', () => {
      const logger = new Logger({
        level: LogLevel.DEBUG,
        defaultMetadata: { component: 'test' }
      });
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug('Test message');

      expect(core.debug).toHaveBeenCalledWith('Test message');
    });

    it('should log debug message with metadata', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      const metadata: LogMetadata = { component: 'test', operation: 'testOp' };

      logger.debug('Test message', metadata);

      expect(core.debug).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      expect(core.debug).toHaveBeenCalledWith(expect.stringContaining('"component":"test"'));
    });

    it('should not log debug when level is INFO', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.debug('Test message');

      expect(core.debug).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      const logger = new Logger();
      logger.info('Test message');

      expect(core.info).toHaveBeenCalledWith('Test message');
    });

    it('should log info message with metadata', () => {
      const logger = new Logger();
      logger.info('Test message', { component: 'test' });

      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"component":"test"'));
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const logger = new Logger();
      logger.warn('Test warning');

      expect(core.warning).toHaveBeenCalledWith('Test warning');
    });

    it('should log warning with metadata', () => {
      const logger = new Logger();
      logger.warn('Test warning', { severity: 'high' });

      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Test warning'));
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('"severity":"high"'));
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const logger = new Logger();
      logger.error('Test error');

      expect(core.error).toHaveBeenCalledWith('Test error');
    });

    it('should log error with Error object', () => {
      const logger = new Logger();
      const error = new Error('Test error');

      logger.error('Operation failed', error);

      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Operation failed'));
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('"name":"Error"'));
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('"message":"Test error"'));
    });

    it('should log error with metadata', () => {
      const logger = new Logger();
      const error = new Error('Test error');

      logger.error('Operation failed', error, { component: 'test' });

      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Operation failed'));
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('"component":"test"'));
    });
  });

  describe('child', () => {
    it('should create child logger with additional metadata', () => {
      const parent = new Logger();
      const child = parent.child({ component: 'child' });

      child.info('Test message', { operation: 'test' });

      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"component":"child"'));
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"operation":"test"'));
    });

    it('should inherit parent configuration', () => {
      const parent = new Logger({ level: LogLevel.ERROR });
      const child = parent.child({ component: 'child' });

      child.info('Test message');

      // Should not log because level is ERROR
      expect(core.info).not.toHaveBeenCalled();
    });
  });

  describe('startGroup and endGroup', () => {
    it('should start log group', () => {
      const logger = new Logger();
      logger.startGroup('Test Group');

      expect(core.startGroup).toHaveBeenCalledWith('Test Group');
    });

    it('should end log group', () => {
      const logger = new Logger();
      logger.endGroup();

      expect(core.endGroup).toHaveBeenCalled();
    });
  });

  describe('timing', () => {
    it('should log operation timing', () => {
      const logger = new Logger();
      logger.timing('testOperation', 1234);

      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Operation completed: testOperation'));
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"durationMs":1234'));
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"durationSeconds":"1.23"'));
    });

    it('should log timing with metadata', () => {
      const logger = new Logger();
      logger.timing('testOperation', 1234, { component: 'test' });

      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"component":"test"'));
    });
  });

  describe('measure', () => {
    it('should measure successful operation', async () => {
      const logger = new Logger();
      const fn = jest.fn().mockResolvedValue('result');

      const result = await logger.measure('testOperation', fn);

      expect(result).toBe('result');
      expect(core.debug).toHaveBeenCalledWith(expect.stringContaining('Starting operation: testOperation'));
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Operation completed: testOperation'));
    });

    it('should measure failed operation', async () => {
      const logger = new Logger();
      const error = new Error('Operation failed');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(logger.measure('testOperation', fn)).rejects.toThrow('Operation failed');

      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Operation failed: testOperation'));
    });

    it('should measure with metadata', async () => {
      const logger = new Logger();
      const fn = jest.fn().mockResolvedValue('result');

      await logger.measure('testOperation', fn, { component: 'test' });

      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"component":"test"'));
    });
  });
});

describe('createLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create logger with component context', () => {
    const logger = createLogger('testComponent');
    logger.info('Test message');

    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('"component":"testComponent"'));
  });
});

describe('LogLevel filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should respect ERROR level', () => {
    const logger = new Logger({ level: LogLevel.ERROR });

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(core.debug).not.toHaveBeenCalled();
    expect(core.info).not.toHaveBeenCalled();
    expect(core.warning).not.toHaveBeenCalled();
    expect(core.error).toHaveBeenCalled();
  });

  it('should respect WARN level', () => {
    const logger = new Logger({ level: LogLevel.WARN });

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(core.debug).not.toHaveBeenCalled();
    expect(core.info).not.toHaveBeenCalled();
    expect(core.warning).toHaveBeenCalled();
    expect(core.error).toHaveBeenCalled();
  });

  it('should respect DEBUG level', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(core.debug).toHaveBeenCalled();
    expect(core.info).toHaveBeenCalled();
    expect(core.warning).toHaveBeenCalled();
    expect(core.error).toHaveBeenCalled();
  });
});
