"use strict";
/**
 * License Validator
 * Validates license keys against the licensing API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseValidator = void 0;
exports.getLicenseValidator = getLicenseValidator;
const tiers_1 = require("./tiers");
// Default validation endpoint - user will configure their own
const DEFAULT_LICENSE_API = 'https://compliance-autopilot-license.taylsec.workers.dev/validate';
class LicenseValidator {
    apiEndpoint;
    cachedResult = null;
    cacheExpiry = 0;
    cacheDurationMs = 5 * 60 * 1000; // 5 minutes
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint || DEFAULT_LICENSE_API;
    }
    /**
     * Validate a license key
     * Returns free tier if no key provided or validation fails
     */
    async validate(licenseKey) {
        // No license key = free tier
        if (!licenseKey || licenseKey.trim() === '') {
            return this.createResult('free');
        }
        // Check cache
        if (this.cachedResult && Date.now() < this.cacheExpiry) {
            return this.cachedResult;
        }
        try {
            const response = await this.callApi(licenseKey);
            if (response.valid) {
                const result = this.createResult(response.tier, response.expiresAt);
                this.cacheResult(result);
                return result;
            }
            else {
                // Invalid key - fall back to free tier with warning
                return this.createResult('free', undefined, response.error || 'Invalid license key');
            }
        }
        catch (error) {
            // API error - gracefully degrade to free tier
            // Don't block the user if our license server is down
            const errorMessage = error instanceof Error ? error.message : 'License validation failed';
            console.warn(`License validation failed: ${errorMessage}. Continuing with free tier.`);
            return this.createResult('free', undefined, errorMessage);
        }
    }
    /**
     * Call the license validation API
     */
    async callApi(licenseKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        try {
            const response = await fetch(`${this.apiEndpoint}?key=${encodeURIComponent(licenseKey)}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'compliance-autopilot/1.0.0',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 404) {
                    return { valid: false, tier: 'free', error: 'License key not found' };
                }
                throw new Error(`License API returned ${response.status}`);
            }
            return (await response.json());
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    /**
     * Create a validation result
     */
    createResult(tier, expiresAt, error) {
        return {
            valid: !error,
            tier,
            limits: (0, tiers_1.getTierLimits)(tier),
            expiresAt,
            error,
        };
    }
    /**
     * Cache the validation result
     */
    cacheResult(result) {
        this.cachedResult = result;
        this.cacheExpiry = Date.now() + this.cacheDurationMs;
    }
}
exports.LicenseValidator = LicenseValidator;
/**
 * Singleton instance for convenience
 */
let validatorInstance = null;
function getLicenseValidator(apiEndpoint) {
    if (!validatorInstance) {
        validatorInstance = new LicenseValidator(apiEndpoint);
    }
    return validatorInstance;
}
//# sourceMappingURL=validator.js.map