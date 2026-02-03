/**
 * JSON Formatter for Compliance Evidence
 * Provides structured JSON output for programmatic access
 */

import { ComplianceData, ControlResult, Violation } from './pdf-generator';

interface JSONSchema {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

interface FormattedOutput {
  metadata: {
    version: string;
    generator: string;
    generatedAt: string;
  };
  framework: string;
  timestamp: string;
  repository: {
    name: string;
    owner: string;
  };
  compliance: {
    overallScore: number;
    status: string;
    grade: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    notApplicable: number;
    passRate: number;
  };
  controls: Array<{
    id: string;
    name: string;
    status: string;
    evidence: string;
    severity: string;
    violations?: Array<{
      file: string;
      line: number;
      code: string;
      recommendation: string;
    }>;
  }>;
}

/**
 * JSON formatter for compliance evidence
 */
export class JSONFormatter {
  private readonly version = '1.0.0';

  /**
   * Format compliance data as JSON string
   * @param data Compliance scan results
   * @returns JSON string
   */
  format(data: ComplianceData): string {
    this.validateData(data);
    const formatted = this.formatData(data);
    return JSON.stringify(formatted);
  }

  /**
   * Format compliance data as pretty-printed JSON
   * @param data Compliance scan results
   * @returns Formatted JSON string with indentation
   */
  formatPretty(data: ComplianceData): string {
    this.validateData(data);
    const formatted = this.formatData(data);
    return JSON.stringify(formatted, null, 2);
  }

  /**
   * Get JSON schema for compliance data
   * @returns JSON Schema object
   */
  getSchema(): JSONSchema {
    return {
      type: 'object',
      required: [
        'metadata',
        'framework',
        'timestamp',
        'repository',
        'compliance',
        'summary',
        'controls',
      ],
      properties: {
        metadata: {
          type: 'object',
          required: ['version', 'generator', 'generatedAt'],
          properties: {
            version: {
              type: 'string',
              pattern: '^\\d+\\.\\d+\\.\\d+$',
              description: 'Schema version',
            },
            generator: {
              type: 'string',
              description: 'Tool that generated the report',
            },
            generatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp',
            },
          },
        },
        framework: {
          type: 'string',
          enum: ['SOC2', 'GDPR', 'ISO27001'],
          description: 'Compliance framework',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Scan timestamp in ISO 8601 format',
        },
        repository: {
          type: 'object',
          required: ['name', 'owner'],
          properties: {
            name: {
              type: 'string',
              description: 'Repository name',
            },
            owner: {
              type: 'string',
              description: 'Repository owner/organization',
            },
          },
        },
        compliance: {
          type: 'object',
          required: ['overallScore', 'status', 'grade'],
          properties: {
            overallScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Overall compliance score (0-100)',
            },
            status: {
              type: 'string',
              enum: ['PASS', 'FAIL'],
              description: 'Overall compliance status',
            },
            grade: {
              type: 'string',
              enum: ['Excellent', 'Good', 'Fair', 'Poor'],
              description: 'Compliance grade',
            },
          },
        },
        summary: {
          type: 'object',
          required: ['total', 'passed', 'failed', 'notApplicable', 'passRate'],
          properties: {
            total: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of controls',
            },
            passed: {
              type: 'integer',
              minimum: 0,
              description: 'Number of controls passed',
            },
            failed: {
              type: 'integer',
              minimum: 0,
              description: 'Number of controls failed',
            },
            notApplicable: {
              type: 'integer',
              minimum: 0,
              description: 'Number of controls not applicable',
            },
            passRate: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Pass rate percentage',
            },
          },
        },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name', 'status', 'evidence', 'severity'],
            properties: {
              id: {
                type: 'string',
                description: 'Control identifier',
              },
              name: {
                type: 'string',
                description: 'Control name',
              },
              status: {
                type: 'string',
                enum: ['PASS', 'FAIL', 'NOT_APPLICABLE'],
                description: 'Control status',
              },
              evidence: {
                type: 'string',
                description: 'Evidence collected for this control',
              },
              severity: {
                type: 'string',
                enum: ['critical', 'high', 'medium', 'low'],
                description: 'Severity level',
              },
              violations: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['file', 'line', 'code', 'recommendation'],
                  properties: {
                    file: {
                      type: 'string',
                      description: 'File path',
                    },
                    line: {
                      type: 'integer',
                      minimum: 1,
                      description: 'Line number',
                    },
                    code: {
                      type: 'string',
                      description: 'Code snippet',
                    },
                    recommendation: {
                      type: 'string',
                      description: 'Recommended fix',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  /**
   * Validate compliance data structure
   */
  private validateData(data: ComplianceData): void {
    if (!data.framework || !['SOC2', 'GDPR', 'ISO27001'].includes(data.framework)) {
      throw new Error('Invalid framework. Must be SOC2, GDPR, or ISO27001');
    }

    if (!(data.timestamp instanceof Date)) {
      throw new Error('Invalid timestamp. Must be a Date object');
    }

    if (!data.repositoryName || typeof data.repositoryName !== 'string') {
      throw new Error('Repository name is required and must be a string');
    }

    if (!data.repositoryOwner || typeof data.repositoryOwner !== 'string') {
      throw new Error('Repository owner is required and must be a string');
    }

    if (typeof data.overallScore !== 'number' || data.overallScore < 0 || data.overallScore > 100) {
      throw new Error('Overall score must be a number between 0 and 100');
    }

    if (!Array.isArray(data.controls)) {
      throw new Error('Controls must be an array');
    }

    if (!data.summary || typeof data.summary !== 'object') {
      throw new Error('Summary is required and must be an object');
    }

    // Validate summary fields
    const requiredSummaryFields = ['total', 'passed', 'failed', 'notApplicable'];
    for (const field of requiredSummaryFields) {
      if (typeof data.summary[field as keyof typeof data.summary] !== 'number') {
        throw new Error(`Summary.${field} is required and must be a number`);
      }
    }
  }

  /**
   * Format compliance data to structured output
   */
  private formatData(data: ComplianceData): FormattedOutput {
    const passRate = data.summary.total > 0 ? (data.summary.passed / data.summary.total) * 100 : 0;

    const status = data.summary.failed === 0 ? 'PASS' : 'FAIL';
    const grade = this.calculateGrade(passRate);

    return {
      metadata: {
        version: this.version,
        generator: 'Compliance Autopilot',
        generatedAt: new Date().toISOString(),
      },
      framework: data.framework,
      timestamp: data.timestamp.toISOString(),
      repository: {
        name: data.repositoryName,
        owner: data.repositoryOwner,
      },
      compliance: {
        overallScore: Math.round(data.overallScore * 100) / 100,
        status,
        grade,
      },
      summary: {
        total: data.summary.total,
        passed: data.summary.passed,
        failed: data.summary.failed,
        notApplicable: data.summary.notApplicable,
        passRate: Math.round(passRate * 100) / 100,
      },
      controls: data.controls.map((control) => this.formatControl(control)),
    };
  }

  /**
   * Format individual control result
   */
  private formatControl(control: ControlResult) {
    const formatted: any = {
      id: control.id,
      name: control.name,
      status: control.status,
      evidence: control.evidence,
      severity: control.severity,
    };

    if (control.violations && control.violations.length > 0) {
      formatted.violations = control.violations.map((v) => this.formatViolation(v));
    }

    return formatted;
  }

  /**
   * Format violation details
   */
  private formatViolation(violation: Violation) {
    return {
      file: violation.file,
      line: violation.line,
      code: violation.code,
      recommendation: violation.recommendation,
    };
  }

  /**
   * Calculate compliance grade from pass rate
   */
  private calculateGrade(passRate: number): string {
    if (passRate >= 90) return 'Excellent';
    if (passRate >= 75) return 'Good';
    if (passRate >= 60) return 'Fair';
    return 'Poor';
  }
}
