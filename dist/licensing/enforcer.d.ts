/**
 * License Enforcer
 * Checks if operations are allowed based on license tier
 */
import { TierLimits, LicenseTier } from './tiers';
import { ComplianceFramework } from '../types';
export interface EnforcementContext {
    isPrivateRepo: boolean;
    repoCount?: number;
    requestedFrameworks: ComplianceFramework[];
    reportFormat: string;
    slackWebhook?: string;
}
export interface EnforcementResult {
    allowed: boolean;
    tier: LicenseTier;
    warnings: string[];
    blockedFeatures: string[];
    adjustedFrameworks: ComplianceFramework[];
    adjustedReportFormat: string;
}
export declare class LicenseEnforcer {
    private limits;
    constructor(limits: TierLimits);
    /**
     * Check what features are allowed and adjust request accordingly
     */
    enforce(context: EnforcementContext): EnforcementResult;
    /**
     * Get a user-friendly tier display name
     */
    static getTierDisplayName(tier: LicenseTier): string;
    /**
     * Generate upgrade prompt based on blocked features
     */
    static getUpgradePrompt(blockedFeatures: string[]): string;
}
//# sourceMappingURL=enforcer.d.ts.map