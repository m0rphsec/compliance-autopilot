# GitHub Integration Module

Enterprise-grade GitHub API integration for Compliance Autopilot with robust error handling, rate limiting, and immutable evidence storage.

## 📦 Modules

### 1. **api-client.ts** - GitHub API Wrapper
Robust Octokit wrapper with enterprise-grade reliability:

**Features:**
- ✅ Exponential backoff for rate limiting (retries up to 3x)
- ✅ Clear permission error messages with fix instructions
- ✅ Network timeout handling and retries
- ✅ Comprehensive error categorization
- ✅ TypeScript strict mode compliance

**Usage:**
```typescript
import { createGitHubClient } from './api-client';

const client = createGitHubClient({
  token: process.env.GITHUB_TOKEN,
  owner: 'myorg',
  repo: 'myrepo',
});

// Get PR reviews
const reviews = await client.getPRReviews(123);
console.log(`PR has ${reviews.length} reviews`);

// Check rate limit
const rateLimit = await client.getRateLimit();
console.log(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);

// Get collaborators
const collabs = await client.getCollaborators();
const admins = collabs.filter(c => c.permissions.admin);
```

**Error Handling:**
```typescript
try {
  const reviews = await client.getPRReviews(123);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limit hit. Reset at: ${error.resetAt}`);
    // Automatic retry with backoff
  } else if (error instanceof PermissionError) {
    console.log(`Missing permissions: ${error.requiredScopes.join(', ')}`);
    console.log(error.message); // Includes fix instructions
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 2. **pr-commenter.ts** - PR Comment Manager
Professional compliance status comments with markdown formatting:

**Features:**
- ✅ Markdown-formatted compliance reports
- ✅ Status badges (✅ PASS, ❌ FAIL, ⚠️ WARNING)
- ✅ Visual progress bars
- ✅ Collapsible detailed findings
- ✅ Update existing comments (no spam)
- ✅ Professional branding

**PR Comment Template:**
```markdown
## ✅ Compliance Autopilot Report

**Status**: `PASS` ✅
**Frameworks**: SOC2, GDPR, ISO27001
**Controls Passed**: 58/64 (90.6%)
**Scan Duration**: 45.0s

🟢 `[████████████████░░░░]` 90.6%

### 📋 Summary

✅ **58 controls passed**

❌ **6 controls failed**
  - CC6.1: Deployment controls
    > No CI/CD workflow detected

<details>
<summary><strong>🔍 Detailed Findings</strong></summary>

#### ❌ Failed Controls

**CC6.1** - Deployment controls
```
No CI/CD workflow detected in .github/workflows/
Recommendation: Add a deployment workflow with approval gates
```

</details>

📊 **[View Full Report](https://github.com/repo/releases/tag/evidence-123)**
```

**Usage:**
```typescript
import { createPRCommenter } from './pr-commenter';

const commenter = createPRCommenter(
  process.env.GITHUB_TOKEN,
  'myorg',
  'myrepo'
);

await commenter.postComment({
  prNumber: 123,
  owner: 'myorg',
  repo: 'myrepo',
  status: {
    status: 'PASS',
    frameworks: ['SOC2', 'GDPR'],
    controlsPassed: 58,
    controlsTotal: 64,
    summary: [/* ... */],
    reportUrl: 'https://...',
    scanDuration: 45000,
    timestamp: new Date(),
  },
  includeDetails: true,
  collapseDetails: true,
});
```

### 3. **artifact-store.ts** - Immutable Evidence Storage
Store compliance evidence in GitHub Releases as tamper-proof audit trail:

**Features:**
- ✅ Immutable storage (cannot be deleted without trace)
- ✅ SHA-256 checksums for integrity verification
- ✅ Version controlled with tags
- ✅ Downloadable URLs for auditors
- ✅ Searchable via GitHub UI
- ✅ Automatic deduplication

**Benefits:**
- **Auditor-friendly**: Direct download links, no special tools required
- **Permanent**: Releases are immutable, changes are tracked
- **Organized**: Auto-generated tags and descriptions
- **Verifiable**: SHA-256 checksums for integrity checks

**Usage:**
```typescript
import { createArtifactStore } from './artifact-store';

const store = createArtifactStore(
  process.env.GITHUB_TOKEN,
  'myorg',
  'myrepo'
);

// Upload single evidence file
const result = await store.uploadEvidence(
  '/tmp/compliance-report.pdf',
  {
    prNumber: 123,
    commitSha: 'abc123',
    framework: 'soc2',
  }
);

console.log('Report URL:', result.downloadUrl);
console.log('SHA-256:', result.artifact.sha256);

// Upload multiple files
const results = await store.uploadBulkEvidence(
  [
    '/tmp/soc2-report.pdf',
    '/tmp/evidence.json',
    '/tmp/audit-trail.html',
  ],
  { prNumber: 123, framework: 'soc2' }
);

// List all evidence releases
const releases = await store.listEvidenceReleases(10);
releases.forEach(release => {
  console.log(`${release.name} - ${release.assets.length} files`);
});
```

**Release Structure:**
```
Tag: compliance-evidence-soc2-pr-123-2024-01-15T10-30-00Z

Name: Compliance Evidence - SOC2 - PR #123 - 2024-01-15

Assets:
  - soc2-report.pdf (application/pdf, 1.2 MB)
  - evidence.json (application/json, 45 KB)
  - audit-trail.html (text/html, 120 KB)

Description:
  🔒 Compliance Evidence Package
  - Framework: SOC2
  - Pull Request: #123
  - Commit: abc123d
  - Collected: 2024-01-15T10:30:00Z

  🔐 Verification: Each asset includes SHA-256 checksum
```

## 🔒 Security & Permissions

### Required GitHub Token Permissions

**Minimum (read-only checks):**
```yaml
permissions:
  contents: read
  pull-requests: read
  issues: read
```

**Full functionality (comments + uploads):**
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

### Permission Errors

All modules provide **actionable error messages** when permissions are missing:

```
Failed to create PR comment

Access denied. The GitHub token doesn't have sufficient permissions.

Required permissions:
  - issues:write
  - pull-requests:write

To fix this:
1. Ensure the GITHUB_TOKEN has the required permissions
2. Update your workflow file with:
   permissions:
     issues: write
     pull-requests: write
```

## 📊 Rate Limiting

GitHub API has rate limits:
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

### Handling Strategy

1. **Automatic Retries**: Up to 3 retries with exponential backoff
2. **Secondary Rate Limits**: Automatic retry for burst limits
3. **Graceful Degradation**: Warn and continue on non-critical failures
4. **Status Monitoring**: Check rate limit before expensive operations

```typescript
// Check rate limit
const rateLimit = await client.getRateLimit();

if (rateLimit.remaining < 100) {
  console.warn(`Low rate limit: ${rateLimit.remaining} remaining`);
  console.warn(`Resets at: ${rateLimit.reset.toISOString()}`);
}
```

## 🧪 Testing

### Unit Tests

All modules have 95%+ test coverage:

```bash
npm test -- tests/unit/github/
```

**Test Coverage:**
- ✅ Success cases (happy path)
- ✅ Rate limit errors (429) with retry
- ✅ Permission errors (403) with clear messages
- ✅ Not found errors (404)
- ✅ Network timeouts (ETIMEDOUT, ECONNRESET)
- ✅ Edge cases (missing data, null values)

### Mocking Strategy

Tests use mocked Octokit instances:

```typescript
jest.mock('@octokit/rest');

const mockOctokit = {
  rest: {
    pulls: {
      listReviews: jest.fn().mockResolvedValue({
        data: [/* mock reviews */]
      }),
    },
  },
};
```

## 🚀 Integration Examples

### Example 1: Full Compliance Workflow

```typescript
import { createGitHubClient, createPRCommenter, createArtifactStore } from './github';

async function runComplianceCheck(prNumber: number) {
  const token = process.env.GITHUB_TOKEN!;
  const owner = 'myorg';
  const repo = 'myrepo';

  // Initialize
  const client = createGitHubClient({ token, owner, repo });
  const commenter = createPRCommenter(token, owner, repo);
  const store = createArtifactStore(token, owner, repo);

  // Collect evidence
  const reviews = await client.getPRReviews(prNumber);
  const deployments = await client.getDeployments();
  const collaborators = await client.getCollaborators();

  // Analyze compliance (your logic here)
  const complianceStatus = analyzeCompliance({ reviews, deployments, collaborators });

  // Generate report (your logic here)
  const reportPath = await generatePDFReport(complianceStatus);

  // Upload to releases
  const uploadResult = await store.uploadEvidence(reportPath, {
    prNumber,
    framework: 'soc2',
    commitSha: process.env.GITHUB_SHA,
  });

  // Post PR comment
  await commenter.postComment({
    prNumber,
    owner,
    repo,
    status: {
      ...complianceStatus,
      reportUrl: uploadResult.downloadUrl,
    },
  });

  console.log('✅ Compliance check complete');
  console.log('📊 Report:', uploadResult.downloadUrl);
}
```

### Example 2: Error Recovery

```typescript
import { createGitHubClient, GitHubAPIError, RateLimitError } from './github';

async function collectEvidenceWithRetry(prNumber: number) {
  const client = createGitHubClient({
    token: process.env.GITHUB_TOKEN!,
    owner: 'myorg',
    repo: 'myrepo',
  });

  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const reviews = await client.getPRReviews(prNumber);
      return reviews;
    } catch (error) {
      if (error instanceof RateLimitError) {
        const waitTime = error.resetAt.getTime() - Date.now();
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
        retries++;
      } else {
        throw error; // Other errors
      }
    }
  }

  throw new Error('Max retries exceeded');
}
```

## 📝 Best Practices

### 1. Always Check Rate Limits
```typescript
const rateLimit = await client.getRateLimit();
if (rateLimit.remaining < 10) {
  throw new Error('Rate limit too low, aborting');
}
```

### 2. Use Descriptive Release Tags
```typescript
await store.uploadEvidence(reportPath, {
  tagName: `compliance-${framework}-${date}-${prNumber}`,
  prNumber,
  framework,
});
```

### 3. Include Context in Comments
```typescript
await commenter.postComment({
  prNumber,
  status: {
    ...complianceStatus,
    scanDuration, // Show how long it took
    timestamp: new Date(), // When it ran
    reportUrl, // Where to find details
  },
  includeDetails: true, // Show failures
  collapseDetails: true, // Keep it clean
});
```

### 4. Handle Errors Gracefully
```typescript
try {
  await commenter.postComment(/* ... */);
} catch (error) {
  // Don't fail the entire workflow if comment fails
  console.error('Failed to post comment:', error.message);
  // But still fail on critical errors
  if (error.statusCode === 401) {
    throw error; // Invalid token
  }
}
```

## 🔧 Troubleshooting

### Issue: "Access denied" errors

**Solution**: Update workflow permissions:
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

### Issue: Rate limit exceeded

**Solution**: Reduce API calls or wait for reset:
- Use `getRateLimit()` to check before expensive operations
- Batch operations when possible
- Cache results to avoid duplicate calls

### Issue: Asset already exists

**Behavior**: Automatically returns existing asset URL (no error)

### Issue: Release creation fails

**Cause**: Tag already exists but is not a release

**Solution**: Use unique tag names with timestamps

## 📚 API Reference

See TypeScript interfaces in source files for complete API documentation:
- `api-client.ts` - GitHubClient class
- `pr-commenter.ts` - PRCommenter class, ComplianceStatus interface
- `artifact-store.ts` - ArtifactStore class, UploadResult interface

---

**Built for Compliance Autopilot** - Enterprise-grade compliance automation for GitHub
