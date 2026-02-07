/**
 * License Validator
 * Validates license keys against the licensing API
 */

import { LicenseTier, TierLimits, getTierLimits } from './tiers';

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

// Default validation endpoint - user will configure their own
const DEFAULT_LICENSE_API = 'https://compliance-autopilot-license.taylsec.workers.dev/validate';

export class LicenseValidator {
  private apiEndpoint: string;
  private cachedResult: LicenseValidationResult | null = null;
  private cacheExpiry: number = 0;
  private cacheDurationMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(apiEndpoint?: string) {
    this.apiEndpoint = apiEndpoint || DEFAULT_LICENSE_API;
  }

  /**
   * Validate a license key
   * Returns free tier if no key provided or validation fails
   */
  async validate(licenseKey?: string): Promise<LicenseValidationResult> {
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
      } else {
        // Invalid key - fall back to free tier with warning
        return this.createResult('free', undefined, response.error || 'Invalid license key');
      }
    } catch (error) {
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
  private async callApi(licenseKey: string): Promise<LicenseApiResponse> {
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

      return (await response.json()) as LicenseApiResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Create a validation result
   */
  private createResult(
    tier: LicenseTier,
    expiresAt?: string,
    error?: string
  ): LicenseValidationResult {
    return {
      valid: !error,
      tier,
      limits: getTierLimits(tier),
      expiresAt,
      error,
    };
  }

  /**
   * Cache the validation result
   */
  private cacheResult(result: LicenseValidationResult): void {
    this.cachedResult = result;
    this.cacheExpiry = Date.now() + this.cacheDurationMs;
  }
}

/**
 * Singleton instance for convenience
 */
let validatorInstance: LicenseValidator | null = null;

export function getLicenseValidator(apiEndpoint?: string): LicenseValidator {
  if (!validatorInstance) {
    validatorInstance = new LicenseValidator(apiEndpoint);
  }
  return validatorInstance;
}
