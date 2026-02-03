# ⚡ Quick Start - Deploy in 15 Minutes

**For users who just want to get it live ASAP**

---

## Prerequisites

- GitHub account (`m0rphsec`)
- Git CLI installed
- 15 minutes

---

## Commands to Run (Copy-Paste)

```bash
# Navigate to project
cd /home/chris/projects/compliance-autopilot

# Create GitHub repository
gh repo create compliance-autopilot --public --source=. --remote=origin

# Commit and push
git add .
git commit -m "Initial release: Compliance Autopilot v1.0.0"
git push -u origin main

# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## GitHub Website Steps

1. **Go to repository:** https://github.com/m0rphsec/compliance-autopilot

2. **Enable Marketplace:**
   - Settings → Scroll to "GitHub Actions"
   - Check ✅ "Publish this Action to the GitHub Marketplace"

3. **Fill out form:**
   - Primary Category: `Security`
   - Secondary Category: `Code quality`
   - Description: "Automate SOC2, GDPR, and ISO27001 compliance evidence collection"
   - Tags: `compliance, soc2, gdpr, audit, security, automation`
   - Icon: Use built-in "shield" icon (or skip)
   - Color: `blue`

4. **Submit:** Click "Publish release"

---

## Done! 🎉

Your action will be reviewed by GitHub (1-2 business days).

Once approved, it'll be live at:
`https://github.com/marketplace/actions/compliance-autopilot`

---

## Test It (Optional 5 Minutes)

Create a test repo and add this workflow:

```yaml
name: Test Compliance
on: [push]
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: m0rphsec/compliance-autopilot@v1.0.0
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          frameworks: 'soc2'
```

Add your Anthropic API key to repository secrets and push to test.

---

**See DEPLOYMENT_GUIDE.md for detailed instructions**
