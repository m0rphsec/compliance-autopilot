/**
 * JSON Formatter for Compliance Evidence
 * Provides structured JSON output for programmatic access
 */
import { ComplianceData } from './pdf-generator';
interface JSONSchema {
    type: string;
    properties: Record<string, any>;
    required: string[];
}
/**
 * JSON formatter for compliance evidence
 */
export declare class JSONFormatter {
    private readonly version;
    /**
     * Format compliance data as JSON string
     * @param data Compliance scan results
     * @returns JSON string
     */
    format(data: ComplianceData): string;
    /**
     * Format compliance data as pretty-printed JSON
     * @param data Compliance scan results
     * @returns Formatted JSON string with indentation
     */
    formatPretty(data: ComplianceData): string;
    /**
     * Get JSON schema for compliance data
     * @returns JSON Schema object
     */
    getSchema(): JSONSchema;
    /**
     * Validate compliance data structure
     */
    private validateData;
    /**
     * Format compliance data to structured output
     */
    private formatData;
    /**
     * Format individual control result
     */
    private formatControl;
    /**
     * Format violation details
     */
    private formatViolation;
    /**
     * Calculate compliance grade from pass rate
     */
    private calculateGrade;
}
export {};
//# sourceMappingURL=json-formatter.d.ts.map