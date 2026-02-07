/**
 * License Tier Definitions
 * Defines what features each pricing tier has access to
 */
export type LicenseTier = 'free' | 'starter' | 'pro' | 'enterprise';
export interface TierLimits {
    tier: LicenseTier;
    privateRepos: boolean;
    maxPrivateRepos: number;
    frameworks: string[];
    maxScansPerMonth: number;
    pdfReports: boolean;
    slackIntegration: boolean;
    customControls: boolean;
    prioritySupport: boolean;
}
export declare const TIER_LIMITS: Record<LicenseTier, TierLimits>;
export declare function getTierLimits(tier: LicenseTier): TierLimits;
//# sourceMappingURL=tiers.d.ts.map