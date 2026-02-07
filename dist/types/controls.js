"use strict";
/**
 * Compliance control definitions for SOC2, GDPR, and ISO27001
 * @module types/controls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISO27001_CONTROLS = exports.GDPR_CONTROLS = exports.SOC2_CONTROLS = exports.EvidenceType = exports.ControlCategory = void 0;
exports.getControlsForFramework = getControlsForFramework;
exports.getControlById = getControlById;
exports.getControlsByCategory = getControlsByCategory;
const evidence_js_1 = require("./evidence.js");
/**
 * Control category classification
 */
var ControlCategory;
(function (ControlCategory) {
    ControlCategory["ACCESS_CONTROL"] = "access_control";
    ControlCategory["CHANGE_MANAGEMENT"] = "change_management";
    ControlCategory["MONITORING"] = "monitoring";
    ControlCategory["DATA_PROTECTION"] = "data_protection";
    ControlCategory["INCIDENT_RESPONSE"] = "incident_response";
    ControlCategory["SECURITY_TESTING"] = "security_testing";
    ControlCategory["DOCUMENTATION"] = "documentation";
    ControlCategory["RISK_MANAGEMENT"] = "risk_management";
})(ControlCategory || (exports.ControlCategory = ControlCategory = {}));
/**
 * Evidence collection method
 */
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["PULL_REQUEST"] = "pull_request";
    EvidenceType["CODE_REVIEW"] = "code_review";
    EvidenceType["SECURITY_SCAN"] = "security_scan";
    EvidenceType["COMMIT_HISTORY"] = "commit_history";
    EvidenceType["BRANCH_PROTECTION"] = "branch_protection";
    EvidenceType["WORKFLOW_RUN"] = "workflow_run";
    EvidenceType["ISSUE_TRACKING"] = "issue_tracking";
    EvidenceType["DOCUMENTATION"] = "documentation";
})(EvidenceType || (exports.EvidenceType = EvidenceType = {}));
/**
 * SOC2 Trust Services Criteria controls
 */
exports.SOC2_CONTROLS = [
    {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        framework: evidence_js_1.ComplianceFramework.SOC2,
        category: ControlCategory.ACCESS_CONTROL,
        description: "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.",
        objective: 'Ensure only authorized users can access systems and data',
        requiredEvidence: [
            EvidenceType.BRANCH_PROTECTION,
            EvidenceType.PULL_REQUEST,
            EvidenceType.CODE_REVIEW,
        ],
        criteria: [
            'Branch protection rules are enabled',
            'Pull requests require approval before merge',
            'Code review process is documented and followed',
        ],
        required: true,
        relatedControls: ['ISO27001-9.1.1', 'GDPR-Art32'],
    },
    {
        id: 'CC7.2',
        name: 'System Monitoring',
        framework: evidence_js_1.ComplianceFramework.SOC2,
        category: ControlCategory.MONITORING,
        description: "The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives.",
        objective: 'Detect and respond to security events and anomalies',
        requiredEvidence: [
            EvidenceType.WORKFLOW_RUN,
            EvidenceType.SECURITY_SCAN,
            EvidenceType.ISSUE_TRACKING,
        ],
        criteria: [
            'Security scanning is automated and regular',
            'Security findings are tracked and remediated',
            'Monitoring workflows are operational',
        ],
        required: true,
        relatedControls: ['ISO27001-12.4.1'],
    },
    {
        id: 'CC8.1',
        name: 'Change Management',
        framework: evidence_js_1.ComplianceFramework.SOC2,
        category: ControlCategory.CHANGE_MANAGEMENT,
        description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
        objective: 'Ensure changes are properly authorized, tested, and documented',
        requiredEvidence: [
            EvidenceType.PULL_REQUEST,
            EvidenceType.CODE_REVIEW,
            EvidenceType.COMMIT_HISTORY,
            EvidenceType.WORKFLOW_RUN,
        ],
        criteria: [
            'All changes go through pull request process',
            'Changes are reviewed and approved',
            'Automated tests run on all changes',
            'Change history is maintained',
        ],
        required: true,
        relatedControls: ['ISO27001-12.1.2', 'ISO27001-14.2.2'],
    },
];
/**
 * GDPR compliance controls
 */
exports.GDPR_CONTROLS = [
    {
        id: 'GDPR-Art32',
        name: 'Security of Processing',
        framework: evidence_js_1.ComplianceFramework.GDPR,
        category: ControlCategory.DATA_PROTECTION,
        description: 'Implementation of appropriate technical and organizational measures to ensure a level of security appropriate to the risk.',
        objective: 'Protect personal data through security measures',
        requiredEvidence: [
            EvidenceType.SECURITY_SCAN,
            EvidenceType.CODE_REVIEW,
            EvidenceType.DOCUMENTATION,
        ],
        criteria: [
            'Security scanning identifies vulnerabilities',
            'Code reviews check for data protection',
            'Security measures are documented',
        ],
        required: true,
        relatedControls: ['SOC2-CC6.1', 'ISO27001-18.1.5'],
    },
    {
        id: 'GDPR-Art25',
        name: 'Data Protection by Design and Default',
        framework: evidence_js_1.ComplianceFramework.GDPR,
        category: ControlCategory.DATA_PROTECTION,
        description: 'Implementation of appropriate technical and organizational measures designed to implement data-protection principles in an effective manner.',
        objective: 'Build privacy into system design',
        requiredEvidence: [
            EvidenceType.CODE_REVIEW,
            EvidenceType.DOCUMENTATION,
            EvidenceType.PULL_REQUEST,
        ],
        criteria: [
            'Privacy considerations in design reviews',
            'Data minimization principles applied',
            'Privacy documentation maintained',
        ],
        required: true,
        relatedControls: ['ISO27001-18.1.1'],
    },
    {
        id: 'GDPR-Art33',
        name: 'Breach Notification',
        framework: evidence_js_1.ComplianceFramework.GDPR,
        category: ControlCategory.INCIDENT_RESPONSE,
        description: 'Notification of a personal data breach to the supervisory authority without undue delay.',
        objective: 'Detect and report data breaches promptly',
        requiredEvidence: [
            EvidenceType.ISSUE_TRACKING,
            EvidenceType.DOCUMENTATION,
            EvidenceType.WORKFLOW_RUN,
        ],
        criteria: [
            'Incident response process documented',
            'Security incidents are tracked',
            'Breach detection mechanisms in place',
        ],
        required: true,
        relatedControls: ['ISO27001-16.1.1'],
    },
];
/**
 * ISO27001 controls
 */
exports.ISO27001_CONTROLS = [
    {
        id: 'ISO27001-9.1.1',
        name: 'Access Control Policy',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.ACCESS_CONTROL,
        description: 'An access control policy shall be established, documented and reviewed based on business and information security requirements.',
        objective: 'Control access to information and systems',
        requiredEvidence: [
            EvidenceType.BRANCH_PROTECTION,
            EvidenceType.DOCUMENTATION,
            EvidenceType.CODE_REVIEW,
        ],
        criteria: [
            'Access control policy is documented',
            'Repository access is restricted',
            'Access controls are enforced',
        ],
        required: true,
        relatedControls: ['SOC2-CC6.1', 'GDPR-Art32'],
    },
    {
        id: 'ISO27001-12.1.2',
        name: 'Change Management',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.CHANGE_MANAGEMENT,
        description: 'Changes to the organization, business processes, information processing facilities and systems that affect information security shall be controlled.',
        objective: 'Manage changes in a controlled manner',
        requiredEvidence: [
            EvidenceType.PULL_REQUEST,
            EvidenceType.CODE_REVIEW,
            EvidenceType.WORKFLOW_RUN,
        ],
        criteria: [
            'Change approval process exists',
            'Changes are tested before deployment',
            'Change records are maintained',
        ],
        required: true,
        relatedControls: ['SOC2-CC8.1'],
    },
    {
        id: 'ISO27001-12.4.1',
        name: 'Event Logging',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.MONITORING,
        description: 'Event logs recording user activities, exceptions, faults and information security events shall be produced, kept and regularly reviewed.',
        objective: 'Maintain audit trail of system activities',
        requiredEvidence: [
            EvidenceType.WORKFLOW_RUN,
            EvidenceType.COMMIT_HISTORY,
            EvidenceType.ISSUE_TRACKING,
        ],
        criteria: [
            'Activity logs are maintained',
            'Security events are logged',
            'Logs are regularly reviewed',
        ],
        required: true,
        relatedControls: ['SOC2-CC7.2'],
    },
    {
        id: 'ISO27001-14.2.2',
        name: 'System Change Control Procedures',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.CHANGE_MANAGEMENT,
        description: 'Changes to systems within the development lifecycle shall be controlled by the use of formal change control procedures.',
        objective: 'Control system changes through formal procedures',
        requiredEvidence: [
            EvidenceType.PULL_REQUEST,
            EvidenceType.CODE_REVIEW,
            EvidenceType.WORKFLOW_RUN,
            EvidenceType.DOCUMENTATION,
        ],
        criteria: [
            'Formal change control process documented',
            'All changes follow defined procedures',
            'Change approval records maintained',
        ],
        required: true,
        relatedControls: ['SOC2-CC8.1'],
    },
    {
        id: 'ISO27001-16.1.1',
        name: 'Incident Response',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.INCIDENT_RESPONSE,
        description: 'Management responsibilities and procedures shall be established to ensure a quick, effective and orderly response to information security incidents.',
        objective: 'Respond effectively to security incidents',
        requiredEvidence: [
            EvidenceType.ISSUE_TRACKING,
            EvidenceType.DOCUMENTATION,
            EvidenceType.WORKFLOW_RUN,
        ],
        criteria: [
            'Incident response procedures documented',
            'Security incidents are tracked',
            'Response process is tested',
        ],
        required: true,
        relatedControls: ['GDPR-Art33'],
    },
    {
        id: 'ISO27001-18.1.1',
        name: 'Privacy and Protection',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.DATA_PROTECTION,
        description: 'Information security requirements relating to the protection of personal data shall be identified and met.',
        objective: 'Protect personal data in accordance with regulations',
        requiredEvidence: [
            EvidenceType.CODE_REVIEW,
            EvidenceType.DOCUMENTATION,
            EvidenceType.SECURITY_SCAN,
        ],
        criteria: [
            'Privacy requirements documented',
            'Personal data handling reviewed',
            'Privacy controls implemented',
        ],
        required: true,
        relatedControls: ['GDPR-Art25', 'GDPR-Art32'],
    },
    {
        id: 'ISO27001-18.1.5',
        name: 'Privacy in System Design',
        framework: evidence_js_1.ComplianceFramework.ISO27001,
        category: ControlCategory.DATA_PROTECTION,
        description: 'Privacy by design principles shall be integrated into the development lifecycle.',
        objective: 'Build privacy into systems from the start',
        requiredEvidence: [
            EvidenceType.CODE_REVIEW,
            EvidenceType.DOCUMENTATION,
            EvidenceType.PULL_REQUEST,
        ],
        criteria: [
            'Privacy design patterns applied',
            'Privacy impact assessments conducted',
            'Privacy documentation maintained',
        ],
        required: true,
        relatedControls: ['GDPR-Art25'],
    },
];
/**
 * Get all controls for a specific framework
 */
function getControlsForFramework(framework) {
    switch (framework) {
        case evidence_js_1.ComplianceFramework.SOC2:
            return exports.SOC2_CONTROLS;
        case evidence_js_1.ComplianceFramework.GDPR:
            return exports.GDPR_CONTROLS;
        case evidence_js_1.ComplianceFramework.ISO27001:
            return exports.ISO27001_CONTROLS;
        default:
            return [];
    }
}
/**
 * Get a specific control by ID
 */
function getControlById(controlId) {
    const allControls = [...exports.SOC2_CONTROLS, ...exports.GDPR_CONTROLS, ...exports.ISO27001_CONTROLS];
    return allControls.find((control) => control.id === controlId);
}
/**
 * Get controls by category
 */
function getControlsByCategory(category) {
    const allControls = [...exports.SOC2_CONTROLS, ...exports.GDPR_CONTROLS, ...exports.ISO27001_CONTROLS];
    return allControls.filter((control) => control.category === category);
}
//# sourceMappingURL=controls.js.map