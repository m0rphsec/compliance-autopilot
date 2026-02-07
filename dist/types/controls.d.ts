/**
 * Compliance control definitions for SOC2, GDPR, and ISO27001
 * @module types/controls
 */
import { ComplianceFramework } from './evidence.js';
/**
 * Control category classification
 */
export declare enum ControlCategory {
    ACCESS_CONTROL = "access_control",
    CHANGE_MANAGEMENT = "change_management",
    MONITORING = "monitoring",
    DATA_PROTECTION = "data_protection",
    INCIDENT_RESPONSE = "incident_response",
    SECURITY_TESTING = "security_testing",
    DOCUMENTATION = "documentation",
    RISK_MANAGEMENT = "risk_management"
}
/**
 * Evidence collection method
 */
export declare enum EvidenceType {
    PULL_REQUEST = "pull_request",
    CODE_REVIEW = "code_review",
    SECURITY_SCAN = "security_scan",
    COMMIT_HISTORY = "commit_history",
    BRANCH_PROTECTION = "branch_protection",
    WORKFLOW_RUN = "workflow_run",
    ISSUE_TRACKING = "issue_tracking",
    DOCUMENTATION = "documentation"
}
/**
 * Compliance control definition
 */
export interface ControlDefinition {
    /** Unique control identifier */
    id: string;
    /** Control name/title */
    name: string;
    /** Compliance framework this control belongs to */
    framework: ComplianceFramework;
    /** Control category */
    category: ControlCategory;
    /** Detailed description */
    description: string;
    /** Control objective */
    objective: string;
    /** Required evidence types */
    requiredEvidence: EvidenceType[];
    /** Validation criteria */
    criteria: string[];
    /** Whether this control is required (vs. recommended) */
    required: boolean;
    /** Related control IDs from other frameworks */
    relatedControls?: string[];
    /** Implementation guidance */
    guidance?: string;
}
/**
 * SOC2 Trust Services Criteria controls
 */
export declare const SOC2_CONTROLS: ControlDefinition[];
/**
 * GDPR compliance controls
 */
export declare const GDPR_CONTROLS: ControlDefinition[];
/**
 * ISO27001 controls
 */
export declare const ISO27001_CONTROLS: ControlDefinition[];
/**
 * Get all controls for a specific framework
 */
export declare function getControlsForFramework(framework: ComplianceFramework): ControlDefinition[];
/**
 * Get a specific control by ID
 */
export declare function getControlById(controlId: string): ControlDefinition | undefined;
/**
 * Get controls by category
 */
export declare function getControlsByCategory(category: ControlCategory): ControlDefinition[];
//# sourceMappingURL=controls.d.ts.map