# 🔒 Compliance Autopilot

**Automate SOC2, GDPR, and ISO27001 compliance evidence collection. Pass audits without the pain.**

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Compliance%20Autopilot-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=github)](https://github.com/marketplace/actions/compliance-autopilot)
[![CI](https://github.com/m0rphsec/compliance-autopilot/workflows/CI%20Tests/badge.svg)](https://github.com/m0rphsec/compliance-autopilot/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/m0rphsec/compliance-autopilot?label=version)](https://github.com/m0rphsec/compliance-autopilot/releases)

## ⚡ Quick Start

```yaml
name: Compliance Check
on: [pull_request]
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: m0rphsec/compliance-autopilot@v1
        with:
          frameworks: 'soc2'
```

> **Tip:** Add `anthropic-api-key` if you enable the GDPR framework. See [Configuration](#-configuration) for all options.

## ✨ Features

### 🎯 SOC2 Type II
- ✅ 10 Common Criteria controls automated
- ✅ Code review enforcement (CC1.1)
- ✅ Risk assessment (CC3.1)
- ✅ Dependency risk management (CC5.2)
- ✅ Deployment controls (CC6.1)
- ✅ Environment protection (CC6.3)
- ✅ Access management (CC6.6)
- ✅ Secure SDLC (CC6.8)
- ✅ System monitoring (CC7.1)
- ✅ Monitoring & anomaly detection (CC7.2)
- ✅ Change management (CC8.1)

### 🔐 GDPR Compliance
- ✅ 7 Article-level controls automated
- ✅ PII detection in code — Art. 6
- ✅ Encryption in transit — Art. 5(1)(f)
- ✅ Encryption at rest — Art. 32
- ✅ Consent mechanism checks — Art. 7
- ✅ Data retention policy tracking — Art. 5(1)(e)
- ✅ Right to erasure validation — Art. 17
- ✅ Privacy by design — Art. 25

### 📋 ISO 27001
- ✅ 11 Annex A controls automated
- ✅ Privileged access management (A.9.2.3)
- ✅ Information access restriction (A.9.4.1)
- ✅ Change management (A.12.1.2)
- ✅ Malware controls (A.12.2.1)
- ✅ Event logging (A.12.4.1)
- ✅ Vulnerability management (A.12.6.1)
- ✅ System change control (A.14.2.2)
- ✅ Secure engineering principles (A.14.2.5)
- ✅ Security testing (A.14.2.8)
- ✅ Security event reporting (A.16.1.2)
- ✅ Incident response (A.16.1.5)

## 📊 What You Get

Every PR gets an automated compliance report:

- **Real-time compliance status** posted as PR comment
- **PDF evidence package** ready for auditors
- **JSON evidence trail** stored immutably in GitHub Releases
- **Slack alerts** when violations detected (optional)
- **Continuous monitoring** on every code change
- **Claude AI-powered analysis** for contextual understanding

## 🚀 Why This Matters

### Manual Compliance is Painful
- ❌ 100-200 hours per quarter collecting evidence
- ❌ $20,000-$100,000+ in audit costs
- ❌ 6-12 months to first certification
- ❌ Human error risk
- ❌ Spreadsheet maintenance nightmare

### Automated Compliance is Better
- ✅ **Save 100+ hours** per quarter
- ✅ **Reduce audit costs** by 40-60%
- ✅ **Faster certification** (2-3 months)
- ✅ **Continuous monitoring** catches issues early
- ✅ **Immutable evidence trail** in Git history

## 💡 Use Cases

### Preparing for SOC2
```yaml
- uses: m0rphsec/compliance-autopilot@v1
  with:
    frameworks: 'soc2'
    report-format: 'pdf'
    fail-on-violations: 'true'
```

### GDPR + SOC2 Combo
```yaml
- uses: m0rphsec/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    frameworks: 'soc2,gdpr'
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

### All Frameworks with Failure Mode
```yaml
- uses: m0rphsec/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    frameworks: 'soc2,gdpr,iso27001'
    report-format: 'both'
    fail-on-violations: 'true'
```

### Daily Compliance Scan
```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2,gdpr,iso27001'
```

[See more examples →](./docs/EXAMPLES.md)

## 📈 Pricing

### Free Tier
- ✅ Public repositories
- ✅ SOC2 framework only
- ✅ 100 scans/month
- ✅ JSON reports
- ✅ Community support

[Get Started Free →](https://github.com/m0rphsec/compliance-autopilot#-quick-start)

### Basic — $19.99/month ($199.99/year)
- ✅ 1 private repository
- ✅ All frameworks (SOC2 + GDPR + ISO27001)
- ✅ Unlimited scans
- ✅ PDF + JSON reports
- ✅ Email support

[Subscribe →](https://buy.stripe.com/cNi6oG84m45icUc8o09bO00) | [Annual →](https://buy.stripe.com/9B68wO3O66dq1buaw89bO01)

### Pro — $49.99/month ($499.99/year)
- ✅ 5 private repositories
- ✅ All frameworks (SOC2 + GDPR + ISO27001)
- ✅ Unlimited scans
- ✅ PDF + JSON reports
- ✅ Slack integration
- ✅ Custom controls
- ✅ Priority support

[Subscribe →](https://buy.stripe.com/5kQcN4fwO59mf2kcEg9bO02) | [Annual →](https://buy.stripe.com/fZucN40BU45i2fy7jW9bO03)

### Enterprise — $149.99/month ($1,499.99/year)
- ✅ Unlimited repositories
- ✅ All frameworks (SOC2 + GDPR + ISO27001)
- ✅ Unlimited scans
- ✅ PDF + JSON reports
- ✅ Slack integration
- ✅ Custom controls
- ✅ SLA + dedicated support

[Subscribe →](https://buy.stripe.com/3cIdR8doG7hu4nGfQs9bO04) | [Annual →](https://buy.stripe.com/bJe7sKesKeJW6vO47K9bO05)

## 🎯 Who This Is For

- 🚀 **Series A+ startups** preparing for SOC2
- 💼 **SaaS companies** serving enterprise clients
- 📊 **Any company** spending $20K+ on annual compliance

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and data flow
- [Control Mappings](./docs/CONTROLS.md) - Complete SOC2, GDPR, ISO27001 controls
- [Usage Examples](./docs/EXAMPLES.md) - 5+ real-world workflow examples
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## 🔧 Configuration

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for API access | No | `${{ github.token }}` |
| `anthropic-api-key` | Anthropic API key for Claude analysis (required for GDPR only) | No | - |
| `license-key` | License key for paid features | No | - |
| `frameworks` | Comma-separated frameworks (`soc2,gdpr,iso27001`) | No | `soc2` |
| `report-format` | Report format (`pdf`, `json`, `both`) | No | `both` |
| `fail-on-violations` | Fail workflow if violations found | No | `false` |
| `slack-webhook` | Slack webhook for alerts (optional) | No | - |

### Outputs

| Output | Description |
|--------|-------------|
| `compliance-status` | Overall status: `PASS` or `FAIL` |
| `controls-passed` | Number of controls that passed |
| `controls-total` | Total number of controls checked |
| `report-url` | URL to the generated evidence report |

## 🔒 Security

This action:
- ✅ Never stores your code outside GitHub
- ✅ Only uses read-only GitHub token permissions by default
- ✅ Anthropic API key encrypted in GitHub Secrets
- ✅ All evidence stored in your GitHub repository
- ✅ No third-party data sharing
- ✅ Secrets automatically redacted from logs
- ✅ Minimal permission requirements

[Security Policy →](./SECURITY.md)

## 🛠️ How It Works

1. **Collect Evidence** - Scans GitHub repository for compliance signals
   - PR reviews, approvals, code changes
   - Deployment history, access controls
   - Security policies, incident tracking

2. **Analyze Code** - Uses Claude AI to understand context
   - PII detection in code and comments
   - Encryption verification
   - Security best practices

3. **Generate Reports** - Creates audit-ready documentation
   - PDF reports with executive summary
   - JSON evidence for programmatic access
   - Immutable storage in GitHub Releases

4. **Alert Teams** - Notifies when issues found
   - PR comments with detailed findings
   - Slack alerts for critical violations
   - Action failure for blocking issues

## 🤝 Support

- 🐛 Issues: [GitHub Issues](https://github.com/m0rphsec/compliance-autopilot/issues)
- 📖 Docs: [Documentation](./docs/)

## 🚀 Getting Started

### 1. Create Workflow

Add `.github/workflows/compliance.yml`:

```yaml
name: Compliance Check
on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: [main]

jobs:
  compliance:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for accurate analysis

      - uses: m0rphsec/compliance-autopilot@v1
        with:
          frameworks: 'soc2'
          report-format: 'both'
          fail-on-violations: 'false'
```

### 2. (Optional) Add an Anthropic API Key

Only required if you enable the **GDPR** framework. Sign up at [Anthropic Console](https://console.anthropic.com/), then add the key to your repository:

Settings → Secrets → Actions → New repository secret:
- Name: `ANTHROPIC_API_KEY`
- Value: Your API key

Then add `anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}` and `frameworks: 'soc2,gdpr'` to your workflow step.

### 3. Open a Pull Request

The action will automatically run and post a compliance report!

## 📜 License

MIT © [m0rphsec](https://github.com/m0rphsec)

