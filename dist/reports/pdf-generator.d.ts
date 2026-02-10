/**
 * PDF Generator for Compliance Reports
 * Generates professional, accessible PDF reports with branding
 * Performance target: <5 seconds for report generation
 */
export interface ComplianceData {
    framework: 'SOC2' | 'GDPR' | 'ISO27001';
    frameworks?: string[];
    timestamp: Date;
    repositoryName: string;
    repositoryOwner: string;
    overallScore: number;
    controls: ControlResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        notApplicable: number;
    };
}
export interface ControlResult {
    id: string;
    name: string;
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
    evidence: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    violations?: Violation[];
    recommendations?: string[];
}
export interface Violation {
    file: string;
    line: number;
    code: string;
    recommendation: string;
}
/**
 * Professional PDF report generator with accessibility features
 */
export declare class PDFGenerator {
    private pdfDoc;
    private currentPage;
    private currentY;
    private fonts;
    /**
     * Generate PDF report from compliance data
     * @param data Compliance scan results
     * @returns PDF as Uint8Array
     */
    generate(data: ComplianceData): Promise<Uint8Array>;
    /**
     * Validate compliance data structure
     */
    private validateData;
    /**
     * Load fonts for PDF
     */
    private loadFonts;
    /**
     * Generate cover page with score and branding
     */
    private generateCoverPage;
    /**
     * Generate executive summary section
     */
    private generateExecutiveSummary;
    /**
     * Generate control-by-control findings
     */
    private generateControlFindings;
    /**
     * Generate detailed violation information
     */
    private generateViolationDetails;
    /**
     * Generate recommendations section
     */
    private generateRecommendations;
    private addPage;
    private getPageWidth;
    private drawHeading1;
    private drawHeading2;
    /**
     * Sanitize text to only include WinAnsiEncoding compatible characters
     */
    private sanitizeText;
    private drawText;
    private drawBulletList;
    private drawCircle;
    private drawSummaryBoxes;
    private wrapText;
    private addPageNumbers;
    private getScoreColor;
    private getStatusColor;
    private getStatusIcon;
    private formatDate;
    private countCriticalViolations;
}
//# sourceMappingURL=pdf-generator.d.ts.map