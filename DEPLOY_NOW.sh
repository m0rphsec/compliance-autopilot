#!/bin/bash

# Compliance Autopilot - One-Command Deploy Script
# Run this to deploy to GitHub in one command

set -e

echo "🚀 Compliance Autopilot - Deployment Script"
echo "==========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "   Install: https://cli.github.com/"
    echo ""
    echo "Alternative: Use manual deployment (see DEPLOYMENT_GUIDE.md)"
    exit 1
fi

# Navigate to project directory
cd /home/chris/projects/compliance-autopilot

echo "✅ In project directory"

# Check if already has git remote
if git remote get-url origin &> /dev/null; then
    echo "⚠️  Git remote 'origin' already exists"
    echo "   Repository may already be deployed"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    # Create GitHub repository
    echo "📦 Creating GitHub repository..."
    gh repo create compliance-autopilot \
        --public \
        --source=. \
        --remote=origin \
        --description="Automate SOC2, GDPR, and ISO27001 compliance evidence collection"
    
    echo "✅ Repository created"
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Initial release: Compliance Autopilot v1.0.0

Features:
- SOC2, GDPR, ISO27001 compliance automation
- PDF and JSON evidence reports
- PR comment integration
- Claude-powered code analysis
- Comprehensive documentation

Ready for GitHub Marketplace." || echo "Files already committed"

# Push to main
echo "🚀 Pushing to GitHub..."
git push -u origin main

# Create release tag
echo "🏷️  Creating release tag..."
git tag -a v1.0.0 -m "Release v1.0.0 - Production Ready" || echo "Tag already exists"
git push origin v1.0.0 || echo "Tag already pushed"

# Add topics to repository
echo "🏷️  Adding repository topics..."
gh repo edit m0rphsec/compliance-autopilot \
    --add-topic compliance \
    --add-topic soc2 \
    --add-topic gdpr \
    --add-topic github-actions \
    --add-topic automation \
    --add-topic security \
    --add-topic audit

echo ""
echo "==========================================="
echo "✅ Deployment Complete!"
echo "==========================================="
echo ""
echo "📍 Your repository: https://github.com/m0rphsec/compliance-autopilot"
echo ""
echo "📋 Next steps:"
echo "   1. Visit: https://github.com/m0rphsec/compliance-autopilot/settings"
echo "   2. Scroll to 'GitHub Actions'"
echo "   3. Check ✅ 'Publish this Action to the GitHub Marketplace'"
echo "   4. Fill in the form:"
echo "      - Primary Category: Security"
echo "      - Tags: compliance, soc2, gdpr, audit"
echo "      - Icon: shield (built-in)"
echo "   5. Click 'Publish'"
echo ""
echo "🎉 Your action will be reviewed by GitHub (1-2 days)"
echo "💰 Start generating revenue!"
echo ""
