# 🏛️ Architecture Documentation

## System Overview

Compliance Autopilot is a GitHub Action that automates compliance evidence collection for SOC2, GDPR, and ISO27001 frameworks. The system analyzes repository data, code changes, and security practices to generate audit-ready reports.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       GitHub Actions Runtime                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Main Orchestrator                        │ │
│  │                    (src/index.ts)                          │ │
│  │                                                              │ │
│  │  • Input validation                                         │ │
│  │  • Context extraction                                       │ │
│  │  • Parallel orchestration                                   │ │
│  │  • Error handling                                           │ │
│  │  • Output generation                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│           │              │              │              │          │
│           ▼              ▼              ▼              ▼          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │   SOC2      │ │    GDPR     │ │  ISO27001   │ │ GitHub   │ │
│  │  Collector  │ │  Collector  │ │  Collector  │ │   API    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│           │              │              │              │          │
│           └──────────────┴──────────────┴──────────────┘          │
│                           │                                        │
│                           ▼                                        │
│                  ┌─────────────────┐                             │
│                  │  Code Analyzer   │                             │
│                  │  (Claude AI)     │                             │
│                  └─────────────────┘                             │
│                           │                                        │
│           ┌───────────────┴────────────────┐                     │
│           ▼                                 ▼                     │
│  ┌──────────────────┐            ┌──────────────────┐           │
│  │  PDF Generator   │            │  JSON Formatter  │           │
│  └──────────────────┘            └──────────────────┘           │
│           │                                 │                     │
│           └─────────────┬───────────────────┘                     │
│                         ▼                                          │
│              ┌──────────────────────┐                            │
│              │  GitHub Integration   │                            │
│              │  • Artifact Upload    │                            │
│              │  • PR Comments        │                            │
│              │  • Slack Alerts       │                            │
│              └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Main Orchestrator (`src/index.ts`)

**Responsibilities:**
- Parse and validate GitHub Action inputs
- Extract repository context (owner, repo, PR number, commit SHA)
- Initialize GitHub API client
- Orchestrate parallel evidence collection
- Aggregate results across frameworks
- Generate reports
- Upload artifacts
- Post PR comments
- Send Slack alerts
- Set action outputs

**Data Flow:**
```typescript
Inputs → Validation → Context → Collectors → Aggregation → Reports → GitHub → Outputs
```

**Key Functions:**
- `run()` - Main entry point
- `validateInputs()` - Input validation
- `getGitHubContext()` - Context extraction
- `runCollectors()` - Parallel collection
- `aggregateResults()` - Result combination
- `generateReports()` - Report creation
- `uploadArtifacts()` - Artifact storage
- `postPRComment()` - PR commenting
- `sendSlackAlert()` - Slack notification

### 2. Evidence Collectors

#### SOC2 Collector (`src/collectors/soc2.ts`)

**Purpose:** Collect evidence for SOC2 Type II compliance (64 Common Criteria)

**Evidence Sources:**
- Pull request reviews (CC1.1 - Code Review)
- Deployment history (CC6.1 - Deployment Controls)
- Repository collaborators (CC6.6 - Access Controls)
- Security issues (CC7.1 - System Monitoring)
- Commit history (CC7.2 - Change Management)
- Vulnerability alerts (CC8.1 - Risk Assessment)

**API Calls:**
```typescript
octokit.rest.pulls.listReviews()
octokit.rest.repos.listDeployments()
octokit.rest.repos.listCollaborators()
octokit.rest.issues.listForRepo()
octokit.rest.repos.compareCommits()
octokit.rest.repos.listVulnerabilityAlerts()
```

**Output Format:**
```typescript
{
  framework: 'soc2',
  timestamp: '2026-02-02T12:00:00Z',
  controls: [
    {
      id: 'CC1.1',
      name: 'Code Review Enforcement',
      status: 'PASS',
      evidence: { /* ... */ },
      recommendations: []
    },
    // ... 63 more controls
  ],
  summary: { passed: 60, failed: 4, total: 64 }
}
```

#### GDPR Collector (`src/collectors/gdpr.ts`)

**Purpose:** Scan code for GDPR compliance violations

**Detection Capabilities:**
- PII data types (emails, names, SSNs, phone numbers, addresses)
- Encryption in transit (HTTPS, TLS verification)
- Encryption at rest (database encryption checks)
- Consent mechanisms (checkboxes, agreements in UI)
- Data retention policies (TTL, expiration logic)
- Right to deletion (delete endpoints, data removal)

**Analysis Strategy:**
1. **Regex scanning** for quick PII detection
2. **Claude AI analysis** for contextual understanding
3. **Evidence aggregation** for each requirement
4. **Violation reporting** with fix suggestions

**Output Format:**
```typescript
{
  framework: 'gdpr',
  timestamp: '2026-02-02T12:00:00Z',
  controls: [
    {
      id: 'Art. 32',
      name: 'Security of Processing',
      status: 'FAIL',
      evidence: {
        has_pii: true,
        pii_types: ['email', 'name'],
        encryption_transit: true,
        encryption_rest: false,
        violations: ['No encryption at rest detected']
      },
      recommendations: ['Add database encryption']
    },
    // ... more articles
  ]
}
```

#### ISO27001 Collector (`src/collectors/iso27001.ts`)

**Purpose:** Monitor ISO 27001:2013 controls (114 controls)

**Control Categories:**
- A.5 - Information security policies
- A.6 - Organization of information security
- A.7 - Human resource security
- A.8 - Asset management
- A.9 - Access control
- A.10 - Cryptography
- A.11 - Physical and environmental security
- A.12 - Operations security
- A.13 - Communications security
- A.14 - System acquisition, development and maintenance

**Evidence Collection:**
- Security policy files (SECURITY.md, policies/)
- Access control configurations (.github/CODEOWNERS)
- Incident response documentation
- Risk assessment records
- Security scanning results

### 3. Code Analyzer (`src/analyzers/code-analyzer.ts`)

**Purpose:** Use Claude AI for contextual code analysis

**Claude Integration:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4.5-20250929',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: `Analyze this code for GDPR compliance:\n\n${code}\n\n...`
  }]
});
```

**Prompt Strategy:**
- Clear instructions with structured output format
- Request JSON responses for parsing
- Include code context and file paths
- Ask for specific compliance checks
- Request fix recommendations

**Optimizations:**
- **Caching:** Cache identical code block analyses
- **Batching:** Analyze multiple files in single request
- **Rate limiting:** Respect Anthropic API rate limits
- **Retry logic:** Exponential backoff on failures
- **Timeout handling:** 30-second timeout per request

**Performance:**
- Average request time: 2-5 seconds
- Cache hit rate: 40-60% on typical repos
- Parallel analysis: Up to 5 concurrent requests

### 4. Report Generators

#### PDF Generator (`src/reports/pdf-generator.ts`)

**Purpose:** Create audit-ready PDF reports

**Report Structure:**
1. **Cover Page**
   - Company logo
   - Report title
   - Date and time
   - Framework(s) covered

2. **Executive Summary**
   - Overall compliance status
   - Controls passed/failed
   - Key findings
   - Recommendations

3. **Detailed Findings**
   - Control-by-control breakdown
   - Evidence for each control
   - Failure reasons
   - Fix recommendations

4. **Appendix**
   - Raw evidence data
   - API call logs
   - Timestamps

**Technology:** pdf-lib v1.17+ for PDF generation

**Features:**
- Professional branding
- Color-coded status (green/red/yellow)
- Charts and tables
- Hyperlinks to GitHub resources
- Page numbers and table of contents

#### JSON Formatter (`src/reports/json-formatter.ts`)

**Purpose:** Export machine-readable evidence

**Format:**
```json
{
  "report_id": "uuid-v4",
  "generated_at": "2026-02-02T12:00:00Z",
  "repository": {
    "owner": "yourusername",
    "repo": "your-repo",
    "commit_sha": "abc123"
  },
  "frameworks": ["soc2", "gdpr"],
  "results": {
    "soc2": { /* framework results */ },
    "gdpr": { /* framework results */ }
  },
  "summary": {
    "total_controls": 100,
    "passed": 85,
    "failed": 15,
    "status": "FAIL"
  }
}
```

### 5. GitHub Integration (`src/github/`)

#### API Client (`api-client.ts`)

**Purpose:** Wrapper around Octokit with rate limiting and retries

**Features:**
- Automatic retry with exponential backoff
- Rate limit detection and waiting
- Request logging
- Error normalization

#### PR Commenter (`pr-commenter.ts`)

**Purpose:** Post compliance reports as PR comments

**Comment Format:**
```markdown
## 🔒 Compliance Check Results

**Status:** ✅ PASS / ❌ FAIL
**Frameworks:** SOC2, GDPR
**Controls Checked:** 100
**Passed:** 85 | **Failed:** 15

### Summary by Framework

**SOC2:** 60/64 controls passed
**GDPR:** 25/36 controls passed

### Failed Controls

- ❌ **GDPR Art. 32** - No encryption at rest detected
  - **Fix:** Add database encryption

[View Full Report](link-to-pdf) | [View JSON Evidence](link-to-json)
```

#### Artifact Store (`artifact-store.ts`)

**Purpose:** Upload reports to GitHub Releases

**Storage Strategy:**
- Create release for each scan (e.g., `compliance-2026-02-02-12-00-00`)
- Upload PDF and JSON as release assets
- Tag with commit SHA
- Immutable storage (releases cannot be edited)

## Data Flow

### End-to-End Flow

```
1. GitHub Action Triggered
   ↓
2. Validate Inputs (API keys, frameworks, etc.)
   ↓
3. Extract Context (repo, PR, commit)
   ↓
4. Initialize GitHub API Client
   ↓
5. Run Collectors in Parallel
   ├─ SOC2 Collector → GitHub API calls
   ├─ GDPR Collector → Code scanning + Claude AI
   └─ ISO27001 Collector → File checks
   ↓
6. Aggregate Results
   ↓
7. Generate Reports (PDF + JSON)
   ↓
8. Upload to GitHub Releases
   ↓
9. Post PR Comment (if PR context)
   ↓
10. Send Slack Alert (if configured)
   ↓
11. Set Action Outputs
   ↓
12. Exit with Success/Failure
```

## Performance Optimizations

### 1. Parallel Execution
- Run all collectors concurrently using `Promise.all()`
- Reduces total time by 60-70%

### 2. Caching
- Cache Claude API responses for identical code blocks
- Cache GitHub API responses (5-minute TTL)

### 3. Batching
- Batch GitHub API calls to minimize requests
- Analyze multiple files in single Claude request

### 4. Rate Limiting
- Respect GitHub API rate limits (5000 requests/hour)
- Respect Anthropic API rate limits (50 requests/minute)
- Automatic backoff when limits approached

### 5. Streaming
- Stream large file reads to minimize memory
- Generate PDF in chunks

## Security Model

### Secrets Handling
- API keys stored in GitHub Secrets
- Automatically redacted from logs
- Never included in reports or artifacts
- Validated before use

### Permissions Required
```yaml
permissions:
  contents: read       # Read repository files
  pull-requests: write # Post PR comments
  actions: write       # Upload artifacts
```

### Data Privacy
- Code never sent to third parties except Anthropic API
- Evidence stored only in your GitHub repository
- No data retained by the action
- Anthropic API: Zero data retention mode

### API Security
- Use GitHub App tokens (preferred) or PAT
- Minimum required permissions
- Token validation before API calls
- Error messages sanitized (no token leakage)

## Technology Stack

### Production Dependencies
- **@actions/core** v1.10.1 - GitHub Actions SDK
- **@actions/github** v6.0.0 - GitHub API helpers
- **@anthropic-ai/sdk** v0.20.0 - Claude AI integration
- **@octokit/rest** v20.0.2 - GitHub REST API client
- **pdf-lib** v1.17.1 - PDF generation

### Development Dependencies
- **TypeScript** v5.3.3 - Type safety
- **Jest** v29.7.0 - Testing framework
- **ESLint** v8.56.0 - Code linting
- **Prettier** v3.2.4 - Code formatting
- **@vercel/ncc** v0.38.1 - Single-file compilation

### Runtime
- **Node.js** 20+ (GitHub Actions standard)
- **Memory:** ~256MB typical usage
- **CPU:** 1 vCPU sufficient

## Error Handling

### Error Categories
1. **Validation Errors** - Invalid inputs
2. **API Errors** - GitHub or Anthropic API failures
3. **Collection Errors** - Evidence collection failures
4. **Report Errors** - PDF/JSON generation failures
5. **Network Errors** - Connectivity issues

### Recovery Strategy
- Retry with exponential backoff (max 3 attempts)
- Graceful degradation (skip non-critical failures)
- Detailed error messages with fix instructions
- Continue execution when possible (don't fail fast)

### Logging
- Structured logging with metadata
- Debug mode: `RUNNER_DEBUG=1`
- Performance metrics tracked
- No secrets in logs

## Monitoring & Metrics

### Tracked Metrics
- Execution time (total and per-component)
- API calls made (GitHub + Anthropic)
- Controls checked and passed/failed
- Cache hit rates
- Error rates

### Output
```typescript
{
  'compliance-status': 'PASS',
  'controls-passed': '85',
  'controls-total': '100',
  'report-url': 'https://github.com/owner/repo/releases/...'
}
```

## Future Enhancements

### Planned Features
1. **Custom Controls** - User-defined compliance rules
2. **Historical Trending** - Track compliance over time
3. **Multi-repo Support** - Scan multiple repos at once
4. **Scheduled Scans** - Automatic daily/weekly scans
5. **Integration Plugins** - Jira, ServiceNow, etc.

### Performance Targets
- **Current:** ~60 seconds for 500-file repo
- **Target:** ~30 seconds with optimizations

---

For implementation details, see the source code in `src/`. For usage examples, see [EXAMPLES.md](./EXAMPLES.md).
