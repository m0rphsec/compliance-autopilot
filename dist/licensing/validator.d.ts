/**
 * License Validator
 * Validates license keys against the licensing API
 */
import { LicenseTier, TierLimits } from './tiers';
export interface LicenseValidationResult {
    valid: boolean;
    tier: LicenseTier;
    limits: TierLimits;
    expiresAt?: string;
    error?: string;
}
export interface LicenseApiResponse {
    valid: boolean;
    tier: LicenseTier;
    expiresAt?: string;
    error?: string;
}
export declare class LicenseValidator {
    private apiEndpoint;
    private cachedResult;
    private cacheExpiry;
    private cacheDurationMs;
    constructor(apiEndpoint?: string);
    /**
     * Validate a license key
     * Returns free tier if no key provided or validation fails
     */
    validate(licenseKey?: string): Promise<LicenseValidationResult>;
    /**
     * Call the license validation API
     */
    private callApi;
    /**
     * Create a validation result
     */
    private createResult;
    /**
     * Cache the validation result
     */
    private cacheResult;
}
export declare function getLicenseValidator(apiEndpoint?: string): LicenseValidator;
//# sourceMappingURL=validator.d.ts.map