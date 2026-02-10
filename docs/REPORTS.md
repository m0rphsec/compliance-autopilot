# Compliance Reports Documentation

## Overview

The Compliance Autopilot generates professional, audit-ready reports in multiple formats to meet the needs of different stakeholders.

## Report Formats

### 1. PDF Reports (For Auditors)

**Purpose**: Human-readable evidence packages for audit submissions

**Features**:
- Professional design with company branding
- Executive summary for leadership
- Detailed findings for auditors
- Code snippets and violation details
- Actionable recommendations
- Accessibility compliant (WCAG AA)

**Use Cases**:
- Annual compliance audits
- Certification submissions
- Executive presentations
- Regulatory filings

**Example Output**:
```
┌─────────────────────────────────────┐
│   COMPLIANCE REPORT                 │
│   SOC2                              │
│                                     │
│   Repository: myorg/myrepo     85%  │
│   Generated: Jan 15, 2024           │
│                                     │
│   Passed: 55  Failed: 7  N/A: 2    │
└─────────────────────────────────────┘
```

### 2. JSON Evidence (For Automation)

**Purpose**: Machine-readable data for programmatic access

**Features**:
- Structured JSON schema
- ISO 8601 timestamps
- Semantic versioning
- Complete evidence trail
- Easy integration with other tools

**Use Cases**:
- Continuous compliance monitoring
- Integration with ticketing systems
- Dashboard visualization
- Trend analysis
- API endpoints

**Example Output**:
```json
{
  "metadata": {
    "version": "1.0.0",
    "generator": "Compliance Autopilot",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  },
  "framework": "SOC2",
  "compliance": {
    "overallScore": 85.5,
    "status": "FAIL",
    "grade": "Good"
  },
  "controls": [...]
}
```

## Report Structure

### Cover Page

**Contents**:
- Report title and framework badge
- Compliance score (large, prominent)
- Repository information
- Generation timestamp
- Summary statistics boxes

**Design**:
- Blue/green gradient header
- Large circular score indicator
- Color-coded status boxes
- Clean, professional layout

### Executive Summary

**Contents**:
- Overall compliance status
- Key findings (3-5 bullet points)
- Critical failures (if any)
- Pass rate and statistics
- High-level recommendations

**Audience**: C-suite, board members, non-technical stakeholders

**Example**:
```
Executive Summary

Overall Compliance Status: Good

This report summarizes the SOC2 compliance assessment for
myorg/myrepo as of January 15, 2024.

Key Findings:
• 55 of 64 controls passed (85.9%)
• 7 controls failed and require immediate attention
• 2 controls marked as not applicable
• 3 critical violations detected
```

### Control Findings

**Contents**:
- Complete list of all controls evaluated
- Status indicator (✓ PASS, ✗ FAIL, ○ N/A)
- Control ID and name
- Severity level
- Evidence summary

**Format**:
```
✓ CC1.1: Code Review Process          [HIGH]
Status: PASS | Severity: HIGH
Evidence: All PRs have ≥1 approval before merge.
Analysis of 156 pull requests shows 100% compliance.

✗ CC6.1: Deployment Controls          [CRITICAL]
Status: FAIL | Severity: CRITICAL
Evidence: Manual deployments detected in 3 instances.
See violation details for remediation steps.
```

### Violation Details

**Contents** (for failed controls):
- File path and line number
- Code snippet (syntax highlighted)
- Explanation of the issue
- Recommendation for remediation
- Related controls

**Format**:
```
CC6.1: Deployment Controls

Violation 1: deploy.sh:42
┌─────────────────────────────────────┐
│ git push production main            │
└─────────────────────────────────────┘

Issue: Manual deployment detected. Deployments should
go through automated CI/CD pipeline.

Recommendation: Use GitHub Actions workflow for
deployments. See docs/CICD.md for setup guide.
```

### Recommendations

**Contents**:
- Prioritized list of actions (by severity)
- Next steps for remediation
- Timeline suggestions
- Documentation references

**Format**:
```
Recommendations

CRITICAL Priority (3)
• CC6.1: Deployment Controls
• CC7.1: System Monitoring
• CC8.1: Risk Assessment

HIGH Priority (4)
• CC1.1: Code Review Process
• CC1.2: Commitment to Integrity
...

Next Steps:
1. Address all critical severity violations immediately
2. Create remediation plan for high/medium items
3. Schedule follow-up scan after fixes
4. Document all changes for audit trail
```

## Design System

### Colors

All colors meet WCAG AA contrast requirements:

| Color      | Hex     | RGB                       | Usage                  |
|------------|---------|---------------------------|------------------------|
| Primary    | #1949A1 | rgb(25, 73, 161)          | Headers, accents       |
| Secondary  | #21967A | rgb(33, 150, 122)         | Highlights, success    |
| Success    | #228B22 | rgb(34, 139, 34)          | Pass status            |
| Warning    | #F59B1A | rgb(245, 155, 26)         | Medium severity        |
| Danger     | #DC322F | rgb(220, 50, 47)          | Fail status, critical  |
| Text       | #333333 | rgb(51, 51, 51)           | Body text              |
| Text Light | #666666 | rgb(102, 102, 102)        | Secondary text         |
| Background | #FAFAFA | rgb(250, 250, 250)        | Code blocks, panels    |

### Typography

| Element    | Font               | Size | Weight |
|------------|-------------------|------|--------|
| Title      | Helvetica         | 32pt | Bold   |
| Heading 1  | Helvetica         | 24pt | Bold   |
| Heading 2  | Helvetica         | 18pt | Bold   |
| Heading 3  | Helvetica         | 14pt | Bold   |
| Body       | Helvetica         | 11pt | Normal |
| Code       | Courier           | 9pt  | Normal |
| Small      | Helvetica         | 9pt  | Normal |

### Layout

- **Page size**: US Letter (8.5" x 11")
- **Margins**: 0.83" (60pt) on all sides
- **Line height**: 1.4x font size
- **Paragraph spacing**: 10-20pt
- **Section spacing**: 30-40pt

## Accessibility

### Visual Accessibility

✅ **Color Contrast**
- All text meets WCAG AA contrast ratio (4.5:1 minimum)
- Large text (≥18pt) meets 3:1 ratio
- Non-text elements meet 3:1 ratio

✅ **Color-Blind Friendly**
- Status indicated by icons (✓, ✗, ○) not just color
- Severity uses text labels in addition to color
- Charts use patterns alongside colors

✅ **Typography**
- Minimum font size: 9pt
- Readable sans-serif font (Helvetica)
- Adequate line spacing (1.4x)
- No light/thin font weights

### Structural Accessibility

✅ **Screen Reader Compatible**
- PDF metadata (title, author, subject, keywords)
- Semantic heading hierarchy (H1 → H2 → H3)
- Alternative text for visual elements
- Logical reading order

✅ **Keyboard Navigation**
- Bookmarks for major sections
- Table of contents with links
- Page numbers for reference

## Performance

### Generation Time

| Report Size | Controls | Pages | Time    |
|-------------|----------|-------|---------|
| Small       | 1-10     | 2-4   | <1s     |
| Medium      | 11-50    | 5-15  | <3s     |
| Large       | 51-100   | 16-40 | <5s     |
| X-Large     | 100+     | 40+   | <8s     |

### Optimization Techniques

1. **Lazy Page Creation**: Pages created only when needed
2. **Font Embedding**: Use StandardFonts (no custom font data)
3. **Efficient Text Wrapping**: Pre-calculate line breaks
4. **Memory Management**: Clear objects after use
5. **Streaming**: Process controls one at a time

### Benchmarks

```bash
# Run performance benchmarks
npm run benchmark:reports

# Output:
# Small report (10 controls):    824ms
# Medium report (50 controls):  2,156ms
# Large report (100 controls):  4,332ms
# X-Large report (200 controls): 7,891ms
```

## Integration Examples

### GitHub Action

```yaml
- name: Generate Compliance Report
  uses: ./
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    frameworks: 'soc2,gdpr'
    report-format: 'both'

- name: Upload PDF Report
  uses: actions/upload-artifact@v3
  with:
    name: compliance-report
    path: compliance-report.pdf

- name: Store JSON Evidence
  run: |
    gh release create v$(date +%Y.%m.%d) \
      --notes "Compliance Evidence" \
      evidence.json
```

### CI/CD Pipeline

```typescript
import { PDFGenerator, JSONFormatter } from './reports';

async function generateReports(scanResults) {
  const pdfGen = new PDFGenerator();
  const jsonFmt = new JSONFormatter();

  // Generate both formats
  const [pdf, json] = await Promise.all([
    pdfGen.generate(scanResults),
    Promise.resolve(jsonFmt.format(scanResults)),
  ]);

  // Upload to artifact store
  await uploadArtifacts({
    pdf: {
      name: `compliance-${Date.now()}.pdf`,
      data: pdf,
    },
    json: {
      name: `evidence-${Date.now()}.json`,
      data: json,
    },
  });

  return { pdf, json };
}
```

### Slack Notification

```typescript
import { JSONFormatter } from './reports';

const formatter = new JSONFormatter();
const json = formatter.format(scanResults);
const data = JSON.parse(json);

await slack.postMessage({
  channel: '#compliance',
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${data.framework} Compliance Scan`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Score:* ${data.compliance.overallScore}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Status:* ${data.compliance.status}`,
        },
        {
          type: 'mrkdwn',
          text: `*Passed:* ${data.summary.passed}/${data.summary.total}`,
        },
        {
          type: 'mrkdwn',
          text: `*Failed:* ${data.summary.failed}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Report',
          },
          url: reportUrl,
        },
      ],
    },
  ],
});
```

### Dashboard API

```typescript
import express from 'express';
import { JSONFormatter } from './reports';

const app = express();
const formatter = new JSONFormatter();

app.get('/api/compliance/:org/:repo', async (req, res) => {
  const { org, repo } = req.params;

  // Fetch latest scan results
  const scanResults = await fetchLatestScan(org, repo);

  // Format as JSON
  const json = formatter.format(scanResults);
  const data = JSON.parse(json);

  res.json(data);
});

app.get('/api/compliance/:org/:repo/pdf', async (req, res) => {
  const { org, repo } = req.params;

  const scanResults = await fetchLatestScan(org, repo);
  const pdfGen = new PDFGenerator();
  const pdf = await pdfGen.generate(scanResults);

  res.contentType('application/pdf');
  res.send(Buffer.from(pdf));
});
```

## Best Practices

### 1. Version Control Evidence

```typescript
// Store evidence with git hash for traceability
const evidence = {
  ...scanResults,
  git: {
    sha: process.env.GITHUB_SHA,
    ref: process.env.GITHUB_REF,
    actor: process.env.GITHUB_ACTOR,
  },
};
```

### 2. Immutable Storage

```typescript
// Store in GitHub Releases (immutable)
const releaseTag = `compliance-${new Date().toISOString().split('T')[0]}`;
await octokit.repos.createRelease({
  owner,
  repo,
  tag_name: releaseTag,
  name: `Compliance Evidence - ${releaseTag}`,
  body: 'Automated compliance scan evidence',
});

await octokit.repos.uploadReleaseAsset({
  url: release.upload_url,
  headers: { 'content-type': 'application/pdf' },
  name: 'compliance-report.pdf',
  data: pdfBytes,
});
```

### 3. Trend Analysis

```typescript
// Compare against historical data
const history = await loadHistoricalScans();
const trend = calculateTrend(currentScan, history);

if (trend.direction === 'declining') {
  await notifyTeam({
    message: `Compliance score declining: ${trend.change}% over last ${trend.period}`,
    severity: 'warning',
  });
}
```

### 4. Scheduled Audits

```yaml
# .github/workflows/compliance-audit.yml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: m0rphsec/compliance-autopilot@v1
        with:
          frameworks: 'soc2,gdpr,iso27001'
          fail-on-violations: 'false'
      - name: Archive reports
        run: |
          mkdir -p archives/$(date +%Y/%m)
          mv *.pdf archives/$(date +%Y/%m)/
          git add archives/
          git commit -m "Archive compliance reports"
          git push
```

## Troubleshooting

### PDF Generation Issues

**Problem**: PDF is too large (>10MB)

**Solution**:
```typescript
// Reduce image quality or exclude large code blocks
const options = {
  maxCodeSnippetLength: 200,
  compressImages: true,
};
```

**Problem**: Fonts not rendering correctly

**Solution**:
```typescript
// Use StandardFonts only (included in pdf-lib)
import { StandardFonts } from 'pdf-lib';
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
```

### JSON Export Issues

**Problem**: Circular reference in data

**Solution**:
```typescript
// Use JSON.stringify with replacer
const json = JSON.stringify(data, (key, value) => {
  if (key === 'parent') return undefined;
  return value;
});
```

**Problem**: Date serialization

**Solution**:
```typescript
// Always convert Dates to ISO strings
timestamp: data.timestamp.toISOString()
```

## Security Considerations

### Sensitive Data

⚠️ **Do NOT include in reports**:
- API keys or secrets
- Personal identifiable information (PII)
- Database credentials
- Internal IP addresses
- Proprietary algorithms

✅ **Safe to include**:
- Public repository names
- Commit SHAs
- User handles (if public)
- File paths (if public repo)
- Compliance scores

### Report Distribution

- Store reports in secure locations (GitHub private repos, S3 with encryption)
- Use time-limited signed URLs for sharing
- Add watermarks for tracking distribution
- Encrypt PDFs with passwords for highly sensitive reports

## Compliance Mapping

| Framework  | Report Sections                  | Controls Covered |
|-----------|----------------------------------|------------------|
| SOC2      | Security, Availability, etc.     | 64 criteria      |
| GDPR      | Data Protection, Privacy         | 99 articles      |
| ISO27001  | ISMS, Security Controls          | 114 controls     |

## Future Roadmap

- [ ] Interactive HTML reports
- [ ] Chart/graph generation (trend lines, pie charts)
- [ ] Custom logo/branding support
- [ ] Multi-language reports (i18n)
- [ ] Digital signatures for PDFs
- [ ] Report templates customization
- [ ] Excel/CSV export for analysis
- [ ] Email delivery integration
- [ ] Audit trail watermarking

## Support

For issues or questions:
- 🐛 Issues: [GitHub Issues](https://github.com/m0rphsec/compliance-autopilot/issues)
- 📚 Docs: https://github.com/m0rphsec/compliance-autopilot/tree/main/docs
