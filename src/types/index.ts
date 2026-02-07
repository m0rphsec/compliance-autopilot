/**
 * Core types for Compliance Autopilot
 */

// Re-export all types from evidence
export * from './evidence.js';
export * from './controls.js';

// GitHub Action types
export type ComplianceFramework = 'soc2' | 'gdpr' | 'iso27001';

export interface ActionInputs {
  githubToken: string;
  anthropicApiKey: string;
  licenseKey?: string;
  frameworks: ComplianceFramework[];
  reportFormat: 'pdf' | 'json' | 'both';
  failOnViolations: boolean;
  slackWebhook?: string;
}

export interface GitHubContext {
  owner: string;
  repo: string;
  ref: string;
  sha: string;
  pullRequest?: {
    number: number;
    head: string;
    base: string;
  };
}

export interface ActionOutputs {
  complianceStatus: string;
  controlsPassed: number;
  controlsTotal: number;
  reportUrl?: string;
}

// Compliance Report types
export interface FrameworkResults {
  framework: ComplianceFramework;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  warnControls: number;
  skippedControls: number;
  errorControls: number;
  controls: any[];
  executionTimeMs: number;
}

export interface ComplianceReport {
  timestamp: string;
  repository: string;
  commit: string;
  pullRequest?: number;
  frameworks: FrameworkResults[];
  overallStatus: string;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  executionTimeMs: number;
}

export interface ReportResult {
  pdfPath?: string;
  jsonPath?: string;
}

// GDPR-specific types
export interface PIIDetectionResult {
  has_pii: boolean;
  pii_types: string[];
  collection_methods: string[];
  encryption_transit: boolean;
  encryption_rest: boolean;
  consent_mechanism: boolean;
  retention_policy: boolean;
  deletion_capability: boolean;
  gdpr_compliant: boolean;
  violations: string[];
  recommendations: string[];
}

export interface PIIMatch {
  type: string;
  value: string;
  line: number;
  column: number;
  context: string;
}

export interface GDPRViolation {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  file: string;
  line?: number;
  recommendation: string;
}

export interface GDPRCollectorResult {
  score: number;
  compliant: boolean;
  violations: GDPRViolation[];
  pii_detected: PIIMatch[];
  summary: {
    total_files_scanned: number;
    files_with_pii: number;
    total_violations: number;
    compliance_percentage: number;
  };
}

export interface CollectorResult {
  framework: string;
  score: number;
  violations: unknown[];
  recommendations: string[];
  metadata?: Record<string, unknown>;
}

export interface ClaudeAnalysisRequest {
  code: string;
  filePath: string;
  fileType: string;
}
