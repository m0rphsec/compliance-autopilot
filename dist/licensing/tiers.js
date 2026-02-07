"use strict";
/**
 * License Tier Definitions
 * Defines what features each pricing tier has access to
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_LIMITS = void 0;
exports.getTierLimits = getTierLimits;
exports.TIER_LIMITS = {
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
function getTierLimits(tier) {
    return exports.TIER_LIMITS[tier] || exports.TIER_LIMITS.free;
}
//# sourceMappingURL=tiers.js.map