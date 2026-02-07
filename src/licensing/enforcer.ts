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

export class LicenseEnforcer {
  constructor(private limits: TierLimits) {}

  /**
   * Check what features are allowed and adjust request accordingly
   */
  enforce(context: EnforcementContext): EnforcementResult {
    const warnings: string[] = [];
    const blockedFeatures: string[] = [];
    let adjustedFrameworks = [...context.requestedFrameworks];
    let adjustedReportFormat = context.reportFormat;

    // Check private repo access
    if (context.isPrivateRepo && !this.limits.privateRepos) {
      blockedFeatures.push('private-repos');
      warnings.push(
        `Private repository scanning requires a paid plan. ` +
          `Upgrade at https://github.com/m0rphsec/compliance-autopilot#-pricing`
      );
    }

    // Check framework access
    const allowedFrameworks = adjustedFrameworks.filter((fw) =>
      this.limits.frameworks.includes(fw)
    );
    const blockedFrameworksList = adjustedFrameworks.filter(
      (fw) => !this.limits.frameworks.includes(fw)
    );

    if (blockedFrameworksList.length > 0) {
      blockedFeatures.push(...blockedFrameworksList.map((fw) => `framework-${fw}`));
      warnings.push(
        `Framework(s) ${blockedFrameworksList.join(', ')} require a paid plan. ` +
          `Using available frameworks: ${allowedFrameworks.join(', ')}`
      );
      adjustedFrameworks = allowedFrameworks as ComplianceFramework[];
    }

    // Check PDF reports
    if (
      (context.reportFormat === 'pdf' || context.reportFormat === 'both') &&
      !this.limits.pdfReports
    ) {
      blockedFeatures.push('pdf-reports');
      adjustedReportFormat = 'json';
      warnings.push(`PDF reports require Starter plan or higher. Using JSON format.`);
    }

    // Check Slack integration
    if (context.slackWebhook && !this.limits.slackIntegration) {
      blockedFeatures.push('slack-integration');
      warnings.push(`Slack integration requires Pro plan or higher. Slack notifications disabled.`);
    }

    // Determine if we can proceed
    const allowed =
      adjustedFrameworks.length > 0 && (this.limits.privateRepos || !context.isPrivateRepo);

    return {
      allowed,
      tier: this.limits.tier,
      warnings,
      blockedFeatures,
      adjustedFrameworks,
      adjustedReportFormat,
    };
  }

  /**
   * Get a user-friendly tier display name
   */
  static getTierDisplayName(tier: LicenseTier): string {
    const names: Record<LicenseTier, string> = {
      free: 'Free',
      starter: 'Starter ($149/mo)',
      pro: 'Pro ($299/mo)',
      enterprise: 'Enterprise',
    };
    return names[tier];
  }

  /**
   * Generate upgrade prompt based on blocked features
   */
  static getUpgradePrompt(blockedFeatures: string[]): string {
    const lines = [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      '║  🚀 UPGRADE TO UNLOCK MORE FEATURES                          ║',
      '╠══════════════════════════════════════════════════════════════╣',
    ];

    if (blockedFeatures.includes('private-repos')) {
      lines.push('║  ✓ Private repository scanning                               ║');
    }
    if (blockedFeatures.some((f) => f.startsWith('framework-'))) {
      lines.push('║  ✓ All compliance frameworks (SOC2, GDPR, ISO27001)          ║');
    }
    if (blockedFeatures.includes('pdf-reports')) {
      lines.push('║  ✓ Professional PDF reports for auditors                     ║');
    }
    if (blockedFeatures.includes('slack-integration')) {
      lines.push('║  ✓ Slack alerts for compliance violations                    ║');
    }

    lines.push('║                                                              ║');
    lines.push('║  👉 https://github.com/m0rphsec/compliance-autopilot         ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    return lines.join('\n');
  }
}
