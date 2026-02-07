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

export const TIER_LIMITS: Record<LicenseTier, TierLimits> = {
  free: {
    tier: 'free',
    privateRepos: false,
    maxPrivateRepos: 0,
    frameworks: ['soc2'],
    maxScansPerMonth: 100,
    pdfReports: false,
    slackIntegration: false,
    customControls: false,
    prioritySupport: false,
  },
  starter: {
    tier: 'starter',
    privateRepos: true,
    maxPrivateRepos: 1,
    frameworks: ['soc2', 'gdpr', 'iso27001'],
    maxScansPerMonth: -1, // unlimited
    pdfReports: true,
    slackIntegration: false,
    customControls: false,
    prioritySupport: false,
  },
  pro: {
    tier: 'pro',
    privateRepos: true,
    maxPrivateRepos: 5,
    frameworks: ['soc2', 'gdpr', 'iso27001'],
    maxScansPerMonth: -1,
    pdfReports: true,
    slackIntegration: true,
    customControls: true,
    prioritySupport: true,
  },
  enterprise: {
    tier: 'enterprise',
    privateRepos: true,
    maxPrivateRepos: -1, // unlimited
    frameworks: ['soc2', 'gdpr', 'iso27001'],
    maxScansPerMonth: -1,
    pdfReports: true,
    slackIntegration: true,
    customControls: true,
    prioritySupport: true,
  },
};

export function getTierLimits(tier: LicenseTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}
