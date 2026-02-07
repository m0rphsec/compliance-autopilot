"use strict";
/**
 * PDF Generator for Compliance Reports
 * Generates professional, accessible PDF reports with branding
 * Performance target: <5 seconds for report generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerator = void 0;
const pdf_lib_1 = require("pdf-lib");
// Brand colors (WCAG AA compliant)
const COLORS = {
    primary: (0, pdf_lib_1.rgb)(0.098, 0.29, 0.569), // Blue #1949A1
    secondary: (0, pdf_lib_1.rgb)(0.129, 0.588, 0.459), // Green #21967A
    success: (0, pdf_lib_1.rgb)(0.133, 0.545, 0.133), // Green #228B22
    warning: (0, pdf_lib_1.rgb)(0.961, 0.608, 0.102), // Orange #F59B1A
    danger: (0, pdf_lib_1.rgb)(0.863, 0.196, 0.184), // Red #DC322F
    text: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2), // Dark gray
    textLight: (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4), // Medium gray
    background: (0, pdf_lib_1.rgb)(0.98, 0.98, 0.98), // Light gray
    white: (0, pdf_lib_1.rgb)(1, 1, 1),
};
const FONT_SIZES = {
    title: 32,
    heading1: 24,
    heading2: 18,
    heading3: 14,
    body: 11,
    small: 9,
};
const MARGINS = {
    top: 60,
    bottom: 60,
    left: 60,
    right: 60,
};
/**
 * Professional PDF report generator with accessibility features
 */
class PDFGenerator {
    pdfDoc;
    currentPage;
    currentY = 0;
    fonts;
    /**
     * Generate PDF report from compliance data
     * @param data Compliance scan results
     * @returns PDF as Uint8Array
     */
    async generate(data) {
        // Validate input
        this.validateData(data);
        // Create new PDF document
        this.pdfDoc = await pdf_lib_1.PDFDocument.create();
        // Set metadata for accessibility
        const allFrameworks = (data.frameworks || [data.framework]).join(', ');
        this.pdfDoc.setTitle(`${allFrameworks} Compliance Report - ${data.repositoryName}`);
        this.pdfDoc.setAuthor('Compliance Autopilot');
        this.pdfDoc.setSubject(`${allFrameworks} Compliance Evidence Report`);
        this.pdfDoc.setKeywords([data.framework, 'compliance', 'audit', data.repositoryName]);
        this.pdfDoc.setCreator('Compliance Autopilot v1.0.0');
        this.pdfDoc.setProducer('pdf-lib');
        this.pdfDoc.setCreationDate(data.timestamp);
        // Load fonts
        await this.loadFonts();
        // Generate report sections
        await this.generateCoverPage(data);
        await this.generateExecutiveSummary(data);
        await this.generateControlFindings(data);
        await this.generateViolationDetails(data);
        await this.generateRecommendations(data);
        // Add page numbers
        this.addPageNumbers();
        // Serialize to bytes
        return await this.pdfDoc.save();
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
        if (!data.repositoryName || !data.repositoryOwner) {
            throw new Error('Repository name and owner are required');
        }
        if (typeof data.overallScore !== 'number' || data.overallScore < 0 || data.overallScore > 100) {
            throw new Error('Overall score must be a number between 0 and 100');
        }
        if (!Array.isArray(data.controls)) {
            throw new Error('Controls must be an array');
        }
        if (!data.summary || typeof data.summary !== 'object') {
            throw new Error('Summary is required');
        }
    }
    /**
     * Load fonts for PDF
     */
    async loadFonts() {
        this.fonts = {
            regular: await this.pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica),
            bold: await this.pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold),
            italic: await this.pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaOblique),
            mono: await this.pdfDoc.embedFont(pdf_lib_1.StandardFonts.Courier),
        };
    }
    /**
     * Generate cover page with score and branding
     */
    async generateCoverPage(data) {
        this.currentPage = this.pdfDoc.addPage([612, 792]); // Letter size
        const { width, height } = this.currentPage.getSize();
        this.currentY = height - MARGINS.top;
        // Header band
        this.currentPage.drawRectangle({
            x: 0,
            y: height - 200,
            width,
            height: 200,
            color: COLORS.primary,
        });
        // Title (sized to not overlap with score circle)
        this.currentPage.drawText('COMPLIANCE REPORT', {
            x: MARGINS.left,
            y: height - 80,
            size: 28,
            font: this.fonts.bold,
            color: COLORS.white,
        });
        // Framework badges - show all frameworks
        const frameworkList = data.frameworks || [data.framework];
        const badgeHeight = 30;
        const badgeSpacing = 10;
        let badgeX = MARGINS.left;
        const badgeY = height - 130;
        for (const fw of frameworkList) {
            const fwText = fw.toUpperCase();
            const textWidth = this.fonts.bold.widthOfTextAtSize(fwText, FONT_SIZES.heading3);
            const badgeWidth = textWidth + 24;
            this.currentPage.drawRectangle({
                x: badgeX,
                y: badgeY,
                width: badgeWidth,
                height: badgeHeight,
                color: COLORS.secondary,
            });
            this.currentPage.drawText(fwText, {
                x: badgeX + 12,
                y: badgeY + 9,
                size: FONT_SIZES.heading3,
                font: this.fonts.bold,
                color: COLORS.white,
            });
            badgeX += badgeWidth + badgeSpacing;
        }
        // Compliance score circle (positioned in upper-right of header)
        const scoreRadius = 60;
        const scoreX = width - MARGINS.right - scoreRadius;
        const scoreY = height - 100;
        this.drawCircle(scoreX, scoreY, scoreRadius, this.getScoreColor(data.overallScore));
        const scoreText = `${data.overallScore.toFixed(1)}%`;
        const scoreTextSize = 26;
        const scoreWidth = this.fonts.bold.widthOfTextAtSize(scoreText, scoreTextSize);
        this.currentPage.drawText(scoreText, {
            x: scoreX - scoreWidth / 2,
            y: scoreY - 10,
            size: scoreTextSize,
            font: this.fonts.bold,
            color: COLORS.white,
        });
        // Repository information
        this.currentY = height - 250;
        this.drawText(`Repository: ${data.repositoryOwner}/${data.repositoryName}`, {
            font: this.fonts.regular,
            size: FONT_SIZES.body,
            color: COLORS.text,
        });
        this.drawText(`Generated: ${this.formatDate(data.timestamp)}`, {
            font: this.fonts.regular,
            size: FONT_SIZES.body,
            color: COLORS.textLight,
        });
        // Status summary boxes
        this.currentY -= 40;
        this.drawSummaryBoxes(data.summary);
        // Footer
        this.currentPage.drawText('Generated by Compliance Autopilot', {
            x: MARGINS.left,
            y: MARGINS.bottom - 20,
            size: FONT_SIZES.small,
            font: this.fonts.italic,
            color: COLORS.textLight,
        });
    }
    /**
     * Generate executive summary section
     */
    async generateExecutiveSummary(data) {
        this.addPage();
        this.drawHeading1('Executive Summary');
        // Overall assessment
        const passRate = (data.summary.passed / data.summary.total) * 100;
        const status = passRate >= 90 ? 'Excellent' : passRate >= 75 ? 'Good' : passRate >= 60 ? 'Fair' : 'Poor';
        this.drawText(`Overall Compliance Status: ${status}`, {
            font: this.fonts.bold,
            size: FONT_SIZES.heading3,
            color: this.getScoreColor(data.overallScore),
        });
        this.currentY -= 20;
        const frameworkLabel = (data.frameworks || [data.framework]).join(', ');
        this.drawText(`This report summarizes the ${frameworkLabel} compliance assessment for ` +
            `${data.repositoryOwner}/${data.repositoryName} as of ${this.formatDate(data.timestamp)}.`, {
            font: this.fonts.regular,
            size: FONT_SIZES.body,
            color: COLORS.text,
            maxWidth: this.getPageWidth() - MARGINS.left - MARGINS.right,
        });
        // Key findings
        this.currentY -= 30;
        this.drawHeading2('Key Findings');
        this.drawBulletList([
            `${data.summary.passed} of ${data.summary.total} controls passed (${passRate.toFixed(1)}%)`,
            `${data.summary.failed} controls failed and require immediate attention`,
            `${data.summary.notApplicable} controls marked as not applicable`,
            `${this.countCriticalViolations(data.controls)} critical violations detected`,
        ]);
        // Critical failures
        const criticalFailures = data.controls.filter((c) => c.status === 'FAIL' && c.severity === 'critical');
        if (criticalFailures.length > 0) {
            this.currentY -= 30;
            this.drawHeading2('Critical Failures');
            criticalFailures.forEach((control) => {
                this.drawText(`• ${control.id}: ${control.name}`, {
                    font: this.fonts.bold,
                    size: FONT_SIZES.body,
                    color: COLORS.danger,
                });
            });
        }
    }
    /**
     * Generate control-by-control findings
     */
    async generateControlFindings(data) {
        this.addPage();
        this.drawHeading1('Control Findings');
        for (const control of data.controls) {
            // Check if we need a new page
            if (this.currentY < MARGINS.bottom + 150) {
                this.addPage();
            }
            // Control header
            const statusIcon = this.getStatusIcon(control.status);
            const statusColor = this.getStatusColor(control.status);
            this.drawText(`${statusIcon} ${control.id}: ${control.name}`, {
                font: this.fonts.bold,
                size: FONT_SIZES.heading3,
                color: statusColor,
            });
            // Status and severity
            this.drawText(`Status: ${control.status} | Severity: ${control.severity.toUpperCase()}`, {
                font: this.fonts.regular,
                size: FONT_SIZES.small,
                color: COLORS.textLight,
            });
            // Evidence
            this.currentY -= 10;
            this.drawText('Evidence:', {
                font: this.fonts.bold,
                size: FONT_SIZES.body,
                color: COLORS.text,
            });
            this.drawText(control.evidence, {
                font: this.fonts.regular,
                size: FONT_SIZES.body,
                color: COLORS.text,
                maxWidth: this.getPageWidth() - MARGINS.left - MARGINS.right - 20,
                indent: 20,
            });
            this.currentY -= 20;
        }
    }
    /**
     * Generate detailed violation information
     */
    async generateViolationDetails(data) {
        const controlsWithViolations = data.controls.filter((c) => c.violations && c.violations.length > 0);
        if (controlsWithViolations.length === 0) {
            return;
        }
        this.addPage();
        this.drawHeading1('Violation Details');
        for (const control of controlsWithViolations) {
            if (!control.violations)
                continue;
            // Check if we need a new page
            if (this.currentY < MARGINS.bottom + 200) {
                this.addPage();
            }
            this.drawHeading2(`${control.id}: ${control.name}`);
            for (let i = 0; i < control.violations.length; i++) {
                const violation = control.violations[i];
                this.drawText(`Violation ${i + 1}: ${violation.file}:${violation.line}`, {
                    font: this.fonts.bold,
                    size: FONT_SIZES.body,
                    color: COLORS.danger,
                });
                // Code snippet with background
                this.currentY -= 5;
                const codeBoxHeight = 60;
                this.currentPage.drawRectangle({
                    x: MARGINS.left + 10,
                    y: this.currentY - codeBoxHeight,
                    width: this.getPageWidth() - MARGINS.left - MARGINS.right - 20,
                    height: codeBoxHeight,
                    color: COLORS.background,
                    borderColor: COLORS.textLight,
                    borderWidth: 1,
                });
                this.drawText(violation.code, {
                    font: this.fonts.mono,
                    size: FONT_SIZES.small,
                    color: COLORS.text,
                    y: this.currentY - 20,
                    indent: 20,
                });
                this.currentY -= codeBoxHeight + 10;
                this.drawText(`Recommendation: ${violation.recommendation}`, {
                    font: this.fonts.italic,
                    size: FONT_SIZES.body,
                    color: COLORS.text,
                    maxWidth: this.getPageWidth() - MARGINS.left - MARGINS.right - 20,
                    indent: 20,
                });
                this.currentY -= 15;
            }
            this.currentY -= 10;
        }
    }
    /**
     * Generate recommendations section
     */
    async generateRecommendations(data) {
        this.addPage();
        this.drawHeading1('Recommendations');
        const failedControls = data.controls.filter((c) => c.status === 'FAIL');
        if (failedControls.length === 0) {
            this.drawText('No recommendations. All controls passed!', {
                font: this.fonts.regular,
                size: FONT_SIZES.body,
                color: COLORS.success,
            });
            return;
        }
        // Group by severity
        const bySeverity = {
            critical: failedControls.filter((c) => c.severity === 'critical'),
            high: failedControls.filter((c) => c.severity === 'high'),
            medium: failedControls.filter((c) => c.severity === 'medium'),
            low: failedControls.filter((c) => c.severity === 'low'),
        };
        for (const [severity, controls] of Object.entries(bySeverity)) {
            if (controls.length === 0)
                continue;
            this.drawHeading2(`${severity.toUpperCase()} Priority (${controls.length})`);
            controls.forEach((control) => {
                this.drawText(`• ${control.id}: ${control.name}`, {
                    font: this.fonts.regular,
                    size: FONT_SIZES.body,
                    color: COLORS.text,
                });
            });
            this.currentY -= 15;
        }
        // Next steps
        this.currentY -= 20;
        this.drawHeading2('Next Steps');
        this.drawBulletList([
            'Address all critical severity violations immediately',
            'Create remediation plan for high and medium priority items',
            'Schedule follow-up scan after fixes are implemented',
            'Document all changes for audit trail',
            'Review findings with compliance team',
        ]);
    }
    // Helper methods
    addPage() {
        this.currentPage = this.pdfDoc.addPage([612, 792]);
        this.currentY = this.currentPage.getSize().height - MARGINS.top;
    }
    getPageWidth() {
        return this.currentPage.getSize().width;
    }
    drawHeading1(text) {
        this.drawText(text, {
            font: this.fonts.bold,
            size: FONT_SIZES.heading1,
            color: COLORS.primary,
        });
        this.currentY -= 10;
    }
    drawHeading2(text) {
        this.drawText(text, {
            font: this.fonts.bold,
            size: FONT_SIZES.heading2,
            color: COLORS.primary,
        });
        this.currentY -= 5;
    }
    /**
     * Sanitize text to only include WinAnsiEncoding compatible characters
     */
    sanitizeText(text) {
        return text
            .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
            .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
            .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // Bullets to dash
            .replace(/[\u2013\u2014]/g, '-') // En/Em dash to regular dash
            .replace(/[\u2026]/g, '...') // Ellipsis
            .replace(/[\u00A0]/g, ' ') // Non-breaking space
            .replace(/[^\u0020-\u00FF]/g, ''); // Remove any other non-Latin1 chars
    }
    drawText(text, options) {
        const sanitizedText = this.sanitizeText(text);
        const font = options.font || this.fonts.regular;
        const size = options.size || FONT_SIZES.body;
        const color = options.color || COLORS.text;
        const x = MARGINS.left + (options.indent || 0);
        const y = options.y !== undefined ? options.y : this.currentY;
        if (options.maxWidth) {
            // Wrap text
            const lines = this.wrapText(sanitizedText, font, size, options.maxWidth);
            lines.forEach((line, i) => {
                this.currentPage.drawText(line, {
                    x,
                    y: y - i * (size + 4),
                    size,
                    font,
                    color,
                });
            });
            this.currentY = y - lines.length * (size + 4) - 5;
        }
        else {
            this.currentPage.drawText(sanitizedText, {
                x,
                y,
                size,
                font,
                color,
            });
            this.currentY = y - size - 5;
        }
    }
    drawBulletList(items) {
        items.forEach((item) => {
            this.drawText(`- ${item}`, {
                font: this.fonts.regular,
                size: FONT_SIZES.body,
                color: COLORS.text,
                maxWidth: this.getPageWidth() - MARGINS.left - MARGINS.right - 20,
                indent: 10,
            });
        });
    }
    drawCircle(x, y, radius, color) {
        // Approximate circle with polygon
        const segments = 32;
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;
            this.currentPage.drawLine({
                start: { x: x + Math.cos(angle1) * radius, y: y + Math.sin(angle1) * radius },
                end: { x: x + Math.cos(angle2) * radius, y: y + Math.sin(angle2) * radius },
                thickness: 2,
                color,
            });
        }
        // Fill circle (simplified)
        this.currentPage.drawCircle({
            x,
            y,
            size: radius,
            color,
        });
    }
    drawSummaryBoxes(summary) {
        const boxWidth = 100;
        const boxHeight = 60;
        const spacing = 20;
        const startX = MARGINS.left;
        const boxes = [
            { label: 'Passed', value: summary.passed, color: COLORS.success },
            { label: 'Failed', value: summary.failed, color: COLORS.danger },
            { label: 'N/A', value: summary.notApplicable, color: COLORS.textLight },
        ];
        boxes.forEach((box, i) => {
            const x = startX + i * (boxWidth + spacing);
            this.currentPage.drawRectangle({
                x,
                y: this.currentY - boxHeight,
                width: boxWidth,
                height: boxHeight,
                color: COLORS.white,
                borderColor: box.color,
                borderWidth: 2,
            });
            this.currentPage.drawText(box.value.toString(), {
                x: x + boxWidth / 2 - 10,
                y: this.currentY - 30,
                size: FONT_SIZES.heading1,
                font: this.fonts.bold,
                color: box.color,
            });
            this.currentPage.drawText(box.label, {
                x: x + boxWidth / 2 - 20,
                y: this.currentY - 50,
                size: FONT_SIZES.body,
                font: this.fonts.regular,
                color: COLORS.text,
            });
        });
        this.currentY -= boxHeight + spacing;
    }
    wrapText(text, font, size, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach((word) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, size);
            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            }
            else {
                currentLine = testLine;
            }
        });
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }
    addPageNumbers() {
        const pages = this.pdfDoc.getPages();
        const totalPages = pages.length;
        pages.forEach((page, i) => {
            const pageNum = i + 1;
            const text = `Page ${pageNum} of ${totalPages}`;
            const { width } = page.getSize();
            const textWidth = this.fonts.regular.widthOfTextAtSize(text, FONT_SIZES.small);
            page.drawText(text, {
                x: width - MARGINS.right - textWidth,
                y: MARGINS.bottom - 30,
                size: FONT_SIZES.small,
                font: this.fonts.regular,
                color: COLORS.textLight,
            });
        });
    }
    getScoreColor(score) {
        if (score >= 90)
            return COLORS.success;
        if (score >= 75)
            return COLORS.warning;
        return COLORS.danger;
    }
    getStatusColor(status) {
        switch (status) {
            case 'PASS':
                return COLORS.success;
            case 'FAIL':
                return COLORS.danger;
            default:
                return COLORS.textLight;
        }
    }
    getStatusIcon(status) {
        switch (status) {
            case 'PASS':
                return '✓';
            case 'FAIL':
                return '✗';
            default:
                return '○';
        }
    }
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        });
    }
    countCriticalViolations(controls) {
        return controls.reduce((count, control) => {
            if (control.severity === 'critical' && control.violations) {
                return count + control.violations.length;
            }
            return count;
        }, 0);
    }
}
exports.PDFGenerator = PDFGenerator;
//# sourceMappingURL=pdf-generator.js.map