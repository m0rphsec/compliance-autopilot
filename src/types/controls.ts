/**
 * Compliance control definitions for SOC2, GDPR, and ISO27001
 * @module types/controls
 */

import { ComplianceFramework } from './evidence.js';

/**
 * Control category classification
 */
export enum ControlCategory {
  ACCESS_CONTROL = 'access_control',
  CHANGE_MANAGEMENT = 'change_management',
  MONITORING = 'monitoring',
  DATA_PROTECTION = 'data_protection',
  INCIDENT_RESPONSE = 'incident_response',
  SECURITY_TESTING = 'security_testing',
  DOCUMENTATION = 'documentation',
  RISK_MANAGEMENT = 'risk_management',
}

/**
 * Evidence collection method
 */
export enum EvidenceType {
  PULL_REQUEST = 'pull_request',
  CODE_REVIEW = 'code_review',
  SECURITY_SCAN = 'security_scan',
  COMMIT_HISTORY = 'commit_history',
  BRANCH_PROTECTION = 'branch_protection',
  WORKFLOW_RUN = 'workflow_run',
  ISSUE_TRACKING = 'issue_tracking',
  DOCUMENTATION = 'documentation',
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
export const SOC2_CONTROLS: ControlDefinition[] = [
  {
    id: 'CC6.1',
    name: 'Logical and Physical Access Controls',
    framework: ComplianceFramework.SOC2,
    category: ControlCategory.ACCESS_CONTROL,
    description:
      "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.",
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
    framework: ComplianceFramework.SOC2,
    category: ControlCategory.MONITORING,
    description:
      "The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives.",
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
    framework: ComplianceFramework.SOC2,
    category: ControlCategory.CHANGE_MANAGEMENT,
    description:
      'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
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
export const GDPR_CONTROLS: ControlDefinition[] = [
  {
    id: 'GDPR-Art32',
    name: 'Security of Processing',
    framework: ComplianceFramework.GDPR,
    category: ControlCategory.DATA_PROTECTION,
    description:
      'Implementation of appropriate technical and organizational measures to ensure a level of security appropriate to the risk.',
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
    framework: ComplianceFramework.GDPR,
    category: ControlCategory.DATA_PROTECTION,
    description:
      'Implementation of appropriate technical and organizational measures designed to implement data-protection principles in an effective manner.',
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
    framework: ComplianceFramework.GDPR,
    category: ControlCategory.INCIDENT_RESPONSE,
    description:
      'Notification of a personal data breach to the supervisory authority without undue delay.',
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
export const ISO27001_CONTROLS: ControlDefinition[] = [
  {
    id: 'ISO27001-9.1.1',
    name: 'Access Control Policy',
    framework: ComplianceFramework.ISO27001,
    category: ControlCategory.ACCESS_CONTROL,
    description:
      'An access control policy shall be established, documented and reviewed based on business and information security requirements.',
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
    framework: ComplianceFramework.ISO27001,
    category: ControlCategory.CHANGE_MANAGEMENT,
    description:
      'Changes to the organization, business processes, information processing facilities and systems that affect information security shall be controlled.',
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
    framework: ComplianceFramework.ISO27001,
    category: ControlCategory.MONITORING,
    description:
      'Event logs recording user activities, exceptions, faults and information security events shall be produced, kept and regularly reviewed.',
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
    framework: ComplianceFramework.ISO27001,
    category: ControlCategory.CHANGE_MANAGEMENT,
    description:
      'Changes to systems within the development lifecycle shall be controlled by the use of formal change control procedures.',
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
    framework: ComplianceFramework.ISO27001,
    category: ControlCategory.INCIDENT_RESPONSE,
    description:
      'Management responsibilities and procedures shall be established to ensure a quick, effective and orderly response to information security incidents.',
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
    framework: ComplianceFramework.ISO27001,
    category: ControlCategory.DATA_PROTECTION,
    description:
      'Information security requirements relating to the protection of personal data shall be identified and met.',
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
    framework: ComplianceFramework.ISO27001,
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
export function getControlsForFramework(framework: ComplianceFramework): ControlDefinition[] {
  switch (framework) {
    case ComplianceFramework.SOC2:
      return SOC2_CONTROLS;
    case ComplianceFramework.GDPR:
      return GDPR_CONTROLS;
    case ComplianceFramework.ISO27001:
      return ISO27001_CONTROLS;
    default:
      return [];
  }
}

/**
 * Get a specific control by ID
 */
export function getControlById(controlId: string): ControlDefinition | undefined {
  const allControls = [...SOC2_CONTROLS, ...GDPR_CONTROLS, ...ISO27001_CONTROLS];
  return allControls.find((control: ControlDefinition) => control.id === controlId);
}

/**
 * Get controls by category
 */
export function getControlsByCategory(category: ControlCategory): ControlDefinition[] {
  const allControls = [...SOC2_CONTROLS, ...GDPR_CONTROLS, ...ISO27001_CONTROLS];
  return allControls.filter((control: ControlDefinition) => control.category === category);
}
