# Evidence Dashboard Screenshot

**File Required:** `evidence-dashboard.png`

## Specifications
- **Dimensions:** 1600x1000 pixels
- **Format:** PNG
- **Content:** Compliance evidence tracking interface (future feature)

## Screenshot Content

### Dashboard Layout Concept
```
┌──────────────────────────────────────────────────────────────┐
│ Compliance Autopilot • Evidence Dashboard                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 📊 Compliance Overview                    🔄 Last scan: 5m  │
│                                                               │
│ ┌───────────────┬───────────────┬───────────────┐          │
│ │ CIS AWS       │ CIS K8s       │ NIST 800-53   │          │
│ │ 89% ✅        │ 92% ✅        │ 78% ⚠️        │          │
│ │ 12/14 checks  │ 11/12 checks  │ 28/36 checks  │          │
│ └───────────────┴───────────────┴───────────────┘          │
│                                                               │
│ 📋 Recent Violations                                         │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Date       │ Severity │ Finding           │ Status   │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ 2024-01-15 │ MEDIUM   │ CloudTrail log    │ Open ⚠️ │    │
│ │ 2024-01-14 │ LOW      │ Pod Security      │ Fixed ✅ │    │
│ │ 2024-01-12 │ HIGH     │ S3 encryption     │ Fixed ✅ │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                               │
│ 📈 Compliance Trend (Last 30 Days)                          │
│ ┌──────────────────────────────────────────────────────┐    │
│ │  100% ┤                                              │    │
│ │   90% ┤     ╭──────────────────╮                    │    │
│ │   80% ┤  ╭──╯                  ╰─────               │    │
│ │   70% ┤──╯                                           │    │
│ │       └────────────────────────────────────────      │    │
│ │        Jan 1      Jan 15      Jan 30                │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                               │
│ 🔍 Evidence Trail                                            │
│ • 156 automated scans performed                              │
│ • 1,247 checks executed                                      │
│ • 42 compliance reports generated                            │
│ • 8 violations remediated                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Purpose
This dashboard represents a potential future feature showing:
- Aggregate compliance metrics across frameworks
- Historical trend analysis
- Evidence of continuous compliance monitoring
- Audit trail for compliance activities

## Design Requirements
- Clean, professional dashboard UI
- Charts and visualizations for metrics
- Timeline of compliance activities
- Filterable evidence logs
- Export functionality indicators

## Alternative Approaches
If full dashboard isn't built yet, show:
1. **Artifacts page** with multiple PDF reports
2. **Pull requests list** showing compliance checks
3. **Actions history** with multiple successful runs
4. **Simple table** mockup showing evidence structure

## TODO
- [ ] Decide on dashboard implementation approach
- [ ] Create mockup or capture actual dashboard
- [ ] Ensure professional appearance
- [ ] Highlight key compliance metrics
- [ ] Save as `evidence-dashboard.png`

## Note
This is an optional/future feature. Can be replaced with:
- Screenshot of GitHub Actions artifacts showing report history
- Multiple PR comments showing compliance tracking over time
- Simple HTML/Markdown table showing evidence log
