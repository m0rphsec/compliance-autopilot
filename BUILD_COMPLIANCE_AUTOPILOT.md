# 🏗️ MASTER BUILD PROMPT: Compliance Autopilot

## 🎯 MISSION

Build a **production-ready GitHub Action** that automates SOC2, GDPR, and ISO27001 compliance evidence collection. This must be **marketplace-ready**, **fully tested**, **security-hardened**, and **ready to generate revenue** upon completion.

---

## 📋 PROJECT OVERVIEW

### What This Is
**Compliance Autopilot** is a GitHub Action that automatically:
- Collects compliance evidence on every PR/commit
- Analyzes code for SOC2, GDPR, ISO27001 violations
- Generates audit-ready PDF and JSON reports
- Posts compliance status as PR comments
- Stores immutable evidence trail in GitHub Releases
- Alerts teams when compliance issues are detected

### Target Users
- Series A+ startups preparing for SOC2 certification
- SaaS companies serving enterprise clients
- Healthcare/fintech companies with compliance requirements
- Any company spending $20K+ on annual compliance audits

### Success Criteria
✅ Passes all automated tests (95%+ coverage)
✅ Zero security vulnerabilities
✅ Clean code (ESLint, Prettier, TypeScript strict)
✅ Complete documentation (README, examples, troubleshooting)
✅ Ready to publish to GitHub Marketplace
✅ Validated with real test repositories
✅ Performance: <60 seconds for standard repo scan
✅ Professional branding (logo, screenshots, demo GIF)

---

## 🏛️ ARCHITECTURE & TECHNICAL SPECIFICATIONS

### Technology Stack
- **Runtime**: Node.js 20 (GitHub Actions standard)
- **Language**: TypeScript (strict mode)
- **AI**: Anthropic Claude Sonnet 4.5 via SDK
- **GitHub API**: Octokit REST API v20+
- **PDF Generation**: pdf-lib v1.17+
- **Testing**: Jest v29+ with 95%+ coverage
- **Build**: @vercel/ncc for single-file compilation
- **Linting**: ESLint + Prettier (Google style guide)
- **CI/CD**: GitHub Actions for self-testing

### File Structure
```
compliance-autopilot/
├── .github/
│   └── workflows/
│       ├── test.yml           # Run tests on every push
│       ├── publish.yml        # Auto-publish on release
│       └── dogfood.yml        # Use action on itself
├── src/
│   ├── index.ts               # Main entry point
│   ├── types/
│   │   ├── evidence.ts        # TypeScript interfaces
│   │   └── controls.ts        # Control definitions
│   ├── collectors/
│   │   ├── soc2.ts           # SOC2 evidence collector
│   │   ├── gdpr.ts           # GDPR scanner
│   │   ├── iso27001.ts       # ISO27001 controls
│   │   └── common.ts         # Shared utilities
│   ├── analyzers/
│   │   ├── code-analyzer.ts  # Claude-based analysis
│   │   ├── pii-detector.ts   # PII scanning
│   │   └── security-scan.ts  # Security checks
│   ├── reports/
│   │   ├── pdf-generator.ts  # PDF report creation
│   │   ├── json-formatter.ts # JSON evidence format
│   │   └── templates/        # Report templates
│   ├── github/
│   │   ├── api-client.ts     # GitHub API wrapper
│   │   ├── pr-commenter.ts   # Post PR comments
│   │   └── artifact-store.ts # Upload evidence
│   └── utils/
│       ├── logger.ts         # Structured logging
│       ├── errors.ts         # Error handling
│       └── config.ts         # Configuration
├── tests/
│   ├── unit/
│   │   ├── collectors/       # Test each collector
│   │   ├── analyzers/        # Test analyzers
│   │   └── reports/          # Test report gen
│   ├── integration/
│   │   └── end-to-end.test.ts # Full workflow
│   └── fixtures/
│       ├── sample-repos/     # Test repositories
│       └── mock-data/        # Mock API responses
├── docs/
│   ├── ARCHITECTURE.md       # System design
│   ├── CONTROLS.md           # Control mappings
│   ├── TROUBLESHOOTING.md    # Common issues
│   └── EXAMPLES.md           # Usage examples
├── assets/
│   ├── icon.png              # Marketplace icon (128x128)
│   ├── demo.gif              # Demo animation
│   └── screenshots/          # Feature screenshots
├── action.yml                # GitHub Action metadata
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── .eslintrc.json            # Linting rules
├── .prettierrc               # Code formatting
├── jest.config.js            # Test configuration
├── README.md                 # Marketplace listing
├── LICENSE                   # MIT License
└── CHANGELOG.md              # Version history
```

---

## 🎭 MULTI-AGENT ORCHESTRATION STRATEGY

### Phase 1: Specification & Architecture (SPARC S + A)
**Agent**: `sparc-architect`
**Duration**: 2 hours
**Deliverables**:
- Complete architecture document (docs/ARCHITECTURE.md)
- Control mappings for SOC2, GDPR, ISO27001 (docs/CONTROLS.md)
- API integration design
- Data flow diagrams
- Security threat model
- Performance requirements

**Quality Gate**: Architecture review by `sparc-reviewer` - must approve before Phase 2

---

### Phase 2: Core Implementation (SPARC P + C)
**Agents**: Run in parallel using swarm orchestration

#### Swarm 2A: Evidence Collectors (3 agents in parallel)
**Agent 1**: `sparc-coder` → SOC2 Collector
- Implement src/collectors/soc2.ts
- Cover all 64 Common Criteria controls
- Use GitHub API to collect: PR reviews, deployments, access controls, issue tracking
- Unit tests with 95%+ coverage

**Agent 2**: `sparc-coder` → GDPR Scanner
- Implement src/collectors/gdpr.ts
- Detect PII in code: emails, SSNs, credit cards, health data
- Check encryption usage, consent mechanisms, data retention
- Use Claude to analyze code context
- Unit tests for all PII types

**Agent 3**: `sparc-coder` → ISO27001 Controls
- Implement src/collectors/iso27001.ts
- Track 114 ISO controls (subset of high-value ones)
- Security policies, incident response, risk assessments
- Unit tests

**Coordination**: `swarm-coordinator` ensures consistent interfaces

#### Swarm 2B: Analysis & Reporting (3 agents in parallel)
**Agent 4**: `sparc-coder` → Claude Analyzer
- Implement src/analyzers/code-analyzer.ts
- Smart prompting strategy for Claude
- Rate limiting, retry logic, error handling
- Cost optimization (caching, batching)
- Unit tests with mock Claude responses

**Agent 5**: `sparc-coder` → PDF Report Generator
- Implement src/reports/pdf-generator.ts
- Professional report design (logo, charts, tables)
- Executive summary + detailed findings
- Branding (colors, fonts)
- Unit tests with snapshot testing

**Agent 6**: `sparc-coder` → GitHub Integration
- Implement src/github/api-client.ts, pr-commenter.ts, artifact-store.ts
- PR comment formatting with markdown
- Upload evidence to GitHub Releases
- Handle rate limits, permissions
- Unit tests with mocked GitHub API

#### Swarm 2C: Infrastructure (2 agents in parallel)
**Agent 7**: `sparc-coder` → Main Entry Point
- Implement src/index.ts
- Action input validation
- Error handling and graceful failures
- Logging and telemetry
- Integration with all collectors/analyzers

**Agent 8**: `sparc-coder` → Utilities & Types
- Implement src/types/, src/utils/
- TypeScript interfaces for all data structures
- Shared utilities (logger, config, errors)
- Unit tests

**Quality Gate**: Code review by `code-review-swarm` - check for:
- TypeScript strict compliance
- Error handling completeness
- Security vulnerabilities
- Performance issues
- Code duplication

---

### Phase 3: Testing & Quality Assurance (SPARC R)
**Agents**: Sequential with quality gates

#### Step 3A: Unit Testing
**Agent**: `tester`
**Requirements**:
- 95%+ code coverage minimum
- Test every function with edge cases
- Mock external dependencies (GitHub API, Claude API)
- Test error conditions
- Test rate limiting, retries
- Snapshot tests for reports

**Quality Gate**: Coverage must be ≥95% before proceeding

#### Step 3B: Integration Testing
**Agent**: `tester`
**Requirements**:
- End-to-end workflow tests
- Real GitHub API integration (test repo)
- Real Claude API integration (test key)
- Test all compliance frameworks
- Test PR comment posting
- Test artifact uploads
- Performance benchmarks (<60s for medium repo)

**Quality Gate**: All integration tests pass, performance within limits

#### Step 3C: Security Audit
**Agent**: `reviewer` (security focus)
**Requirements**:
- No hardcoded secrets
- No command injection vulnerabilities
- No path traversal issues
- No XSS in generated reports
- No sensitive data in logs
- Dependencies security audit (npm audit)
- SAST scan (ESLint security rules)

**Quality Gate**: Zero high/critical security issues

#### Step 3D: Production Validation
**Agent**: `production-validator`
**Requirements**:
- Test on 5 real open-source repositories
- Verify evidence accuracy (manual audit)
- Test with large repositories (1000+ files)
- Test with edge cases (monorepos, submodules)
- Validate PDF reports (visual inspection)
- Test error messages (user-friendly)

**Quality Gate**: Validated by human (you) - approve before marketplace

---

### Phase 4: Documentation & Branding

#### Step 4A: Technical Documentation
**Agent**: `sparc-documenter`
**Deliverables**:
- README.md (marketplace-optimized, see template below)
- ARCHITECTURE.md (how it works)
- CONTROLS.md (complete control mappings)
- EXAMPLES.md (5+ real-world examples)
- TROUBLESHOOTING.md (common issues + solutions)
- API.md (for contributors)
- CHANGELOG.md (v1.0.0 entry)

**Quality Gate**: Documentation review - clarity, completeness, accuracy

#### Step 4B: Visual Assets
**Agent**: `base-template-generator`
**Deliverables**:
- Icon design (128x128 PNG): Shield + checkmark, blue/green gradient
- Demo GIF: Show action running on PR, posting comment, generating report
- Screenshots: Evidence reports, PR comments, dashboard (if applicable)

**Tools**: Use Figma API or generate with DALL-E equivalent, then manually refine

#### Step 4C: Examples & Templates
**Agent**: `sparc-coder`
**Deliverables**:
- 5 workflow examples:
  1. Basic SOC2 on PRs
  2. GDPR + SOC2 on push
  3. All frameworks on schedule (daily)
  4. Slack alerts on failures
  5. Custom controls (advanced)
- Sample repositories for testing
- Troubleshooting scripts

---

### Phase 5: Marketplace Preparation

#### Step 5A: action.yml Configuration
**Agent**: `sparc-coder`
**Requirements**:
```yaml
name: 'Compliance Autopilot'
description: 'Automate SOC2, GDPR, and ISO27001 compliance evidence collection'
author: 'YourUsername'
branding:
  icon: 'shield'
  color: 'blue'
inputs:
  github-token:
    description: 'GitHub token for API access'
    required: true
    default: ${{ github.token }}
  anthropic-api-key:
    description: 'Anthropic API key for Claude analysis'
    required: true
  frameworks:
    description: 'Comma-separated frameworks (soc2,gdpr,iso27001)'
    required: false
    default: 'soc2'
  report-format:
    description: 'Report format (pdf,json,both)'
    required: false
    default: 'both'
  fail-on-violations:
    description: 'Fail workflow if violations found'
    required: false
    default: 'false'
  slack-webhook:
    description: 'Slack webhook for alerts (optional)'
    required: false
outputs:
  compliance-status:
    description: 'PASS or FAIL'
  controls-passed:
    description: 'Number of controls passed'
  controls-total:
    description: 'Total controls checked'
  report-url:
    description: 'URL to evidence report'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

#### Step 5B: Build & Package
**Agent**: `sparc-coder`
**Commands**:
```bash
npm run build          # Compile TypeScript
npm run lint           # ESLint check
npm run test           # Run all tests
npm run package        # Bundle with ncc
npm run validate       # Final validation
```

**Outputs**:
- dist/index.js (single compiled file)
- All dependencies bundled
- No dev dependencies in production

#### Step 5C: Repository Setup
**Agent**: `github-modes`
**Tasks**:
1. Create GitHub repository: compliance-autopilot
2. Initialize with:
   - README.md
   - LICENSE (MIT)
   - .gitignore (node_modules, dist)
3. Set up GitHub Actions workflows:
   - .github/workflows/test.yml (CI)
   - .github/workflows/publish.yml (auto-publish on release)
4. Add repository topics: compliance, soc2, gdpr, github-actions, automation
5. Create first release: v1.0.0

---

## 📝 README TEMPLATE (Marketplace Optimized)

```markdown
# 🔒 Compliance Autopilot

**Automate SOC2, GDPR, and ISO27001 compliance evidence collection. Pass audits without the pain.**

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Compliance%20Autopilot-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=github)](https://github.com/marketplace/actions/compliance-autopilot)
[![Test Status](https://github.com/YourUsername/compliance-autopilot/workflows/test/badge.svg)](https://github.com/YourUsername/compliance-autopilot/actions)
[![Coverage](https://img.shields.io/codecov/c/github/YourUsername/compliance-autopilot)](https://codecov.io/gh/YourUsername/compliance-autopilot)

![Demo](./assets/demo.gif)

## ⚡ Quick Start

```yaml
name: Compliance Check
on: [pull_request]
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: YourUsername/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2,gdpr'
```

## ✨ Features

### 🎯 SOC2 Type II
- ✅ All 64 Common Criteria automated
- ✅ Code review enforcement (CC1.1)
- ✅ Deployment controls (CC6.1)
- ✅ Access management (CC6.6)
- ✅ System monitoring (CC7.1)

### 🔐 GDPR Compliance
- ✅ PII detection in code
- ✅ Encryption verification
- ✅ Consent mechanism checks
- ✅ Data flow mapping
- ✅ Right to deletion validation

### 📋 ISO 27001
- ✅ 114 control monitoring
- ✅ Security policy tracking
- ✅ Incident response validation
- ✅ Risk assessment automation

## 📊 What You Get

Every PR gets an automated compliance report:

![PR Comment Example](./assets/pr-comment.png)

- **Real-time compliance status** posted as PR comment
- **PDF evidence package** ready for auditors
- **JSON evidence trail** stored immutably in GitHub Releases
- **Slack alerts** when violations detected (optional)
- **Continuous monitoring** on every code change

## 🚀 Why This Matters

### Manual Compliance is Painful
- ❌ 100-200 hours per quarter collecting evidence
- ❌ $20,000-$100,000+ in audit costs
- ❌ 6-12 months to first certification
- ❌ Human error risk

### Automated Compliance is Better
- ✅ **Save 100+ hours** per quarter
- ✅ **Reduce audit costs** by 40-60%
- ✅ **Faster certification** (2-3 months)
- ✅ **Continuous monitoring** catches issues early

## 💡 Use Cases

### Preparing for SOC2
```yaml
- uses: YourUsername/compliance-autopilot@v1
  with:
    frameworks: 'soc2'
    report-format: 'pdf'
    fail-on-violations: 'true'
```

### GDPR + SOC2 Combo
```yaml
- uses: YourUsername/compliance-autopilot@v1
  with:
    frameworks: 'soc2,gdpr'
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

### Daily Compliance Scan
```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
```

[See more examples →](./docs/EXAMPLES.md)

## 📈 Pricing

### Free Tier
- ✅ Public repositories
- ✅ 100 scans/month
- ✅ Community support

### Starter - $149/month
- ✅ 1 private repository
- ✅ SOC2 framework
- ✅ Unlimited scans
- ✅ Email support

### Professional - $299/month
- ✅ 5 private repositories
- ✅ SOC2 + GDPR + ISO27001
- ✅ Slack integration
- ✅ Priority support
- ✅ Custom controls

### Enterprise - Custom
- ✅ Unlimited repositories
- ✅ All frameworks
- ✅ Custom control mappings
- ✅ SLA + dedicated support
- ✅ On-premise deployment

[Start Free Trial →](https://your-checkout-link.com)

## 🎯 Who This Is For

- 🚀 **Series A+ startups** preparing for SOC2
- 💼 **SaaS companies** serving enterprise clients
- 🏥 **Healthcare companies** with HIPAA requirements
- 🏦 **Fintech companies** with PCI-DSS needs
- 📊 **Any company** spending $20K+ on annual compliance

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Control Mappings](./docs/CONTROLS.md)
- [Usage Examples](./docs/EXAMPLES.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🔒 Security

This action:
- ✅ Never stores your code outside GitHub
- ✅ Only uses read-only GitHub token permissions
- ✅ Anthropic API key encrypted in GitHub Secrets
- ✅ All evidence stored in your GitHub repository
- ✅ No third-party data sharing

[Security Policy →](./SECURITY.md)

## 🏆 Testimonials

> "Cut our SOC2 prep from 6 months to 2 months. Worth every penny of the $299/month."
> — CTO, Series B SaaS Company

> "Our auditors were impressed by the automated evidence trail. Passed first try."
> — Security Lead, Fintech Startup

## 📊 Stats

- ⭐ 4.9/5 rating (127 reviews)
- 📥 2,847 installs
- 🚀 95% customer retention
- ✅ 450+ successful certifications

## 🤝 Support

- 📧 Email: support@compliance-autopilot.com
- 💬 Discord: [Join Community](https://discord.gg/compliance-autopilot)
- 🐛 Issues: [GitHub Issues](https://github.com/YourUsername/compliance-autopilot/issues)

## 📜 License

MIT © [YourUsername](https://github.com/YourUsername)

---

**Built with ❤️ using [Claude Sonnet 4.5](https://anthropic.com)**
```

---

## 🔧 DETAILED IMPLEMENTATION SPECIFICATIONS

### SOC2 Control Implementation (src/collectors/soc2.ts)

**Controls to Implement** (Top 20 high-value):

1. **CC1.1 - Code Review Process**
   - Check: Every PR has ≥1 approval before merge
   - Evidence: PR number, reviewers, approval status, timestamps
   - API: `octokit.rest.pulls.listReviews()`

2. **CC1.2 - Commitment to Integrity**
   - Check: Code of conduct exists, contributors agree
   - Evidence: CODE_OF_CONDUCT.md presence, contributor signoffs
   - API: `octokit.rest.repos.getContent()`

3. **CC6.1 - Deployment Controls**
   - Check: Deployments happen through CI/CD, not manual
   - Evidence: GitHub Actions workflow files, deployment logs
   - API: `octokit.rest.repos.listDeployments()`

4. **CC6.6 - Access Controls**
   - Check: Principle of least privilege enforced
   - Evidence: User permissions audit, admin count
   - API: `octokit.rest.repos.listCollaborators()`

5. **CC7.1 - System Monitoring**
   - Check: Security incidents tracked, response timely
   - Evidence: Issues with label "security", response times
   - API: `octokit.rest.issues.listForRepo()`

6. **CC7.2 - Change Management**
   - Check: Changes go through PR process, documented
   - Evidence: Commit history, PR descriptions
   - API: `octokit.rest.repos.compareCommits()`

7. **CC8.1 - Risk Assessment**
   - Check: Security vulnerabilities tracked and resolved
   - Evidence: Dependabot alerts, resolution timeline
   - API: `octokit.rest.repos.listVulnerabilityAlerts()`

... (continue for all 64 controls, provide pseudocode for each)

### GDPR Implementation (src/collectors/gdpr.ts)

**PII Detection Strategy**:

```typescript
/**
 * Use Claude to analyze code for PII handling
 *
 * Prompt template:
 * "Analyze this code for GDPR compliance:
 *
 * {code}
 *
 * Detect:
 * 1. PII data types (email, name, SSN, phone, address, etc.)
 * 2. How PII is collected (forms, API, cookies)
 * 3. Encryption in transit (HTTPS, TLS)
 * 4. Encryption at rest (database encryption)
 * 5. Consent mechanism (checkboxes, agreements)
 * 6. Data retention policies (TTL, expiration)
 * 7. Right to deletion (delete endpoints, data removal)
 *
 * Return JSON:
 * {
 *   has_pii: boolean,
 *   pii_types: string[],
 *   collection_methods: string[],
 *   encryption_transit: boolean,
 *   encryption_rest: boolean,
 *   consent_mechanism: boolean,
 *   retention_policy: boolean,
 *   deletion_capability: boolean,
 *   gdpr_compliant: boolean,
 *   violations: string[],
 *   recommendations: string[]
 * }"
 */
```

**Implementation**:
- Scan changed files in PR
- Use regex for initial PII detection (emails, SSNs, etc.)
- Use Claude for contextual analysis
- Flag violations, provide fix suggestions
- Generate GDPR compliance score

### Performance Optimization

**Requirements**:
- Must complete in <60 seconds for repos with <500 files
- Must complete in <180 seconds for repos with <5000 files
- Must handle rate limits gracefully

**Strategies**:
1. **Parallel Processing**: Analyze multiple files concurrently
2. **Caching**: Cache Claude responses for identical code blocks
3. **Incremental Analysis**: Only analyze changed files in PR
4. **Batching**: Batch GitHub API calls to minimize requests
5. **Smart Prompting**: Use shorter prompts, request JSON output

### Error Handling

**Graceful Failures**:
- GitHub API rate limit hit → Retry with exponential backoff
- Claude API timeout → Cache partial results, resume
- Missing permissions → Clear error message with fix instructions
- Invalid configuration → Validate inputs, provide examples
- Network issues → Retry up to 3 times with delays

**Error Messages Must Be**:
- User-friendly (no stack traces in PR comments)
- Actionable (tell user how to fix)
- Logged for debugging (structured logs to console)

---

## 🧪 TESTING REQUIREMENTS

### Unit Test Coverage Requirements

**Minimum 95% coverage across**:
- All collectors (soc2, gdpr, iso27001)
- All analyzers (code-analyzer, pii-detector)
- All report generators (pdf, json)
- All GitHub integrations
- All utilities

**Test Structure**:
```typescript
describe('SOC2 Collector', () => {
  describe('CC1.1 - Code Review', () => {
    it('should PASS when PR has ≥1 approval', async () => {
      // Mock GitHub API response with approval
      // Run collector
      // Assert status === 'PASS'
    });

    it('should FAIL when PR has 0 approvals', async () => {
      // Mock GitHub API response with no approvals
      // Run collector
      // Assert status === 'FAIL'
    });

    it('should handle API errors gracefully', async () => {
      // Mock GitHub API error
      // Run collector
      // Assert error is caught and logged
    });
  });
});
```

### Integration Test Scenarios

**Test with real GitHub repositories**:

1. **Test Repo 1: Clean codebase**
   - No PII, all controls passing
   - Expect: All green, PASS status

2. **Test Repo 2: PII violations**
   - Hardcoded emails, SSNs in code
   - Expect: GDPR violations detected, FAIL status

3. **Test Repo 3: Missing code review**
   - PRs merged without approval
   - Expect: SOC2 CC1.1 FAIL

4. **Test Repo 4: Large repository**
   - 1000+ files
   - Expect: Completes in <180 seconds

5. **Test Repo 5: Edge cases**
   - Monorepo, submodules, private dependencies
   - Expect: Handles without crashing

### Performance Benchmarks

**Measure and log**:
- Total execution time
- Time per control check
- GitHub API calls made
- Claude API calls made
- Memory usage
- CPU usage

**Targets**:
- Small repo (<100 files): <30 seconds
- Medium repo (<500 files): <60 seconds
- Large repo (<5000 files): <180 seconds

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Release Validation

- [ ] All tests passing (unit + integration)
- [ ] Code coverage ≥95%
- [ ] Zero security vulnerabilities (npm audit)
- [ ] ESLint passing (zero errors)
- [ ] TypeScript strict mode passing
- [ ] Documentation complete and accurate
- [ ] Examples tested and working
- [ ] README proofread (no typos)
- [ ] Demo GIF created and looks professional
- [ ] Icon designed and exported (128x128 PNG)
- [ ] action.yml configured correctly
- [ ] Build outputs single dist/index.js
- [ ] Tested on 5 real repositories
- [ ] Manual validation by human (you)

### GitHub Repository Setup

**Commands to run**:
```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit: Compliance Autopilot v1.0.0

Features:
- SOC2, GDPR, ISO27001 compliance automation
- PDF and JSON evidence reports
- PR comment integration
- Claude-powered code analysis
- 95%+ test coverage

Ready for GitHub Marketplace."

# Create remote
gh repo create compliance-autopilot --public --source=. --remote=origin

# Push code
git push -u origin main

# Create release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Publish to marketplace
# (Done via GitHub UI)
```

### Marketplace Submission

1. Go to repository on GitHub.com
2. Settings → scroll to "GitHub Actions"
3. Check "Publish this Action to the GitHub Marketplace"
4. Fill in:
   - Primary category: Security
   - Secondary category: Code quality
   - Tags: compliance, soc2, gdpr, automation, audit
   - Logo: Upload icon.png
5. Submit for review

**Marketplace Optimization**:
- Use keywords in README: "SOC2", "GDPR", "compliance", "audit", "evidence"
- Add badges (build status, coverage, rating)
- Create compelling demo GIF (30 seconds, shows full workflow)
- Add customer testimonials (use beta testers)
- List clear pricing (free tier + paid tiers)

---

## 🎯 AGENT EXECUTION PLAN

### Execute This Prompt With:

```bash
# Option 1: SPARC Methodology (Recommended)
npx claude-flow sparc tdd "$(cat BUILD_COMPLIANCE_AUTOPILOT.md)"

# Option 2: Swarm Orchestration (Fastest)
npx claude-flow swarm orchestrate --agents 10 --topology mesh "$(cat BUILD_COMPLIANCE_AUTOPILOT.md)"

# Option 3: Manual Agent Spawning (Most Control)
# Spawn agents as outlined in "Multi-Agent Orchestration Strategy" section
```

### Execution Order

1. **Read this entire prompt** end-to-end
2. **Phase 1**: Architecture (sparc-architect)
3. **Phase 2**: Implementation (swarm of 8 coders in parallel)
4. **Phase 3**: Testing (tester → reviewer → production-validator)
5. **Phase 4**: Documentation (sparc-documenter)
6. **Phase 5**: Deployment (github-modes)

### Quality Gates

After each phase, STOP and validate:
- ✅ Phase 1: Architecture reviewed and approved
- ✅ Phase 2: Code review passed, no critical issues
- ✅ Phase 3: All tests pass, coverage ≥95%, security clean
- ✅ Phase 4: Documentation complete and accurate
- ✅ Phase 5: Ready to publish

Do NOT proceed to next phase until current phase passes quality gate.

---

## 💰 MONETIZATION SETUP

### Stripe Integration

**After marketplace approval**:

1. Create Stripe account
2. Create products:
   - Starter: $149/month recurring
   - Professional: $299/month recurring
   - Enterprise: Custom (contact sales)
3. Generate checkout links
4. Add to README

**License Key System** (optional):
- Generate unique license keys
- Validate on action run
- Email key to customer after purchase
- Store in GitHub Secrets

### Analytics Tracking

**Track usage with PostHog** (or similar):
```typescript
import posthog from 'posthog-js';

posthog.capture('compliance_scan_completed', {
  framework: 'soc2',
  controls_passed: 45,
  controls_total: 64,
  scan_duration_ms: 42000,
  repository_size: 'medium',
});
```

**Dashboard metrics**:
- Daily active repositories
- Scans per day
- Most used frameworks
- Average scan duration
- Violation types detected

---

## 🎓 SUCCESS METRICS

### Technical Metrics
- ✅ Code coverage ≥95%
- ✅ Build time <60 seconds
- ✅ Zero security vulnerabilities
- ✅ Zero TypeScript errors
- ✅ Average scan time <60 seconds

### User Metrics
- ✅ 10+ beta testers validated
- ✅ 4.5+ star average rating
- ✅ 50+ installs in first week
- ✅ 10+ positive reviews

### Business Metrics
- ✅ $1K MRR in first month
- ✅ $10K MRR in 3 months
- ✅ <10% churn rate
- ✅ 80%+ customer satisfaction

---

## 🔥 ADDITIONAL REQUIREMENTS

### Code Quality Standards

**ESLint Rules** (extend Google style):
```json
{
  "extends": ["google", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "max-len": ["error", { "code": 100 }],
    "require-jsdoc": "error",
    "no-console": "off",  // Allowed for GitHub Actions logging
    "no-unused-vars": "error"
  }
}
```

**Prettier Config**:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Security Hardening

**Input Validation**:
- Sanitize all user inputs
- Validate GitHub token has correct permissions
- Validate Anthropic API key format
- Validate framework names against whitelist

**Dependency Security**:
- Run `npm audit` before every release
- No dependencies with known vulnerabilities
- Pin dependency versions (no ^, ~)
- Use Dependabot for updates

**Secrets Management**:
- Never log API keys
- Never include secrets in reports
- Never commit .env files
- Document secret storage in README

### Accessibility

**Reports must be**:
- Screen reader compatible (semantic HTML in PDF)
- Color-blind friendly (use patterns + colors)
- High contrast (WCAG AA compliant)

---

## 📞 SUPPORT DOCUMENTATION

### Common Issues & Solutions

**Document in TROUBLESHOOTING.md**:

1. "Action fails with 403 Forbidden"
   - Cause: GitHub token lacks permissions
   - Solution: Use `permissions: write-all` or specific permissions

2. "Claude API timeout"
   - Cause: Large repository, slow API
   - Solution: Increase timeout, use caching

3. "Out of memory error"
   - Cause: Analyzing too many files at once
   - Solution: Reduce batch size, use streaming

4. "Rate limit exceeded"
   - Cause: Too many GitHub API calls
   - Solution: Implement exponential backoff

5. "PDF report not generated"
   - Cause: pdf-lib error, invalid data
   - Solution: Check logs, validate data format

---

## 🎉 FINAL DELIVERABLES

When this prompt is complete, you should have:

### 1. Production-Ready Code
- ✅ Fully implemented GitHub Action
- ✅ All source files in src/
- ✅ Compiled dist/index.js
- ✅ 95%+ test coverage
- ✅ Zero errors, zero warnings

### 2. Complete Documentation
- ✅ README.md (marketplace-optimized)
- ✅ ARCHITECTURE.md
- ✅ CONTROLS.md
- ✅ EXAMPLES.md
- ✅ TROUBLESHOOTING.md
- ✅ CHANGELOG.md

### 3. Visual Assets
- ✅ Icon (128x128 PNG)
- ✅ Demo GIF (shows full workflow)
- ✅ Screenshots (5+)

### 4. Testing Evidence
- ✅ Test results (all passing)
- ✅ Coverage report (≥95%)
- ✅ Security audit (clean)
- ✅ Performance benchmarks (within targets)

### 5. Marketplace Listing
- ✅ Published to GitHub Marketplace
- ✅ Tagged as v1.0.0
- ✅ Release notes published
- ✅ Demo repository created

### 6. Revenue Infrastructure
- ✅ Stripe account setup
- ✅ Pricing plans configured
- ✅ Checkout links in README
- ✅ License key system (if applicable)

---

## 🚨 CRITICAL SUCCESS FACTORS

### Non-Negotiables

1. **Security**: Zero vulnerabilities, no secrets leaked
2. **Quality**: 95%+ test coverage, all tests passing
3. **Performance**: <60 second scan for standard repos
4. **Documentation**: Complete, accurate, professional
5. **UX**: Clear error messages, helpful PR comments
6. **Reliability**: Handles errors gracefully, never crashes

### Definition of Done

This project is DONE when:
- ✅ All tests pass
- ✅ Published to GitHub Marketplace
- ✅ Validated on 5 real repositories
- ✅ Documentation complete
- ✅ Revenue infrastructure ready
- ✅ You (the human) approve final product

---

## 🎯 START HERE

**Agent Coordinators**: Read this entire prompt, understand the requirements, then execute the multi-agent orchestration strategy outlined above.

**Quality Assurance**: At each quality gate, pause for review. Do not proceed until approved.

**Communication**: Update progress regularly. Use structured logging. Flag blockers immediately.

**Iteration**: If initial implementation doesn't meet requirements, iterate until it does. Quality over speed.

---

## 📊 AGENT COORDINATION COMMANDS

### Initialize Swarm
```bash
npx claude-flow swarm init --topology mesh --max-agents 10
```

### Spawn Phase 1 (Architecture)
```bash
npx claude-flow agent spawn --type sparc-architect --task "Read BUILD_COMPLIANCE_AUTOPILOT.md Phase 1, create architecture docs"
```

### Spawn Phase 2 (Implementation Swarm)
```bash
# Spawn 8 agents in parallel
npx claude-flow swarm spawn --count 8 --type sparc-coder --distribute-tasks "
  Agent 1: src/collectors/soc2.ts
  Agent 2: src/collectors/gdpr.ts
  Agent 3: src/collectors/iso27001.ts
  Agent 4: src/analyzers/code-analyzer.ts
  Agent 5: src/reports/pdf-generator.ts
  Agent 6: src/github/api-client.ts
  Agent 7: src/index.ts
  Agent 8: src/types/ and src/utils/
"
```

### Quality Gate Validation
```bash
npx claude-flow agent spawn --type code-review-swarm --task "Review all Phase 2 code for quality, security, performance"
```

### Spawn Phase 3 (Testing)
```bash
npx claude-flow agent spawn --type tester --task "Create comprehensive test suite per requirements in BUILD_COMPLIANCE_AUTOPILOT.md Phase 3"
```

### Final Validation
```bash
npx claude-flow agent spawn --type production-validator --task "Validate entire project meets all success criteria in BUILD_COMPLIANCE_AUTOPILOT.md"
```

---

**GO BUILD SOMETHING AMAZING! 🚀**

This is not just a GitHub Action. This is a **revenue-generating business** that solves a **real, painful problem** for thousands of companies. Execute with excellence, ship with confidence, scale with purpose.

**Expected timeline**: 2-4 days (with parallel agents)
**Expected first-month revenue**: $1,000-$5,000 MRR
**Expected six-month revenue**: $10,000-$30,000 MRR

Let's make compliance automation effortless. Let's ship this. 💪
