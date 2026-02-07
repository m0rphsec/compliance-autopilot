"use strict";
/**
 * Report Templates
 * Reusable templates for different compliance frameworks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISO27001_TEMPLATE = exports.GDPR_TEMPLATE = exports.SOC2_TEMPLATE = void 0;
exports.getTemplate = getTemplate;
exports.getAllTemplates = getAllTemplates;
/**
 * SOC2 Report Template
 */
exports.SOC2_TEMPLATE = {
    framework: 'SOC2',
    title: 'SOC2 Type II Compliance Report',
    description: 'Service Organization Control 2 (SOC2) compliance assessment based on Trust Services Criteria',
    sections: [
        {
            id: 'executive-summary',
            title: 'Executive Summary',
            content: 'This report provides an assessment of compliance with SOC2 Trust Services Criteria.',
            order: 1,
        },
        {
            id: 'security',
            title: 'Security (Common Criteria)',
            content: 'The security principle refers to the protection of system resources against unauthorized access.',
            order: 2,
        },
        {
            id: 'availability',
            title: 'Availability',
            content: 'The system is available for operation and use as committed or agreed.',
            order: 3,
        },
        {
            id: 'processing-integrity',
            title: 'Processing Integrity',
            content: 'System processing is complete, valid, accurate, timely, and authorized.',
            order: 4,
        },
        {
            id: 'confidentiality',
            title: 'Confidentiality',
            content: 'Information designated as confidential is protected as committed or agreed.',
            order: 5,
        },
        {
            id: 'privacy',
            title: 'Privacy',
            content: 'Personal information is collected, used, retained, disclosed, and disposed of in conformity with commitments.',
            order: 6,
        },
    ],
};
/**
 * GDPR Report Template
 */
exports.GDPR_TEMPLATE = {
    framework: 'GDPR',
    title: 'GDPR Compliance Report',
    description: 'General Data Protection Regulation (GDPR) compliance assessment for data protection and privacy',
    sections: [
        {
            id: 'executive-summary',
            title: 'Executive Summary',
            content: 'This report provides an assessment of GDPR compliance for personal data processing.',
            order: 1,
        },
        {
            id: 'lawfulness',
            title: 'Lawfulness, Fairness and Transparency',
            content: 'Personal data must be processed lawfully, fairly, and in a transparent manner.',
            order: 2,
        },
        {
            id: 'purpose-limitation',
            title: 'Purpose Limitation',
            content: 'Data collected for specified, explicit and legitimate purposes.',
            order: 3,
        },
        {
            id: 'data-minimization',
            title: 'Data Minimization',
            content: 'Personal data must be adequate, relevant and limited to what is necessary.',
            order: 4,
        },
        {
            id: 'accuracy',
            title: 'Accuracy',
            content: 'Personal data must be accurate and kept up to date.',
            order: 5,
        },
        {
            id: 'storage-limitation',
            title: 'Storage Limitation',
            content: 'Personal data kept in a form which permits identification for no longer than necessary.',
            order: 6,
        },
        {
            id: 'security',
            title: 'Integrity and Confidentiality',
            content: 'Personal data processed in a manner that ensures appropriate security.',
            order: 7,
        },
    ],
};
/**
 * ISO27001 Report Template
 */
exports.ISO27001_TEMPLATE = {
    framework: 'ISO27001',
    title: 'ISO 27001 Compliance Report',
    description: 'ISO/IEC 27001 Information Security Management System (ISMS) compliance assessment',
    sections: [
        {
            id: 'executive-summary',
            title: 'Executive Summary',
            content: 'This report provides an assessment of ISO 27001 compliance for information security management.',
            order: 1,
        },
        {
            id: 'security-policy',
            title: 'Information Security Policies (A.5)',
            content: 'Management direction and support for information security.',
            order: 2,
        },
        {
            id: 'organization',
            title: 'Organization of Information Security (A.6)',
            content: 'Internal organization and mobile devices/teleworking security.',
            order: 3,
        },
        {
            id: 'human-resources',
            title: 'Human Resource Security (A.7)',
            content: 'Security controls before, during, and after employment.',
            order: 4,
        },
        {
            id: 'asset-management',
            title: 'Asset Management (A.8)',
            content: 'Responsibility for assets, information classification, and media handling.',
            order: 5,
        },
        {
            id: 'access-control',
            title: 'Access Control (A.9)',
            content: 'Business requirements, user access management, and user responsibilities.',
            order: 6,
        },
        {
            id: 'cryptography',
            title: 'Cryptography (A.10)',
            content: 'Cryptographic controls for information protection.',
            order: 7,
        },
        {
            id: 'operations',
            title: 'Operations Security (A.12)',
            content: 'Operational procedures, protection from malware, backup, logging, monitoring.',
            order: 8,
        },
        {
            id: 'communications',
            title: 'Communications Security (A.13)',
            content: 'Network security management and information transfer.',
            order: 9,
        },
        {
            id: 'development',
            title: 'System Acquisition, Development and Maintenance (A.14)',
            content: 'Security requirements and security in development/support processes.',
            order: 10,
        },
        {
            id: 'supplier',
            title: 'Supplier Relationships (A.15)',
            content: 'Information security in supplier relationships.',
            order: 11,
        },
        {
            id: 'incident',
            title: 'Information Security Incident Management (A.16)',
            content: 'Management of information security incidents and improvements.',
            order: 12,
        },
        {
            id: 'business-continuity',
            title: 'Business Continuity (A.17)',
            content: 'Information security continuity and redundancies.',
            order: 13,
        },
        {
            id: 'compliance',
            title: 'Compliance (A.18)',
            content: 'Compliance with legal and contractual requirements.',
            order: 14,
        },
    ],
};
/**
 * Get template for a specific framework
 */
function getTemplate(framework) {
    switch (framework) {
        case 'SOC2':
            return exports.SOC2_TEMPLATE;
        case 'GDPR':
            return exports.GDPR_TEMPLATE;
        case 'ISO27001':
            return exports.ISO27001_TEMPLATE;
        default:
            throw new Error(`Unknown framework: ${framework}`);
    }
}
/**
 * Get all available templates
 */
function getAllTemplates() {
    return [exports.SOC2_TEMPLATE, exports.GDPR_TEMPLATE, exports.ISO27001_TEMPLATE];
}
//# sourceMappingURL=report-template.js.map