# GitHub Actions Workflow Run Screenshot

**File Required:** `workflow-run.png`

## Specifications
- **Dimensions:** 1400x900 pixels
- **Format:** PNG
- **Content:** Actions tab showing successful run

## Screenshot Content

### GitHub Actions Interface
```
┌──────────────────────────────────────────────────────────┐
│ Actions / Compliance Autopilot                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ✅ Compliance Autopilot                                  │
│    #42: Add security configuration                       │
│    main ← feature/security-updates                       │
│    Triggered by pull_request • 2m 34s                    │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Jobs                                                │  │
│ │                                                     │  │
│ │ ✅ compliance-check (1m 12s)                       │  │
│ │   │                                                 │  │
│ │   ├─ ✅ Set up job (3s)                           │  │
│ │   ├─ ✅ Checkout code (5s)                        │  │
│ │   ├─ ✅ Run Compliance Autopilot (52s)            │  │
│ │   │   🔍 Scanning for compliance violations        │  │
│ │   │   📋 Checking CIS AWS Benchmarks               │  │
│ │   │   📋 Checking CIS Kubernetes Benchmarks        │  │
│ │   │   ✅ Found 12 passing checks                   │  │
│ │   │   ⚠️  Found 2 warnings                         │  │
│ │   │   📄 Generating compliance report               │  │
│ │   ├─ ✅ Upload report artifact (4s)               │  │
│ │   └─ ✅ Post results to PR (8s)                   │  │
│ │                                                     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ Artifacts                                                 │
│ 📄 compliance-report.pdf (142 KB) • 90 days             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Capture Guidelines
- Show complete workflow run with all steps
- Include job timing information
- Expand key steps to show logs
- Display artifact upload section
- Use GitHub's default light theme
- Capture full width of workflow details

## Key Elements to Include
1. **Workflow header**
   - Workflow name
   - Run number
   - Trigger event (pull_request)
   - Total duration

2. **Job details**
   - All steps expanded
   - Success/failure icons
   - Step durations
   - Key log messages

3. **Artifacts section**
   - Report file name
   - File size
   - Retention period

4. **Status indicators**
   - Green checkmarks for passed steps
   - Overall success status

## TODO
- [ ] Trigger workflow on test PR
- [ ] Wait for completion
- [ ] Navigate to Actions tab
- [ ] Expand all workflow steps
- [ ] Capture screenshot
- [ ] Save as `workflow-run.png`
