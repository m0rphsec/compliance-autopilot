#!/bin/bash
# Test runner script for Compliance Autopilot
# Runs unit tests, integration tests, and generates coverage reports

set -e

echo "🧪 Compliance Autopilot Test Suite"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo -e "${YELLOW}Checking Node.js version...${NC}"
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 20 ]; then
  echo -e "${RED}Error: Node.js 20+ required${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Run linter first
echo ""
echo -e "${YELLOW}Running ESLint...${NC}"
npm run lint || {
  echo -e "${RED}✗ Linting failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Linting passed${NC}"

# Run type check
echo ""
echo -e "${YELLOW}Running TypeScript type check...${NC}"
npm run typecheck || {
  echo -e "${RED}✗ Type check failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Type check passed${NC}"

# Run unit tests
echo ""
echo -e "${YELLOW}Running unit tests...${NC}"
npm test -- --testPathPattern=tests/unit || {
  echo -e "${RED}✗ Unit tests failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Unit tests passed${NC}"

# Run integration tests (if enabled)
if [ "${SKIP_INTEGRATION:-false}" != "true" ]; then
  echo ""
  echo -e "${YELLOW}Running integration tests...${NC}"
  npm test -- --testPathPattern=tests/integration || {
    echo -e "${RED}✗ Integration tests failed${NC}"
    exit 1
  }
  echo -e "${GREEN}✓ Integration tests passed${NC}"
fi

# Generate coverage report
echo ""
echo -e "${YELLOW}Generating coverage report...${NC}"
npm test -- --coverage || {
  echo -e "${RED}✗ Coverage generation failed${NC}"
  exit 1
}

# Check coverage thresholds
echo ""
echo -e "${YELLOW}Checking coverage thresholds (95%)...${NC}"
coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$coverage < 95" | bc -l) )); then
  echo -e "${RED}✗ Coverage below threshold: ${coverage}%${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Coverage: ${coverage}%${NC}"

# Success
echo ""
echo -e "${GREEN}===================================="
echo -e "✓ All tests passed!"
echo -e "====================================${NC}"
echo ""
echo "Coverage report: coverage/index.html"
echo ""
