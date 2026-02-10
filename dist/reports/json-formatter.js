"use strict";
/**
 * JSON Formatter for Compliance Evidence
 * Provides structured JSON output for programmatic access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONFormatter = void 0;
/**
 * JSON formatter for compliance evidence
 */
class JSONFormatter {
    version = '1.0.0';
    /**
     * Format compliance data as JSON string
     * @param data Compliance scan results
     * @returns JSON string
     */
    format(data) {
        this.validateData(data);
        const formatted = this.formatData(data);
        return JSON.stringify(formatted);
    }
    /**
     * Format compliance data as pretty-printed JSON
     * @param data Compliance scan results
     * @returns Formatted JSON string with indentation
     */
    formatPretty(data) {
        this.validateData(data);
        const formatted = this.formatData(data);
        return JSON.stringify(formatted, null, 2);
    }
    /**
     * Get JSON schema for compliance data
     * @returns JSON Schema object
     */
    getSchema() {
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
                            enum: ['PASS', 'PARTIAL', 'FAIL'],
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
                                enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_APPLICABLE'],
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
                            framework: {
                                type: 'string',
                                enum: ['SOC2', 'GDPR', 'ISO27001'],
                                description: 'Compliance framework this control belongs to',
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
    validateData(data) {
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
            if (typeof data.summary[field] !== 'number') {
                throw new Error(`Summary.${field} is required and must be a number`);
            }
        }
    }
    /**
     * Format compliance data to structured output
     */
    formatData(data) {
        const passRate = data.summary.total > 0 ? (data.summary.passed / data.summary.total) * 100 : 0;
        const hasCriticalFail = data.controls.some((c) => c.status === 'FAIL' && c.severity === 'critical');
        const status = data.summary.failed === 0 ? 'PASS' : hasCriticalFail || passRate < 70 ? 'FAIL' : 'PARTIAL';
        const grade = this.calculateGrade(passRate);
        return {
            metadata: {
                version: this.version,
                generator: 'Compliance Autopilot',
                generatedAt: new Date().toISOString(),
            },
            framework: data.framework,
            frameworks: data.frameworks || [data.framework],
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
                partial: data.summary.partial || 0,
                notApplicable: data.summary.notApplicable,
                passRate: Math.round(passRate * 100) / 100,
            },
            frameworkSummaries: data.frameworkSummaries,
            controls: data.controls.map((control) => this.formatControl(control)),
        };
    }
    /**
     * Format individual control result
     */
    formatControl(control) {
        const formatted = {
            id: control.id,
            name: control.name,
            status: control.status,
            evidence: control.evidence,
            severity: control.severity,
        };
        if (control.framework) {
            formatted.framework = control.framework;
        }
        if (control.violations && control.violations.length > 0) {
            formatted.violations = control.violations.map((v) => this.formatViolation(v));
        }
        if (control.recommendations && control.recommendations.length > 0) {
            formatted.recommendations = control.recommendations;
        }
        return formatted;
    }
    /**
     * Format violation details
     */
    formatViolation(violation) {
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
    calculateGrade(passRate) {
        if (passRate >= 90)
            return 'Excellent';
        if (passRate >= 75)
            return 'Good';
        if (passRate >= 60)
            return 'Fair';
        return 'Poor';
    }
}
exports.JSONFormatter = JSONFormatter;
//# sourceMappingURL=json-formatter.js.map