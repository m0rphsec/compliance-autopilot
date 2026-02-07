#!/bin/bash

# GitHub API Integration Test Runner
# Runs GitHub integration tests with proper setup and cleanup

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
OWNER="m0rphsec"
REPO="compliance-autopilot"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   GitHub API Integration Test Runner${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Function to print section headers
print_section() {
  echo ""
  echo -e "${BLUE}▶ $1${NC}"
  echo -e "${BLUE}────────────────────────────────────────────────────────${NC}"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print warning messages
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_section "Checking Prerequisites"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  print_error "GitHub CLI (gh) is not installed"
  echo "Install from: https://cli.github.com/"
  exit 1
fi
print_success "GitHub CLI installed"

# Check if authenticated
if ! gh auth status &> /dev/null; then
  print_error "Not authenticated with GitHub CLI"
  echo "Run: gh auth login"
  exit 1
fi

# Get current user
CURRENT_USER=$(gh api user --jq '.login')
print_success "Authenticated as: $CURRENT_USER"

# Verify it's the correct user
if [ "$CURRENT_USER" != "$OWNER" ]; then
  print_warning "Authenticated as $CURRENT_USER, expected $OWNER"
  echo "Tests will continue but may fail if you don't have access to the repository"
fi

# Check repository access
print_section "Verifying Repository Access"

if ! gh repo view "$OWNER/$REPO" &> /dev/null; then
  print_error "Cannot access repository: $OWNER/$REPO"
  exit 1
fi
print_success "Repository accessible: $OWNER/$REPO"

# Get repository info
REPO_INFO=$(gh repo view "$OWNER/$REPO" --json name,owner,defaultBranchRef,visibility,hasIssuesEnabled)
echo "Repository: $(echo $REPO_INFO | jq -r '.name')"
echo "Visibility: $(echo $REPO_INFO | jq -r '.visibility')"
echo "Default branch: $(echo $REPO_INFO | jq -r '.defaultBranchRef.name')"

# Check rate limit
print_section "Checking Rate Limit"

RATE_LIMIT=$(gh api rate_limit)
CORE_REMAINING=$(echo $RATE_LIMIT | jq -r '.resources.core.remaining')
CORE_LIMIT=$(echo $RATE_LIMIT | jq -r '.resources.core.limit')

echo "Core API: $CORE_REMAINING/$CORE_LIMIT"

if [ "$CORE_REMAINING" -lt 100 ]; then
  print_warning "Low rate limit: $CORE_REMAINING requests remaining"
  RESET_TIME=$(echo $RATE_LIMIT | jq -r '.resources.core.reset')
  RESET_DATE=$(date -d "@$RESET_TIME" 2>/dev/null || date -r "$RESET_TIME" 2>/dev/null)
  echo "Resets at: $RESET_DATE"
else
  print_success "Rate limit OK: $CORE_REMAINING requests remaining"
fi

# Check for required packages
print_section "Checking Dependencies"

if [ ! -d "node_modules" ]; then
  print_warning "node_modules not found, installing dependencies..."
  npm install
fi

if [ ! -f "node_modules/@octokit/rest/package.json" ]; then
  print_error "@octokit/rest not installed"
  echo "Run: npm install"
  exit 1
fi
print_success "Dependencies installed"

# Set environment variables
print_section "Setting Up Environment"

export GITHUB_TOKEN=$(gh auth token)
export TEST_OWNER="$OWNER"
export TEST_REPO="$REPO"

print_success "Environment configured"
echo "GITHUB_TOKEN: ${GITHUB_TOKEN:0:10}..."
echo "TEST_OWNER: $TEST_OWNER"
echo "TEST_REPO: $TEST_REPO"

# Run tests
print_section "Running Tests"

# Run with different test patterns based on argument
TEST_PATTERN="${1:-github-api.integration}"

echo "Test pattern: $TEST_PATTERN"
echo ""

# Run Jest with proper configuration
if npm test -- "$TEST_PATTERN" --verbose --forceExit; then
  print_success "All tests passed!"
  EXIT_CODE=0
else
  print_error "Some tests failed"
  EXIT_CODE=1
fi

# Print final rate limit status
print_section "Final Rate Limit Status"

FINAL_RATE_LIMIT=$(gh api rate_limit)
FINAL_REMAINING=$(echo $FINAL_RATE_LIMIT | jq -r '.resources.core.remaining')
REQUESTS_USED=$((CORE_REMAINING - FINAL_REMAINING))

echo "Requests used: $REQUESTS_USED"
echo "Remaining: $FINAL_REMAINING/$CORE_LIMIT"

# Cleanup reminder
print_section "Cleanup Reminder"

echo "Test resources (PRs, branches, releases) should be automatically cleaned up."
echo "If you see leftover test resources, you can manually clean them:"
echo "  - Test PRs: gh pr list | grep TEST"
echo "  - Test branches: gh api repos/$OWNER/$REPO/branches | jq -r '.[].name' | grep test"
echo "  - Test releases: gh release list | grep test"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}   ✓ Tests Completed Successfully${NC}"
else
  echo -e "${RED}   ✗ Tests Failed${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

exit $EXIT_CODE
