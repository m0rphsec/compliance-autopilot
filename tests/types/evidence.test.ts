/**
 * Tests for evidence type definitions
 */

import { describe, it, expect } from '@jest/globals';
import {
  ComplianceFramework,
  EvidenceStatus,
  ControlResult,
  Severity,
  type EvidenceArtifact,
  type ControlEvaluation,
  type ComplianceSummary,
  type ComplianceReport,
  type ValidationResult
} from '../../src/types/evidence.js';

describe('Evidence Type Enums', () => {
  it('should have correct ComplianceFramework values', () => {
    expect(ComplianceFramework.SOC2).toBe('SOC2');
    expect(ComplianceFramework.GDPR).toBe('GDPR');
    expect(ComplianceFramework.ISO27001).toBe('ISO27001');
  });

  it('should have correct EvidenceStatus values', () => {
    expect(EvidenceStatus.PENDING).toBe('pending');
    expect(EvidenceStatus.COLLECTED).toBe('collected');
    expect(EvidenceStatus.FAILED).toBe('failed');
    expect(EvidenceStatus.INVALID).toBe('invalid');
  });

  it('should have correct ControlResult values', () => {
    expect(ControlResult.PASS).toBe('pass');
    expect(ControlResult.FAIL).toBe('fail');
    expect(ControlResult.PARTIAL).toBe('partial');
    expect(ControlResult.NOT_APPLICABLE).toBe('not_applicable');
    expect(ControlResult.ERROR).toBe('error');
  });

  it('should have correct Severity values', () => {
    expect(Severity.CRITICAL).toBe('critical');
    expect(Severity.HIGH).toBe('high');
    expect(Severity.MEDIUM).toBe('medium');
    expect(Severity.LOW).toBe('low');
    expect(Severity.INFO).toBe('info');
  });
});

describe('EvidenceArtifact', () => {
  it('should create valid evidence artifact', () => {
    const artifact: EvidenceArtifact = {
      id: 'ev-001',
      type: 'pull_request',
      source: 'https://github.com/owner/repo/pull/123',
      timestamp: '2024-01-01T00:00:00Z',
      data: {
        prNumber: 123,
        merged: true
      },
      metadata: {
        author: 'user1'
      }
    };

    expect(artifact.id).toBe('ev-001');
    expect(artifact.type).toBe('pull_request');
    expect(artifact.data.prNumber).toBe(123);
  });
});

describe('ControlEvaluation', () => {
  it('should create valid control evaluation', () => {
    const evaluation: ControlEvaluation = {
      controlId: 'CC6.1',
      controlName: 'Logical Access Controls',
      framework: ComplianceFramework.SOC2,
      result: ControlResult.PASS,
      evidence: [
        {
          id: 'ev-001',
          type: 'branch_protection',
          source: 'https://github.com/owner/repo/settings/branches',
          timestamp: '2024-01-01T00:00:00Z',
          data: { protected: true }
        }
      ],
      evaluatedAt: '2024-01-01T00:00:00Z',
      notes: 'Branch protection enabled',
      severity: Severity.INFO
    };

    expect(evaluation.controlId).toBe('CC6.1');
    expect(evaluation.result).toBe(ControlResult.PASS);
    expect(evaluation.evidence).toHaveLength(1);
  });

  it('should handle failed control with findings', () => {
    const evaluation: ControlEvaluation = {
      controlId: 'CC7.2',
      controlName: 'System Monitoring',
      framework: ComplianceFramework.SOC2,
      result: ControlResult.FAIL,
      evidence: [],
      evaluatedAt: '2024-01-01T00:00:00Z',
      severity: Severity.HIGH,
      findings: [
        'No security scanning workflows found',
        'Missing automated monitoring'
      ]
    };

    expect(evaluation.result).toBe(ControlResult.FAIL);
    expect(evaluation.severity).toBe(Severity.HIGH);
    expect(evaluation.findings).toHaveLength(2);
  });
});

describe('ComplianceSummary', () => {
  it('should calculate compliance percentage correctly', () => {
    const summary: ComplianceSummary = {
      totalControls: 10,
      passedControls: 8,
      failedControls: 1,
      partialControls: 1,
      notApplicableControls: 0,
      errorControls: 0,
      compliancePercentage: 80,
      severityBreakdown: {
        [Severity.CRITICAL]: 0,
        [Severity.HIGH]: 1,
        [Severity.MEDIUM]: 1,
        [Severity.LOW]: 0,
        [Severity.INFO]: 8
      }
    };

    expect(summary.compliancePercentage).toBe(80);
    expect(summary.passedControls + summary.failedControls + summary.partialControls)
      .toBe(summary.totalControls);
  });

  it('should handle 100% compliance', () => {
    const summary: ComplianceSummary = {
      totalControls: 5,
      passedControls: 5,
      failedControls: 0,
      partialControls: 0,
      notApplicableControls: 0,
      errorControls: 0,
      compliancePercentage: 100,
      severityBreakdown: {
        [Severity.CRITICAL]: 0,
        [Severity.HIGH]: 0,
        [Severity.MEDIUM]: 0,
        [Severity.LOW]: 0,
        [Severity.INFO]: 5
      }
    };

    expect(summary.compliancePercentage).toBe(100);
    expect(summary.failedControls).toBe(0);
  });
});

describe('ComplianceReport', () => {
  it('should create valid compliance report', () => {
    const report: ComplianceReport = {
      id: 'report-001',
      framework: ComplianceFramework.SOC2,
      repository: 'owner/repo',
      generatedAt: '2024-01-01T00:00:00Z',
      period: {
        start: '2023-01-01T00:00:00Z',
        end: '2024-01-01T00:00:00Z'
      },
      summary: {
        totalControls: 3,
        passedControls: 2,
        failedControls: 1,
        partialControls: 0,
        notApplicableControls: 0,
        errorControls: 0,
        compliancePercentage: 66.67,
        severityBreakdown: {
          [Severity.CRITICAL]: 0,
          [Severity.HIGH]: 1,
          [Severity.MEDIUM]: 0,
          [Severity.LOW]: 0,
          [Severity.INFO]: 2
        }
      },
      evaluations: [],
      metadata: {
        version: '1.0.0',
        generatedBy: 'compliance-autopilot'
      }
    };

    expect(report.id).toBe('report-001');
    expect(report.framework).toBe(ComplianceFramework.SOC2);
    expect(report.summary.compliancePercentage).toBe(66.67);
  });
});

describe('ValidationResult', () => {
  it('should create valid validation result', () => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: ['Minor issue detected']
    };

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
  });

  it('should create failed validation result', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [
        'Missing required field: controlId',
        'Invalid timestamp format'
      ],
      warnings: []
    };

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
