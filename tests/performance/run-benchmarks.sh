#!/bin/bash

# Performance Benchmark Runner
# Runs performance tests with memory profiling enabled

set -e

echo "🚀 Compliance Autopilot - Performance Benchmarks"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if jest is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not available${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"
echo -e "${GREEN}✓${NC} NPM version: $(npm --version)"
echo ""

# Create output directory
OUTPUT_DIR="$(pwd)/tests/performance/results"
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Setting up environment...${NC}"

# Enable garbage collection for accurate memory measurements
export NODE_OPTIONS="--expose-gc --max-old-space-size=4096"

echo -e "${GREEN}✓${NC} Garbage collection enabled"
echo -e "${GREEN}✓${NC} Max memory set to 4GB"
echo ""

# Run benchmarks
echo -e "${YELLOW}Running performance benchmarks...${NC}"
echo ""

# Run with increased timeout and memory settings
npx jest tests/performance/benchmark.test.ts \
  --testTimeout=300000 \
  --forceExit \
  --verbose \
  --detectOpenHandles \
  --logHeapUsage

RESULT=$?

echo ""
echo "================================================"

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ All performance benchmarks passed!${NC}"
    echo ""

    # Check if report was generated
    if [ -f "docs/PERFORMANCE_BENCHMARK.md" ]; then
        echo -e "${GREEN}✓${NC} Performance report generated: docs/PERFORMANCE_BENCHMARK.md"
        echo ""

        # Show summary
        echo "Summary:"
        grep -A 10 "## Executive Summary" docs/PERFORMANCE_BENCHMARK.md || true
    fi
else
    echo -e "${RED}❌ Some performance benchmarks failed${NC}"
    echo ""
    echo "Please review the output above for details."
fi

echo ""
echo "For detailed analysis, see: docs/PERFORMANCE_BENCHMARK.md"

exit $RESULT
