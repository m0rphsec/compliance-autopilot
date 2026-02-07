/**
 * Report Templates
 * Reusable templates for different compliance frameworks
 */
export interface ReportTemplate {
    framework: string;
    title: string;
    description: string;
    sections: ReportSection[];
}
export interface ReportSection {
    id: string;
    title: string;
    content: string;
    order: number;
}
/**
 * SOC2 Report Template
 */
export declare const SOC2_TEMPLATE: ReportTemplate;
/**
 * GDPR Report Template
 */
export declare const GDPR_TEMPLATE: ReportTemplate;
/**
 * ISO27001 Report Template
 */
export declare const ISO27001_TEMPLATE: ReportTemplate;
/**
 * Get template for a specific framework
 */
export declare function getTemplate(framework: string): ReportTemplate;
/**
 * Get all available templates
 */
export declare function getAllTemplates(): ReportTemplate[];
//# sourceMappingURL=report-template.d.ts.map