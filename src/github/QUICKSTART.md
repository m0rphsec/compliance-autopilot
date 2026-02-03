# GitHub Integration - Quick Start Guide

Get started with the GitHub integration modules in under 5 minutes.

## 🚀 Installation

```bash
npm install @octokit/rest @octokit/plugin-throttling @octokit/plugin-retry
```

## 📋 Basic Usage

### 1. Check PR Compliance

```typescript
import { createGitHubClient } from './github/api-client';

async function checkPRCompliance(prNumber: number) {
  const client = createGitHubClient({
    token: process.env.GITHUB_TOKEN!,
    owner: 'myorg',
    repo: 'myrepo',
  });

  // Get PR reviews
  const reviews = await client.getPRReviews(prNumber);
  const approved = reviews.filter(r => r.state === 'APPROVED');

  console.log(`✅ PR #${prNumber} has ${approved.length} approvals`);

  // Check deployments
  const deployments = await client.getDeployments(10);
  console.log(`📦 ${deployments.length} recent deployments`);

  return {
    hasApprovals: approved.length > 0,
    hasDeployments: deployments.length > 0,
  };
}
```

### 2. Post PR Comment

```typescript
import { createPRCommenter } from './github/pr-commenter';

async function postComplianceStatus(prNumber: number) {
  const commenter = createPRCommenter(
    process.env.GITHUB_TOKEN!,
    'myorg',
    'myrepo'
  );

  await commenter.postComment({
    prNumber,
    owner: 'myorg',
    repo: 'myrepo',
    status: {
      status: 'PASS',
      frameworks: ['SOC2'],
      controlsPassed: 58,
      controlsTotal: 64,
      summary: [
        {
          control: 'CC1.1',
          status: 'PASS',
          description: 'Code review process',
        },
        {
          control: 'CC6.1',
          status: 'FAIL',
          description: 'Deployment controls',
          details: 'No CI/CD workflow detected',
        },
      ],
      timestamp: new Date(),
    },
  });

  console.log('✅ Posted compliance status to PR');
}
```

### 3. Upload Evidence

```typescript
import { createArtifactStore } from './github/artifact-store';

async function uploadEvidenceReport(reportPath: string, prNumber: number) {
  const store = createArtifactStore(
    process.env.GITHUB_TOKEN!,
    'myorg',
    'myrepo'
  );

  const result = await store.uploadEvidence(reportPath, {
    prNumber,
    framework: 'soc2',
    commitSha: process.env.GITHUB_SHA,
  });

  console.log('✅ Evidence uploaded');
  console.log('📊 Download URL:', result.downloadUrl);
  console.log('🔒 SHA-256:', result.artifact.sha256);

  return result.downloadUrl;
}
```

## 🔄 Complete Workflow

```typescript
import {
  createGitHubClient,
  createPRCommenter,
  createArtifactStore,
} from './github';

async function runComplianceCheck(prNumber: number) {
  const token = process.env.GITHUB_TOKEN!;
  const owner = 'myorg';
  const repo = 'myrepo';

  // 1. Collect evidence
  const client = createGitHubClient({ token, owner, repo });
  const reviews = await client.getPRReviews(prNumber);
  const deployments = await client.getDeployments();

  // 2. Analyze compliance
  const complianceStatus = {
    status: reviews.length > 0 ? 'PASS' : 'FAIL' as const,
    frameworks: ['SOC2'],
    controlsPassed: reviews.length > 0 ? 64 : 63,
    controlsTotal: 64,
    summary: [
      {
        control: 'CC1.1',
        status: reviews.length > 0 ? 'PASS' : 'FAIL' as const,
        description: 'Code review process',
      },
    ],
    timestamp: new Date(),
  };

  // 3. Generate report (your logic)
  const reportPath = './compliance-report.pdf';

  // 4. Upload evidence
  const store = createArtifactStore(token, owner, repo);
  const uploadResult = await store.uploadEvidence(reportPath, {
    prNumber,
    framework: 'soc2',
  });

  // 5. Post PR comment
  const commenter = createPRCommenter(token, owner, repo);
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
}
```

## 🛡️ Error Handling

```typescript
import { RateLimitError, PermissionError, GitHubAPIError } from './github/api-client';

async function safeComplianceCheck(prNumber: number) {
  try {
    const client = createGitHubClient({
      token: process.env.GITHUB_TOKEN!,
      owner: 'myorg',
      repo: 'myrepo',
    });

    const reviews = await client.getPRReviews(prNumber);
    return reviews;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error(`Rate limited. Resets at: ${error.resetAt}`);
      // Wait or retry later
    } else if (error instanceof PermissionError) {
      console.error(`Missing permissions: ${error.requiredScopes}`);
      console.error(error.message); // Includes fix instructions
    } else if (error instanceof GitHubAPIError) {
      console.error(`GitHub API error: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

## 🔑 Environment Setup

```bash
# .env file
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_REPOSITORY=myorg/myrepo
GITHUB_SHA=abc123def456
```

```yaml
# GitHub Actions workflow
permissions:
  contents: write
  pull-requests: write
  issues: write

env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📚 Next Steps

1. Read the [full README](./README.md) for detailed documentation
2. Check [test examples](../../tests/unit/github/) for more usage patterns
3. Review [error handling guide](./README.md#-troubleshooting) for common issues

---

**Ready to automate compliance? Start building!** 🚀
