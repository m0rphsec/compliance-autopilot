# 📘 Usage Examples

This guide provides real-world workflow examples for Compliance Autopilot.

## Table of Contents

1. [Basic SOC2 on Pull Requests](#1-basic-soc2-on-pull-requests)
2. [GDPR + SOC2 on Push](#2-gdpr--soc2-on-push)
3. [All Frameworks on Schedule](#3-all-frameworks-on-schedule)
4. [Slack Alerts on Failures](#4-slack-alerts-on-failures)
5. [Custom Controls (Advanced)](#5-custom-controls-advanced)

---

## 1. Basic SOC2 on Pull Requests

**Use Case:** Automatically check SOC2 compliance on every PR

**File:** `.github/workflows/soc2-pr-check.yml`

```yaml
name: SOC2 Compliance Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  soc2-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for accurate analysis

      - name: Run SOC2 Compliance Check
        uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2'
          report-format: 'both'
          fail-on-violations: 'false'  # Don't block PRs

      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: compliance-reports
          path: |
            compliance-report.pdf
            compliance-report.json
```

**Features:**
- ✅ Runs on every PR
- ✅ Posts results as PR comment
- ✅ Uploads PDF and JSON reports
- ✅ Doesn't block PR merges (fail-on-violations: false)
- ✅ Full Git history for accurate analysis

---

## 2. GDPR + SOC2 on Push

**Use Case:** Check both GDPR and SOC2 when code is pushed to main

**File:** `.github/workflows/compliance-push.yml`

```yaml
name: Compliance Check on Push

on:
  push:
    branches:
      - main
      - develop

jobs:
  compliance:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      actions: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run GDPR + SOC2 Check
        id: compliance
        uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2,gdpr'
          report-format: 'both'
          fail-on-violations: 'true'  # Block if violations found

      - name: Create Release with Evidence
        if: success()
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: compliance-${{ github.sha }}
          release_name: Compliance Evidence - ${{ github.sha }}
          body: |
            Compliance check passed for commit ${{ github.sha }}

            **Status:** ${{ steps.compliance.outputs.compliance-status }}
            **Controls Passed:** ${{ steps.compliance.outputs.controls-passed }}/${{ steps.compliance.outputs.controls-total }}

            [View Report](${{ steps.compliance.outputs.report-url }})
          draft: false
          prerelease: false
```

**Features:**
- ✅ Runs on push to main/develop
- ✅ Checks both GDPR and SOC2
- ✅ Blocks merge if violations found
- ✅ Creates GitHub release with evidence
- ✅ Immutable audit trail

---

## 3. All Frameworks on Schedule

**Use Case:** Daily compliance scan covering all frameworks

**File:** `.github/workflows/daily-compliance.yml`

```yaml
name: Daily Compliance Scan

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  full-compliance-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      actions: write
      issues: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Full Compliance Scan
        id: scan
        uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2,gdpr,iso27001'
          report-format: 'both'
          fail-on-violations: 'false'

      - name: Create Issue if Failures
        if: steps.scan.outputs.compliance-status == 'FAIL'
        uses: actions/github-script@v7
        with:
          script: |
            const passed = '${{ steps.scan.outputs.controls-passed }}';
            const total = '${{ steps.scan.outputs.controls-total }}';
            const reportUrl = '${{ steps.scan.outputs.report-url }}';

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '⚠️ Daily Compliance Scan Failed',
              body: `## Compliance Scan Results

              **Status:** ❌ FAIL
              **Controls Passed:** ${passed}/${total}
              **Scan Date:** ${new Date().toISOString().split('T')[0]}

              ### Action Required

              The daily compliance scan has detected violations. Please review the report and address the issues.

              [📄 View Full Report](${reportUrl})

              ### Next Steps

              1. Review failed controls
              2. Implement fixes
              3. Re-run scan to verify

              ---
              *Automated by Compliance Autopilot*`,
              labels: ['compliance', 'security']
            });

      - name: Send Email Notification
        if: steps.scan.outputs.compliance-status == 'FAIL'
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: '[URGENT] Daily Compliance Scan Failed'
          to: compliance@yourcompany.com
          from: github-actions@yourcompany.com
          body: |
            Daily compliance scan failed.
            Controls passed: ${{ steps.compliance.outputs.controls-passed }}/${{ steps.compliance.outputs.controls-total }}

            View report: ${{ steps.compliance.outputs.report-url }}
```

**Features:**
- ✅ Runs daily at 9 AM UTC
- ✅ Checks all three frameworks
- ✅ Creates GitHub issue if failures detected
- ✅ Sends email notification
- ✅ Can be manually triggered

---

## 4. Slack Alerts on Failures

**Use Case:** Send Slack notifications when compliance issues are found

**File:** `.github/workflows/compliance-slack.yml`

```yaml
name: Compliance with Slack Alerts

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
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Compliance Check with Slack
        id: compliance
        uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2,gdpr'
          report-format: 'both'
          fail-on-violations: 'false'
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}

      - name: Custom Slack Message
        if: steps.compliance.outputs.compliance-status == 'FAIL'
        uses: slackapi/slack-github-action@v1.25.0
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "🚨 Compliance Check Failed",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "⚠️ Compliance Violations Detected"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Repository:*\n${{ github.repository }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Branch:*\n${{ github.ref_name }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Controls Passed:*\n${{ steps.compliance.outputs.controls-passed }}/${{ steps.compliance.outputs.controls-total }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Status:*\n❌ FAIL"
                    }
                  ]
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "View the full report and evidence at the link below:"
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "View Report"
                      },
                      "url": "${{ steps.compliance.outputs.report-url }}",
                      "style": "danger"
                    }
                  ]
                }
              ]
            }
```

**Setup Slack Webhook:**

1. Go to your Slack workspace → Apps → Incoming Webhooks
2. Create a new webhook for #compliance channel
3. Copy the webhook URL
4. Add to GitHub Secrets as `SLACK_WEBHOOK`

**Features:**
- ✅ Built-in Slack integration in action
- ✅ Custom rich Slack messages
- ✅ Links to compliance reports
- ✅ Visual status indicators

---

## 5. Custom Controls (Advanced)

**Use Case:** Add custom compliance controls specific to your organization

**File:** `.github/workflows/custom-compliance.yml`

```yaml
name: Custom Compliance Controls

on:
  pull_request:
  push:
    branches: [main]

jobs:
  compliance:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Standard Compliance
        id: standard
        uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2,gdpr'
          report-format: 'json'

      - name: Custom Control - License Headers
        id: license-check
        run: |
          echo "Checking for license headers in all source files..."
          missing=$(find src -name "*.ts" -type f -exec grep -L "Copyright (c) 2026" {} \;)
          if [ -n "$missing" ]; then
            echo "status=FAIL" >> $GITHUB_OUTPUT
            echo "missing<<EOF" >> $GITHUB_OUTPUT
            echo "$missing" >> $GITHUB_OUTPUT
            echo "EOF" >> $GITHUB_OUTPUT
          else
            echo "status=PASS" >> $GITHUB_OUTPUT
          fi

      - name: Custom Control - Required Dependencies
        id: deps-check
        run: |
          echo "Checking for security dependencies..."
          if ! grep -q "@anthropic-ai/sdk" package.json; then
            echo "status=FAIL" >> $GITHUB_OUTPUT
            echo "reason=Missing Anthropic SDK" >> $GITHUB_OUTPUT
          else
            echo "status=PASS" >> $GITHUB_OUTPUT
          fi

      - name: Custom Control - Environment Variables
        id: env-check
        run: |
          echo "Checking for required environment variables in docs..."
          if ! grep -q "ANTHROPIC_API_KEY" README.md; then
            echo "status=FAIL" >> $GITHUB_OUTPUT
            echo "reason=API key not documented" >> $GITHUB_OUTPUT
          else
            echo "status=PASS" >> $GITHUB_OUTPUT
          fi

      - name: Aggregate Custom Controls
        id: custom
        run: |
          # Count passed/failed custom controls
          passed=0
          failed=0

          [ "${{ steps.license-check.outputs.status }}" == "PASS" ] && ((passed++)) || ((failed++))
          [ "${{ steps.deps-check.outputs.status }}" == "PASS" ] && ((passed++)) || ((failed++))
          [ "${{ steps.env-check.outputs.status }}" == "PASS" ] && ((passed++)) || ((failed++))

          echo "passed=$passed" >> $GITHUB_OUTPUT
          echo "failed=$failed" >> $GITHUB_OUTPUT
          echo "total=$((passed + failed))" >> $GITHUB_OUTPUT

          if [ $failed -gt 0 ]; then
            echo "status=FAIL" >> $GITHUB_OUTPUT
          else
            echo "status=PASS" >> $GITHUB_OUTPUT
          fi

      - name: Post Combined Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const standardPassed = '${{ steps.standard.outputs.controls-passed }}';
            const standardTotal = '${{ steps.standard.outputs.controls-total }}';
            const customPassed = '${{ steps.custom.outputs.passed }}';
            const customTotal = '${{ steps.custom.outputs.total }}';

            const totalPassed = parseInt(standardPassed) + parseInt(customPassed);
            const totalControls = parseInt(standardTotal) + parseInt(customTotal);
            const overallStatus = '${{ steps.standard.outputs.compliance-status }}' === 'PASS' &&
                                  '${{ steps.custom.outputs.status }}' === 'PASS' ? '✅ PASS' : '❌ FAIL';

            const body = `## 🔒 Compliance Check Results

            **Overall Status:** ${overallStatus}
            **Total Controls:** ${totalPassed}/${totalControls} passed

            ### Standard Frameworks

            - **SOC2 + GDPR:** ${standardPassed}/${standardTotal} controls passed

            ### Custom Controls

            - **License Headers:** ${{ steps.license-check.outputs.status }}
            - **Required Dependencies:** ${{ steps.deps-check.outputs.status }}
            - **Environment Variables:** ${{ steps.env-check.outputs.status }}

            **Custom Total:** ${customPassed}/${customTotal} passed

            ---

            [📄 View Full Report](${{ steps.standard.outputs.report-url }})
            `;

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: body
            });
```

**Features:**
- ✅ Combines standard and custom controls
- ✅ Organization-specific requirements
- ✅ License header enforcement
- ✅ Dependency verification
- ✅ Documentation checks
- ✅ Aggregated reporting

---

## Common Patterns

### Only Run on Specific Paths

```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'config/**'
      - '.github/**'
```

### Run Different Checks by Branch

```yaml
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Basic Check for Feature Branches
        if: github.ref != 'refs/heads/main'
        uses: m0rphsec/compliance-autopilot@v1
        with:
          frameworks: 'soc2'

      - name: Run Full Check for Main
        if: github.ref == 'refs/heads/main'
        uses: m0rphsec/compliance-autopilot@v1
        with:
          frameworks: 'soc2,gdpr,iso27001'
```

### Conditional Slack Alerts

```yaml
- name: Send Slack Alert
  if: |
    steps.compliance.outputs.compliance-status == 'FAIL' &&
    github.ref == 'refs/heads/main'
  uses: m0rphsec/compliance-autopilot@v1
  with:
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

### Save Reports as Artifacts

```yaml
- name: Upload Reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: compliance-reports-${{ github.sha }}
    path: |
      compliance-report.pdf
      compliance-report.json
    retention-days: 90
```

---

## Troubleshooting Examples

### Debug Mode

```yaml
- name: Run with Debug Logging
  uses: m0rphsec/compliance-autopilot@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    frameworks: 'soc2'
  env:
    RUNNER_DEBUG: 1
```

### Timeout Configuration

```yaml
- name: Run with Extended Timeout
  uses: m0rphsec/compliance-autopilot@v1
  timeout-minutes: 30  # Default is 15
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Manual Trigger with Inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      frameworks:
        description: 'Frameworks to check'
        required: true
        default: 'soc2'
        type: choice
        options:
          - soc2
          - gdpr
          - iso27001
          - soc2,gdpr
          - soc2,gdpr,iso27001
      fail_on_violations:
        description: 'Fail on violations'
        type: boolean
        default: false

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: m0rphsec/compliance-autopilot@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: ${{ inputs.frameworks }}
          fail-on-violations: ${{ inputs.fail_on_violations }}
```

---

## Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [CONTROLS.md](./CONTROLS.md) - Complete control mappings

For more examples, see the [demo repository](https://github.com/m0rphsec/compliance-autopilot-demo).
