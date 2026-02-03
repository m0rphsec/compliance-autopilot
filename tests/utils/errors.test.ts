/**
 * Tests for custom error classes
 */

import { describe, it, expect } from '@jest/globals';
import {
  ErrorCode,
  BaseError,
  APIError,
  ValidationError,
  ComplianceError,
  ConfigError,
  isBaseError,
  isAPIError,
  isValidationError,
  isComplianceError,
  isConfigError
} from '../../src/utils/errors.js';

describe('ErrorCode', () => {
  it('should have API error codes', () => {
    expect(ErrorCode.API_REQUEST_FAILED).toBe('API_1001');
    expect(ErrorCode.API_RATE_LIMIT).toBe('API_1002');
    expect(ErrorCode.API_UNAUTHORIZED).toBe('API_1003');
  });

  it('should have validation error codes', () => {
    expect(ErrorCode.VALIDATION_FAILED).toBe('VAL_2001');
    expect(ErrorCode.VALIDATION_INVALID_INPUT).toBe('VAL_2002');
  });

  it('should have compliance error codes', () => {
    expect(ErrorCode.COMPLIANCE_CONTROL_FAILED).toBe('CMP_3001');
    expect(ErrorCode.COMPLIANCE_EVIDENCE_MISSING).toBe('CMP_3002');
  });
});

describe('APIError', () => {
  it('should create basic API error', () => {
    const error = new APIError('Request failed');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('Request failed');
    expect(error.code).toBe(ErrorCode.API_REQUEST_FAILED);
    expect(error.name).toBe('APIError');
  });

  it('should create API error with status code', () => {
    const error = new APIError('Not found', ErrorCode.API_NOT_FOUND, {
      statusCode: 404
    });

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
  });

  it('should create API error with context', () => {
    const error = new APIError('Request failed', ErrorCode.API_REQUEST_FAILED, {
      context: { endpoint: '/api/test' }
    });

    expect(error.context).toEqual({ endpoint: '/api/test' });
  });

  it('should create rate limit error', () => {
    const resetTime = new Date('2024-01-01T12:00:00Z');
    const error = APIError.rateLimitExceeded(resetTime);

    expect(error.message).toContain('rate limit exceeded');
    expect(error.code).toBe(ErrorCode.API_RATE_LIMIT);
    expect(error.statusCode).toBe(429);
    expect(error.context?.resetTime).toBe(resetTime.toISOString());
  });

  it('should create unauthorized error', () => {
    const error = APIError.unauthorized('Invalid token');

    expect(error.message).toContain('Authentication failed');
    expect(error.code).toBe(ErrorCode.API_UNAUTHORIZED);
    expect(error.statusCode).toBe(401);
  });

  it('should create not found error', () => {
    const error = APIError.notFound('repository');

    expect(error.message).toContain('repository');
    expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it('should serialize to JSON', () => {
    const error = new APIError('Test error', ErrorCode.API_REQUEST_FAILED, {
      statusCode: 500,
      context: { test: true }
    });

    const json = error.toJSON();

    expect(json.name).toBe('APIError');
    expect(json.message).toBe('Test error');
    expect(json.code).toBe(ErrorCode.API_REQUEST_FAILED);
    expect(json.statusCode).toBe(500);
    expect(json.context).toEqual({ test: true });
  });
});

describe('ValidationError', () => {
  it('should create basic validation error', () => {
    const error = new ValidationError('Validation failed');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.statusCode).toBe(400);
  });

  it('should create validation error with field info', () => {
    const error = new ValidationError('Invalid email', ErrorCode.VALIDATION_INVALID_FORMAT, {
      field: 'email',
      expected: 'email format',
      received: 'not-an-email'
    });

    expect(error.field).toBe('email');
    expect(error.expected).toBe('email format');
    expect(error.received).toBe('not-an-email');
  });

  it('should create missing required error', () => {
    const error = ValidationError.missingRequired('username');

    expect(error.message).toContain('username');
    expect(error.code).toBe(ErrorCode.VALIDATION_MISSING_REQUIRED);
    expect(error.field).toBe('username');
  });

  it('should create invalid format error', () => {
    const error = ValidationError.invalidFormat('date', 'ISO 8601', '2024-13-45');

    expect(error.message).toContain('date');
    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
    expect(error.field).toBe('date');
    expect(error.expected).toBe('ISO 8601');
    expect(error.received).toBe('2024-13-45');
  });

  it('should create invalid input error', () => {
    const error = ValidationError.invalidInput('Invalid age value', 'age');

    expect(error.message).toBe('Invalid age value');
    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID_INPUT);
    expect(error.field).toBe('age');
  });
});

describe('ComplianceError', () => {
  it('should create basic compliance error', () => {
    const error = new ComplianceError('Compliance check failed');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ComplianceError);
    expect(error.message).toBe('Compliance check failed');
    expect(error.code).toBe(ErrorCode.COMPLIANCE_EVALUATION_ERROR);
  });

  it('should create compliance error with control info', () => {
    const error = new ComplianceError('Control failed', ErrorCode.COMPLIANCE_CONTROL_FAILED, {
      controlId: 'CC6.1',
      framework: 'SOC2'
    });

    expect(error.controlId).toBe('CC6.1');
    expect(error.framework).toBe('SOC2');
  });

  it('should create control failed error', () => {
    const error = ComplianceError.controlFailed('CC6.1', 'No branch protection');

    expect(error.message).toContain('CC6.1');
    expect(error.code).toBe(ErrorCode.COMPLIANCE_CONTROL_FAILED);
    expect(error.controlId).toBe('CC6.1');
  });

  it('should create evidence missing error', () => {
    const error = ComplianceError.evidenceMissing('CC7.2', 'security_scan');

    expect(error.message).toContain('CC7.2');
    expect(error.message).toContain('security_scan');
    expect(error.code).toBe(ErrorCode.COMPLIANCE_EVIDENCE_MISSING);
    expect(error.controlId).toBe('CC7.2');
  });

  it('should create invalid framework error', () => {
    const error = ComplianceError.invalidFramework('INVALID');

    expect(error.message).toContain('INVALID');
    expect(error.code).toBe(ErrorCode.COMPLIANCE_INVALID_FRAMEWORK);
    expect(error.framework).toBe('INVALID');
  });

  it('should create report generation error', () => {
    const cause = new Error('Database error');
    const error = ComplianceError.reportGenerationFailed('Failed to save', cause);

    expect(error.message).toContain('Failed to save');
    expect(error.code).toBe(ErrorCode.COMPLIANCE_REPORT_GENERATION);
    expect(error.cause).toBe(cause);
  });
});

describe('ConfigError', () => {
  it('should create basic config error', () => {
    const error = new ConfigError('Invalid configuration');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Invalid configuration');
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
  });

  it('should create missing config error', () => {
    const error = ConfigError.missing('api-key');

    expect(error.message).toContain('api-key');
    expect(error.code).toBe(ErrorCode.CONFIG_MISSING);
  });

  it('should create parse error', () => {
    const cause = new Error('Invalid JSON');
    const error = ConfigError.parseError('Malformed JSON', cause);

    expect(error.message).toContain('Malformed JSON');
    expect(error.code).toBe(ErrorCode.CONFIG_PARSE_ERROR);
    expect(error.cause).toBe(cause);
  });
});

describe('Error type guards', () => {
  it('should identify BaseError', () => {
    const error = new APIError('Test');
    expect(isBaseError(error)).toBe(true);
    expect(isBaseError(new Error('Test'))).toBe(false);
  });

  it('should identify APIError', () => {
    const error = new APIError('Test');
    expect(isAPIError(error)).toBe(true);
    expect(isAPIError(new ValidationError('Test'))).toBe(false);
  });

  it('should identify ValidationError', () => {
    const error = new ValidationError('Test');
    expect(isValidationError(error)).toBe(true);
    expect(isValidationError(new APIError('Test'))).toBe(false);
  });

  it('should identify ComplianceError', () => {
    const error = new ComplianceError('Test');
    expect(isComplianceError(error)).toBe(true);
    expect(isComplianceError(new APIError('Test'))).toBe(false);
  });

  it('should identify ConfigError', () => {
    const error = new ConfigError('Test');
    expect(isConfigError(error)).toBe(true);
    expect(isConfigError(new APIError('Test'))).toBe(false);
  });
});

describe('Error chaining', () => {
  it('should chain errors with cause', () => {
    const rootCause = new Error('Root cause');
    const wrappedError = new ComplianceError(
      'Wrapped error',
      ErrorCode.COMPLIANCE_EVALUATION_ERROR,
      { cause: rootCause }
    );

    expect(wrappedError.cause).toBe(rootCause);
    expect(wrappedError.toJSON().cause).toBeDefined();
  });
});
