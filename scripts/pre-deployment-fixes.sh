#!/bin/bash
# Pre-Deployment Fixes for Compliance Autopilot
# Run this script before creating the GitHub repository

set -e

echo "🚀 Compliance Autopilot - Pre-Deployment Fixes"
echo "=============================================="
echo ""

# 1. Fix action.yml author
echo "1️⃣ Updating action.yml author field..."
sed -i "s/author: 'YourUsername'/author: 'm0rphsec'/" action.yml
echo "   ✅ Author updated to 'm0rphsec'"
echo ""

# 2. Run lint:fix
echo "2️⃣ Running automatic lint fixes..."
npm run lint:fix || echo "   ⚠️ Some lint errors require manual fixing"
echo ""

# 3. Run audit fix
echo "3️⃣ Fixing security vulnerabilities..."
npm audit fix --force || echo "   ⚠️ Some vulnerabilities may remain"
echo ""

# 4. Rebuild
echo "4️⃣ Rebuilding project..."
npm run build
echo "   ✅ Build successful"
echo ""

# 5. Run package
echo "5️⃣ Creating production bundle..."
npm run package
echo "   ✅ Package created"
echo ""

# 6. Verify bundle
echo "6️⃣ Verifying bundle..."
if [ -f "dist/index.js" ]; then
    SIZE=$(du -h dist/index.js | cut -f1)
    echo "   ✅ Bundle exists: $SIZE"
else
    echo "   ❌ Bundle not found!"
    exit 1
fi
echo ""

# 7. Run typecheck
echo "7️⃣ Running type check..."
npm run typecheck
echo "   ✅ Type check passed"
echo ""

echo "=============================================="
echo "✅ Pre-deployment fixes complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Review remaining lint errors: npm run lint"
echo "  2. Create GitHub repository"
echo "  3. Push code to repository"
echo "  4. Create v1.0.0 release"
echo "  5. Submit to GitHub Marketplace"
echo ""
echo "📄 See docs/FINAL_PRODUCTION_REPORT.md for details"
