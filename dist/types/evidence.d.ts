/**
 * Evidence and compliance reporting type definitions
 * @module types/evidence
 */
/**
 * Supported compliance frameworks
 */
export declare enum ComplianceFramework {
    SOC2 = "SOC2",
    GDPR = "GDPR",
    ISO27001 = "ISO27001"
}
/**
 * Evidence collection status
 */
export declare enum EvidenceStatus {
    PENDING = "pending",
    COLLECTED = "collected",
    FAILED = "failed",
    INVALID = "invalid"
}
/**
 * Compliance status enum
 */
export declare enum ComplianceStatus {
    PASS = "PASS",
    FAIL = "FAIL",
    WARNING = "WARNING",
    NOT_APPLICABLE = "NOT_APPLICABLE",
    ERROR = "ERROR",
    MANUAL_REVIEW = "MANUAL_REVIEW"
}
/**
 * Control evaluation result enum (deprecated - use ComplianceStatus)
 */
export type ControlResultType = ControlEvaluation;
export declare enum ControlResult {
    PASS = "pass",
    FAIL = "fail",
    PARTIAL = "partial",
    NOT_APPLICABLE = "not_applicable",
    ERROR = "error"
}
/**
 * Evidence severity level
 */
export declare enum Severity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
/**
 * Evidence artifact collected from GitHub
 */
export interface EvidenceArtifact {
    /** Unique identifier for the artifact */
    id: string;
    /** Type of evidence (e.g., 'pull_request', 'code_review', 'security_scan') */
    type: string;
    /** Source URL or reference */
    source: string;
    /** Timestamp when evidence was collected */
    timestamp: string;
    /** Raw data payload */
    data: Record<string, unknown>;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Control evaluation result with evidence
 */
export interface ControlEvaluation {
    /** Control identifier from framework */
    controlId: string;
    /** Control name/title */
    controlName: string;
    /** Compliance framework */
    framework: ComplianceFramework;
    /** Evaluation result */
    result: ControlResult;
    /** Evidence artifacts supporting this evaluation */
    evidence: EvidenceArtifact[];
    /** Evaluation timestamp */
    evaluatedAt: string;
    /** Optional notes or explanation */
    notes?: string;
    /** Severity of any findings */
    severity?: Severity;
    /** Specific findings or issues */
    findings?: string[];
}
/**
 * Compliance report summary statistics
 */
export interface ComplianceSummary {
    /** Total controls evaluated */
    totalControls: number;
    /** Controls that passed */
    passedControls: number;
    /** Controls that failed */
    failedControls: number;
    /** Controls with partial compliance */
    partialControls: number;
    /** Controls not applicable */
    notApplicableControls: number;
    /** Controls with evaluation errors */
    errorControls: number;
    /** Overall compliance percentage (0-100) */
    compliancePercentage: number;
    /** Breakdown by severity */
    severityBreakdown: Record<Severity, number>;
}
/**
 * Complete compliance report
 */
export interface ComplianceReport {
    /** Unique report identifier */
    id: string;
    /** Target compliance framework */
    framework: ComplianceFramework;
    /** Repository being evaluated */
    repository: string;
    /** Report generation timestamp */
    generatedAt: string;
    /** Time period covered by report */
    period: {
        start: string;
        end: string;
    };
    /** Summary statistics */
    summary: ComplianceSummary;
    /** Individual control evaluations */
    evaluations: ControlEvaluation[];
    /** Optional report metadata */
    metadata?: {
        version?: string;
        generatedBy?: string;
        [key: string]: unknown;
    };
}
/**
 * Evidence collection configuration
 */
export interface EvidenceCollectionConfig {
    /** Frameworks to evaluate */
    frameworks: ComplianceFramework[];
    /** Date range for evidence collection */
    dateRange?: {
        start: string;
        end: string;
    };
    /** Specific controls to evaluate (if not all) */
    controlIds?: string[];
    /** Whether to include raw evidence data */
    includeRawData?: boolean;
    /** Maximum evidence items per control */
    maxEvidencePerControl?: number;
}
/**
 * Evidence validation result
 */
export interface ValidationResult {
    /** Whether evidence is valid */
    valid: boolean;
    /** Validation errors if any */
    errors: string[];
    /** Validation warnings */
    warnings?: string[];
}
//# sourceMappingURL=evidence.d.ts.map