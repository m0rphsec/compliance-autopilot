# Compliance Collectors

This directory contains collectors for various compliance frameworks:

## ISO27001 Collector

**File**: `iso27001.ts`

### Overview
Implements evidence collection for ISO/IEC 27001:2022 Information Security Management System. Focuses on 20 high-value, automatable controls across organizational, people, technological, and operational security domains.

### Features
- ✅ **20 High-Value Controls** (A.5, A.6, A.8, A.12, A.14, A.16, A.17, A.18)
- ✅ **Parallel Execution** for performance (<30s for standard repos)
- ✅ **GitHub API Integration** for evidence collection
- ✅ **Risk Assessment** with severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- ✅ **Standardized Evidence Format** compatible with SOC2/GDPR collectors
- ✅ **95%+ Test Coverage**

### Implemented Controls

#### A.5 - Organizational Controls
- **A.5.1** - Policies for information security
- **A.5.7** - Threat intelligence
- **A.5.23** - Cloud service security

#### A.6 - People Controls
- **A.6.1** - Screening (Manual Review)
- **A.6.2** - Terms and conditions of employment
- **A.6.3** - Security awareness training (Manual Review)

#### A.8 - Technological Controls
- **A.8.2** - Privileged access rights
- **A.8.3** - Information access restriction
- **A.8.5** - Secure authentication
- **A.8.9** - Configuration management

#### A.12 - Operations Security
- **A.12.1** - Documented operating procedures
- **A.12.2** - Change management
- **A.12.4** - Logging and monitoring

#### A.14 - System Acquisition, Development and Maintenance
- **A.14.1** - Security requirements analysis
- **A.14.2** - Secure development policy
- **A.14.3** - Application security requirements

#### A.16 - Information Security Incident Management
- **A.16.1** - Management responsibilities and procedures

#### A.17 - Business Continuity
- **A.17.1** - Planning information security continuity

#### A.18 - Compliance
- **A.18.1** - Compliance with legal and contractual requirements
- **A.18.2** - Information security reviews

### Usage

```typescript
import { ISO27001Collector } from './collectors/iso27001';
import { CollectorConfig } from './types/evidence';

const collector = new ISO27001Collector();

const config: CollectorConfig = {
  context: {
    owner: 'your-org',
    repo: 'your-repo',
    token: process.env.GITHUB_TOKEN,
    branch: 'main',
  },
  parallel: true, // Run controls in parallel
  enabledControls: ['A.5.1', 'A.8.2', 'A.12.2'], // Optional: specific controls
  excludedControls: ['A.6.1', 'A.6.3'], // Optional: skip manual controls
  timeout: 30000, // 30 seconds
};

const report = await collector.collect(config);

console.log(`Compliance Status: ${report.summary.passed}/${report.summary.total} controls passed`);
console.log(`Critical Issues: ${report.evidence.filter(e => e.severity === 'CRITICAL').length}`);
```

### Evidence Structure

```typescript
{
  controlId: "A.8.2",
  controlName: "Privileged access rights",
  status: "PASS" | "FAIL" | "MANUAL_REVIEW" | "NOT_APPLICABLE",
  timestamp: "2024-02-02T15:30:00Z",
  description: "Checking repository access controls",
  evidence: [
    {
      type: "collaborators",
      value: 10,
      source: "GitHub API",
      metadata: { admin: 1, write: 5, read: 4 }
    }
  ],
  findings: ["Appropriate admin access: 1/10 (10.0%)"],
  recommendations: [],
  severity: "LOW"
}
```

### Control Status Logic

**PASS**: Control requirements fully met
- A.5.1: Security policy documentation found
- A.8.2: Admin access ≤20% of users
- A.12.2: Protected branches + ≥80% PR reviews

**FAIL**: Control requirements not met
- A.5.1: No security policy found
- A.8.2: Admin access >30% of users
- A.8.3: Exposed secrets detected (CRITICAL)

**MANUAL_REVIEW**: Automated check inconclusive
- A.5.23: No IaC detected (may be in external systems)
- A.6.1: HR processes (cannot automate)
- A.8.5: Personal repository (cannot check org 2FA)

### Performance Optimization

- **Parallel Execution**: All controls run concurrently by default
- **GitHub API Efficiency**: Batches API calls, respects rate limits (5000/hour)
- **Early Exit**: Skip controls based on configuration
- **Target Performance**: 15-45 seconds for 20 controls

### Integration with Other Frameworks

**SOC2 Mappings**:
- A.8.2 → CC6.6 (Access Controls)
- A.12.2 → CC8.1 (Change Management)
- A.16.1 → CC7.1 (System Operations)

**GDPR Mappings**:
- A.8.3 → Article 32 (Security of Processing)
- A.18.1 → Article 5 (Lawfulness, Fairness, Transparency)

### Testing

```bash
# Run ISO27001 collector tests only
npm run test tests/unit/collectors/iso27001.test.ts

# Run with coverage
npm run test:coverage -- tests/unit/collectors/iso27001.test.ts
```

### Limitations

**Cannot Automate**:
- Physical security controls (cameras, locks, data center access)
- HR processes (background checks, training records)
- Organizational policies not stored in Git
- Third-party vendor assessments
- Business continuity testing results

**Partial Automation**:
- Some controls require manual documentation review
- Context-dependent decisions need human judgment
- Cross-repository analysis not yet supported
- Historical compliance trends not tracked

### Future Enhancements

- [ ] Support for GitLab, Bitbucket, Azure DevOps
- [ ] Integration with HR systems for people controls
- [ ] Automated penetration testing results integration
- [ ] Cross-repository compliance dashboards
- [ ] Historical compliance trend analysis
- [ ] Machine learning for anomaly detection
- [ ] Custom control definitions
- [ ] Multi-language support

### References

- ISO/IEC 27001:2022 Standard
- [ISO 27001 Control Mappings](../../docs/CONTROLS.md)
- [NIST Cybersecurity Framework Mapping](https://www.nist.gov/cyberframework)
- [SOC 2 Trust Service Criteria](https://www.aicpa.org/soc)

---

**Maintained by**: Compliance Autopilot Team
**Last Updated**: 2024-02-02
**Version**: 1.0.0
