# PDF Report Screenshot

**File Required:** `pdf-report.png`

## Specifications
- **Dimensions:** 1400x1000 pixels
- **Format:** PNG
- **Content:** First page of PDF report

## Screenshot Content

### Report Layout
```
┌────────────────────────────────────────────────────┐
│  COMPLIANCE AUTOPILOT REPORT                       │
│  ════════════════════════════════════════          │
│                                                     │
│  Repository: m0rphsec/example-app                  │
│  Branch: feature/security-updates                  │
│  PR #123: Add AWS CloudTrail configuration         │
│  Generated: 2024-01-15 10:30:22 UTC                │
│                                                     │
│  EXECUTIVE SUMMARY                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                     │
│  Overall Status: ⚠️  PASSED WITH WARNINGS          │
│                                                     │
│  ┌─────────────────────────────────────┐          │
│  │ Total Checks Run:        14         │          │
│  │ ✅ Passed:               12         │          │
│  │ ⚠️  Warnings:             2         │          │
│  │ ❌ Failed:                0         │          │
│  │ Compliance Score:       85.7%       │          │
│  └─────────────────────────────────────┘          │
│                                                     │
│  FRAMEWORKS ASSESSED                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│  ✅ CIS AWS Foundations v1.4.0                     │
│  ✅ CIS Kubernetes v1.8.0                          │
│  ⚠️  NIST 800-53 (Partial Coverage)               │
│                                                     │
│  DETAILED FINDINGS                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                     │
│  1. CloudTrail Log Validation [MEDIUM]            │
│     Framework: CIS AWS 1.16                        │
│     File: terraform/cloudtrail.tf:12               │
│     Description: Log file validation ensures...    │
│     Recommendation: Enable log file validation     │
│                                                     │
│  2. Pod Security Policy [LOW]                      │
│     Framework: CIS Kubernetes 5.2.3                │
│     File: k8s/deployment.yaml:8                    │
│     Description: Pod Security Standards should...  │
│     Recommendation: Implement PSS restricted       │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Capture Guidelines
- Show professional PDF layout with branding
- Include header with repository/PR context
- Display executive summary with metrics
- Show 1-2 detailed findings
- Use proper typography and spacing
- Include visual indicators (✅⚠️❌)

## Design Requirements
- Professional business report style
- Clear hierarchy (headings, sections)
- Color coding for severity levels
- Tables for metrics/summary data
- Code snippets with line numbers
- Page numbers if multi-page

## TODO
- [ ] Generate sample PDF report
- [ ] Open in PDF viewer at 100% zoom
- [ ] Capture first page screenshot
- [ ] Ensure text is sharp and readable
- [ ] Verify colors render correctly
- [ ] Save as `pdf-report.png`
