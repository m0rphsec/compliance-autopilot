# 🔧 Troubleshooting Guide

This guide covers common issues and solutions for Compliance Autopilot.

## Table of Contents

1. [Action Fails with 403 Forbidden](#1-action-fails-with-403-forbidden)
2. [Claude API Timeout](#2-claude-api-timeout)
3. [Out of Memory Error](#3-out-of-memory-error)
4. [Rate Limit Exceeded](#4-rate-limit-exceeded)
5. [PDF Report Not Generated](#5-pdf-report-not-generated)
6. [Missing PR Comments](#6-missing-pr-comments)
7. [Invalid API Key](#7-invalid-api-key)
8. [Slow Performance](#8-slow-performance)
9. [Missing Evidence](#9-missing-evidence)
10. [Slack Webhook Failures](#10-slack-webhook-failures)

---

## 1. Action Fails with 403 Forbidden

### Symptoms
```
Error: Resource not accessible by integration
HttpError: Resource not accessible by integration
Status: 403
```

### Cause
GitHub token lacks required permissions.

### Solution A: Add Permissions to Workflow

```yaml
jobs:
  compliance:
    runs-on: ubuntu-latest
    permissions:
      contents: read        # Read repository files
      pull-requests: write  # Post PR comments
      actions: write        # Upload artifacts

    steps:
      - uses: actions/checkout@v4
      - uses: yourusername/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Solution B: Use Personal Access Token (PAT)

1. Create a PAT with these scopes:
   - `repo` (full control)
   - `workflow` (update workflows)

2. Add to repository secrets as `PAT_TOKEN`

3. Use in workflow:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    github-token: ${{ secrets.PAT_TOKEN }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Solution C: Check Branch Protection Rules

If branch protection requires reviews, ensure the token has admin rights or disable protection temporarily.

---

## 2. Claude API Timeout

### Symptoms
```
Error: Request timeout after 30000ms
AnthropicError: Request timed out
```

### Cause
- Large repository with many files
- Slow Anthropic API response
- Network connectivity issues

### Solution A: Increase Timeout

Add timeout configuration:
```yaml
- uses: yourusername/compliance-autopilot@v1
  timeout-minutes: 30  # Default is 15
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Solution B: Reduce Analysis Scope

Only analyze changed files:
```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v41

- name: Run compliance on changed files only
  uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    analyze-only: ${{ steps.changed-files.outputs.all_changed_files }}
```

### Solution C: Enable Caching

Add caching to speed up subsequent runs:
```yaml
- name: Cache compliance data
  uses: actions/cache@v4
  with:
    path: ~/.compliance-cache
    key: compliance-${{ hashFiles('**/*.ts') }}

- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    enable-cache: true
```

### Solution D: Use Different Claude Model

Switch to Claude Haiku for faster (but less accurate) analysis:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude-model: 'claude-3-haiku-20240307'  # Faster, cheaper
```

---

## 3. Out of Memory Error

### Symptoms
```
Error: JavaScript heap out of memory
FATAL ERROR: Reached heap limit Allocation failed
```

### Cause
- Analyzing very large files
- Too many files in parallel
- Memory leak

### Solution A: Increase Node.js Memory

```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
  env:
    NODE_OPTIONS: --max-old-space-size=4096  # 4GB
```

### Solution B: Process Files in Batches

```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    batch-size: 10  # Process 10 files at a time
```

### Solution C: Exclude Large Files

Add `.complianceignore` file:
```
# Ignore large files
dist/**
node_modules/**
*.min.js
*.bundle.js
coverage/**
.next/**
```

### Solution D: Use Streaming Mode

```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    streaming: true  # Process files as streams
```

---

## 4. Rate Limit Exceeded

### Symptoms
```
Error: API rate limit exceeded
GitHub API: 403 - You have exceeded a secondary rate limit
Anthropic API: 429 - Rate limit reached
```

### Cause
- Too many API calls in short time
- Multiple workflows running simultaneously
- Shared rate limit with other apps

### Solution A: GitHub Rate Limit

Wait and retry automatically:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    retry-on-rate-limit: true
    max-retries: 5
```

### Solution B: Reduce Concurrent Requests

```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    max-concurrent-requests: 3  # Default is 10
```

### Solution C: Schedule Scans

Spread out scans to avoid rate limits:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours instead of every hour
```

### Solution D: Use GitHub App Token

GitHub Apps have higher rate limits (5000 req/hr vs 1000 req/hr):

1. Create a GitHub App
2. Install on your repository
3. Use app token:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    github-token: ${{ steps.generate-token.outputs.token }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## 5. PDF Report Not Generated

### Symptoms
```
Error: Failed to generate PDF report
PDF file not found at expected path
```

### Cause
- pdf-lib error
- Invalid data format
- File system permissions

### Solution A: Check Logs

Enable debug logging:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
  env:
    RUNNER_DEBUG: 1
```

### Solution B: Generate JSON Only

If PDF fails, use JSON format:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    report-format: 'json'
```

### Solution C: Check File System Permissions

Ensure write permissions:
```yaml
- name: Create reports directory
  run: mkdir -p reports && chmod 777 reports

- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    output-dir: reports
```

### Solution D: Update pdf-lib

If using custom build, update dependencies:
```bash
npm update pdf-lib
npm run build
```

---

## 6. Missing PR Comments

### Symptoms
- Action completes successfully
- No comment appears on PR

### Cause
- Missing `pull-requests: write` permission
- Not running in PR context
- Comment size exceeds GitHub limit

### Solution A: Add Permissions

```yaml
permissions:
  pull-requests: write
```

### Solution B: Check PR Context

Ensure running on PR event:
```yaml
- uses: yourusername/compliance-autopilot@v1
  if: github.event_name == 'pull_request'
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Solution C: Reduce Comment Size

If comment is too large (>65536 chars), it will fail silently:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    comment-max-length: 60000
    comment-format: 'summary'  # Use summary instead of detailed
```

### Solution D: Post as Separate File

Instead of comment, link to artifact:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    skip-pr-comment: true

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: compliance-report
    path: compliance-report.pdf

- name: Post link
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '📄 Compliance report generated. [Download here](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})'
      });
```

---

## 7. Invalid API Key

### Symptoms
```
Error: Invalid API key provided
AnthropicError: Authentication failed
```

### Cause
- API key not set
- Wrong secret name
- API key expired

### Solution A: Verify Secret Name

Ensure secret is named correctly:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}  # Must match secret name
```

### Solution B: Check Secret Value

1. Go to repository Settings → Secrets → Actions
2. Verify `ANTHROPIC_API_KEY` exists
3. Update if expired

### Solution C: Test API Key

Test key manually:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Solution D: Regenerate Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Delete old key
3. Create new key
4. Update GitHub secret

---

## 8. Slow Performance

### Symptoms
- Action takes >5 minutes for small repos
- Exceeds timeout

### Cause
- Analyzing unnecessary files
- No caching
- Sequential processing

### Solution A: Enable Parallel Processing

```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    parallel: true
    max-workers: 5
```

### Solution B: Add File Exclusions

Create `.complianceignore`:
```
node_modules/
dist/
build/
coverage/
.git/
*.test.ts
*.spec.ts
```

### Solution C: Use Incremental Analysis

Only analyze changed files:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    incremental: true
    base-ref: ${{ github.base_ref }}
```

### Solution D: Profile Performance

Enable profiling:
```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    profile: true
  env:
    RUNNER_DEBUG: 1
```

Check logs for bottlenecks:
```
Performance Report:
  GitHub API calls: 45 (2.3s)
  Claude API calls: 12 (38.5s) <- BOTTLENECK
  PDF generation: 1 (1.2s)
  Total: 42.0s
```

---

## 9. Missing Evidence

### Symptoms
- Controls marked as "NO_EVIDENCE"
- Incomplete reports
- Missing sections

### Cause
- Insufficient GitHub permissions
- Missing files/configurations
- API errors

### Solution A: Check Permissions

Ensure token can access required data:
```yaml
permissions:
  contents: read
  pull-requests: read
  deployments: read
  issues: read
```

### Solution B: Verify Repository Setup

Ensure required files exist:
- `.github/CODEOWNERS` (for SOC2 CC6.6)
- `SECURITY.md` (for ISO27001)
- `.github/workflows/` (for SOC2 CC6.1)

### Solution C: Enable Full History

Some checks require full Git history:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Full history
```

### Solution D: Check API Errors

Look for failed API calls in logs:
```
[DEBUG] GitHub API call failed: GET /repos/owner/repo/deployments
[WARN] Skipping CC6.1 - no deployment data available
```

---

## 10. Slack Webhook Failures

### Symptoms
```
Error: Slack webhook returned 400 Bad Request
Failed to send Slack notification
```

### Cause
- Invalid webhook URL
- Webhook expired
- Message too large

### Solution A: Verify Webhook URL

Test webhook manually:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Solution B: Regenerate Webhook

1. Go to Slack App settings
2. Regenerate webhook
3. Update GitHub secret

### Solution C: Reduce Message Size

```yaml
- uses: yourusername/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
    slack-message-format: 'compact'  # Shorter messages
```

### Solution D: Use Blocks API

For rich formatting:
```yaml
- uses: slackapi/slack-github-action@v1.25.0
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Compliance Check",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Status: ${{ steps.compliance.outputs.compliance-status }}"
            }
          }
        ]
      }
```

---

## General Debugging Tips

### Enable Debug Logging

```yaml
env:
  RUNNER_DEBUG: 1
  ACTIONS_STEP_DEBUG: true
```

### Check Action Logs

1. Go to Actions tab
2. Click on failed run
3. Expand failed step
4. Look for ERROR/WARN messages

### Validate Inputs

Add validation step:
```yaml
- name: Validate Inputs
  run: |
    echo "Checking API key..."
    if [ -z "${{ secrets.ANTHROPIC_API_KEY }}" ]; then
      echo "ERROR: ANTHROPIC_API_KEY not set"
      exit 1
    fi

    echo "Checking frameworks..."
    if [[ ! "${{ inputs.frameworks }}" =~ ^(soc2|gdpr|iso27001)(,(soc2|gdpr|iso27001))*$ ]]; then
      echo "ERROR: Invalid frameworks"
      exit 1
    fi
```

### Test Locally

Run action locally with [act](https://github.com/nektos/act):
```bash
act pull_request -s ANTHROPIC_API_KEY=sk-ant-xxx
```

### Check Action Version

Ensure using latest version:
```yaml
- uses: yourusername/compliance-autopilot@v1  # Use @v1, not @main
```

---

## Getting Help

If you're still stuck:

1. **Search Issues**: [GitHub Issues](https://github.com/yourusername/compliance-autopilot/issues)
2. **Join Discord**: [Community Chat](https://discord.gg/compliance-autopilot)
3. **Email Support**: support@compliance-autopilot.com
4. **Stack Overflow**: Tag with `compliance-autopilot`

When reporting issues, include:
- Full error message
- Workflow file
- Action version
- Repository size and structure
- Debug logs (with secrets redacted)

---

**Last Updated:** 2026-02-02
