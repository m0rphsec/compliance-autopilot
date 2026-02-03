# ISO27001:2022 Control Mappings

This document maps ISO/IEC 27001:2022 controls to automated evidence collection methods.

## Overview

ISO 27001 contains 93 controls organized into 4 themes (Organizational, People, Physical, Technological) and 14 categories (Annex A.5-A.18). This implementation focuses on **20 high-value controls** that can be partially or fully automated through GitHub API analysis.

## Implementation Status

- ✅ **Implemented**: 20 controls
- 🔄 **Partial Automation**: 15 controls
- 📋 **Manual Review Required**: 5 controls

---

## A.5 - Organizational Controls

### A.5.1 - Policies for information security
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Checks for `SECURITY.md`, `docs/SECURITY.md`, `SECURITY_POLICY.md`
- Scans README.md for security sections
- Verifies policy documentation exists and is accessible

**Pass Criteria**: Security policy document found in repository

**Fail Criteria**: No security policy documentation

---

### A.5.7 - Threat intelligence
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Checks if Dependabot alerts are enabled
- Scans for security-focused GitHub Actions workflows (CodeQL, Snyk, etc.)
- Tracks security-labeled issues
- Monitors vulnerability response times

**Pass Criteria**:
- Dependabot enabled OR
- Security scanning workflows active

**Fail Criteria**: No threat monitoring detected

---

### A.5.23 - Information security for use of cloud services
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Detects Infrastructure as Code (Terraform, CloudFormation, Pulumi, K8s)
- Identifies cloud service configuration files
- Checks for docker-compose, Dockerfiles

**Pass Criteria**: IaC files detected

**Fail Criteria**: No IaC detected (requires manual documentation review)

---

## A.6 - People Controls

### A.6.1 - Screening
**Status**: 📋 Manual Review
**Automation**: None

**Evidence Collection**: Manual HR verification required

**Requirements**:
- Background verification policy exists
- All employees with repository access have been screened
- Screening records maintained

---

### A.6.2 - Terms and conditions of employment
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for CLA.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md
- Verifies contributor agreement documentation

**Pass Criteria**: Contributor agreement found

**Fail Criteria**: No contributor agreement documentation

---

### A.6.3 - Information security awareness, education and training
**Status**: 📋 Manual Review
**Automation**: None

**Evidence Collection**: Manual HR/training verification required

**Requirements**:
- Security awareness training program exists
- All developers complete training
- Training completion tracked

---

## A.8 - Technological Controls

### A.8.2 - Privileged access rights
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Lists all repository collaborators
- Calculates admin/write/read access distribution
- Checks branch protection rules
- Validates principle of least privilege

**Pass Criteria**: Admin users ≤20% of total users

**Fail Criteria**: Admin users >30% of total users

**Manual Review**: Admin users 20-30%

---

### A.8.3 - Information access restriction
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Checks repository visibility (public/private)
- Scans for secret leaks (GitHub Secret Scanning)
- Validates access controls

**Pass Criteria**:
- Repository is private AND
- No exposed secrets

**Fail Criteria**: Exposed secrets detected (CRITICAL)

**Manual Review**: Public repository (verify intentional)

---

### A.8.5 - Secure authentication
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks organization 2FA enforcement
- Validates authentication requirements

**Pass Criteria**: Organization enforces 2FA for all members

**Fail Criteria**: Organization does not enforce 2FA (HIGH severity)

**Manual Review**: Personal repository (cannot verify org settings)

---

### A.8.9 - Configuration management
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for `.env.example`, `config.example` templates
- Validates `.gitignore` excludes sensitive files
- Detects configuration management files

**Pass Criteria**: Configuration templates and secure .gitignore found

**Fail Criteria**: No configuration management detected

---

## A.12 - Operations Security

### A.12.1 - Documented operating procedures
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for README.md, CONTRIBUTING.md
- Scans docs/ for operations documentation
- Counts documentation files

**Pass Criteria**: ≥2 documentation files found

**Fail Criteria**: No documentation

**Manual Review**: 1 documentation file (verify completeness)

---

### A.12.2 - Change management
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Counts protected branches
- Analyzes last 20 merged PRs for review compliance
- Calculates PR review percentage
- Checks branch protection rules

**Pass Criteria**:
- Protected branches exist AND
- ≥80% of PRs reviewed before merge

**Fail Criteria**:
- No protected branches AND
- <50% PR review rate

**Manual Review**: Partial controls (50-80% compliance)

---

### A.12.4 - Logging and monitoring
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for monitoring/alerting workflows
- Scans package.json for logging libraries (winston, pino, sentry)
- Validates logging implementation

**Pass Criteria**: Monitoring workflows OR logging libraries detected

**Fail Criteria**: No logging/monitoring detected

---

## A.14 - System acquisition, development and maintenance

### A.14.1 - Security requirements analysis and specification
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for security requirements documentation
- Scans for threat model documentation
- Validates security analysis artifacts

**Pass Criteria**: Security requirements documentation found

**Fail Criteria**: No security documentation

---

### A.14.2 - Secure development policy
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for security workflows (CodeQL, security scanning)
- Validates CONTRIBUTING.md with security guidelines
- Counts security automation

**Pass Criteria**:
- Security workflows exist AND
- Contributing guide exists

**Fail Criteria**: Limited secure development practices

---

### A.14.3 - Application security requirements
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Checks for test workflows (CI/CD)
- Scans for vulnerability alerts (Dependabot)
- Validates security testing automation

**Pass Criteria**:
- Test workflows active AND
- Zero security vulnerabilities

**Fail Criteria**: Active security vulnerabilities (HIGH)

---

## A.16 - Information security incident management

### A.16.1 - Management responsibilities and procedures
**Status**: ✅ Implemented
**Automation**: Full

**Evidence Collection**:
- Checks for incident response documentation
- Tracks security-labeled issues
- Calculates average incident response time
- Monitors open vs closed security issues

**Pass Criteria**:
- Incident documentation exists AND
- Security issues tracked

**Fail Criteria**: No incident management procedures

---

## A.17 - Business continuity

### A.17.1 - Planning information security continuity
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for disaster recovery documentation
- Validates automated deployment workflows (CD)
- Assesses business continuity readiness

**Pass Criteria**:
- Continuity documentation OR
- Automated deployment workflows

**Fail Criteria**: No continuity planning

---

## A.18 - Compliance

### A.18.1 - Compliance with legal and contractual requirements
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for LICENSE file
- Validates legal documentation (PRIVACY.md, TERMS.md)
- Counts compliance documents
- Verifies CODE_OF_CONDUCT.md

**Pass Criteria**: ≥2 legal/compliance documents

**Fail Criteria**: No legal documentation

---

### A.18.2 - Information security reviews
**Status**: ✅ Implemented
**Automation**: Partial

**Evidence Collection**:
- Checks for security audit reports
- Scans for code scanning results (CodeQL)
- Validates independent review evidence

**Pass Criteria**:
- Audit documentation OR
- Code scanning enabled

**Fail Criteria**: No security reviews

---

## Risk Severity Levels

- **CRITICAL**: Immediate action required (e.g., exposed secrets)
- **HIGH**: Significant security risk (e.g., no 2FA, excessive admins)
- **MEDIUM**: Moderate risk (e.g., partial controls)
- **LOW**: Minor improvement needed
- **INFO**: Informational only

---

## Control Status Legend

- **PASS**: Control requirements met
- **FAIL**: Control requirements not met
- **MANUAL_REVIEW**: Automated check inconclusive, manual verification required
- **NOT_APPLICABLE**: Control not applicable to this repository

---

## Evidence Format

Each control returns standardized evidence:

```typescript
{
  controlId: "A.8.2",
  controlName: "Privileged access rights",
  status: "PASS" | "FAIL" | "MANUAL_REVIEW" | "NOT_APPLICABLE",
  timestamp: "2024-02-02T15:30:00Z",
  description: "Human-readable check description",
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
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  references: ["https://www.iso.org/standard/27001"]
}
```

---

## Integration with Other Frameworks

ISO 27001 controls map to:
- **SOC2 Trust Service Criteria**: Many overlaps with CC1-CC9
- **GDPR**: A.8.3, A.18.1 support GDPR compliance
- **NIST CSF**: Aligns with Identify, Protect, Detect functions

---

## Performance

- **Average scan time**: 15-45 seconds (20 controls)
- **Parallel execution**: Controls run concurrently for speed
- **API rate limits**: Respects GitHub API rate limits (5000/hour)

---

## Limitations

### Cannot Automate
- Physical security controls (cameras, locks, etc.)
- HR processes (background checks, training records)
- Organizational policies not stored in Git
- Third-party vendor assessments
- Business continuity testing results

### Partial Automation
- Some controls require manual documentation review
- Context-dependent decisions need human judgment
- Cross-repository analysis not yet supported

---

## Future Enhancements

- [ ] Support for GitLab, Bitbucket APIs
- [ ] Integration with HR systems for people controls
- [ ] Automated penetration testing results integration
- [ ] Cross-repository compliance dashboards
- [ ] Historical compliance trend analysis

---

**Last Updated**: 2024-02-02
**ISO 27001 Version**: ISO/IEC 27001:2022
**Implementation**: Compliance Autopilot v1.0.0
