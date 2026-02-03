# Compliance Autopilot Test Suite

## 📊 Test Suite Overview

A comprehensive testing framework for the Compliance Autopilot GitHub Action with **95%+ code coverage target**.

```
✅ 30 test files created
✅ 350+ individual test cases
✅ Unit, Integration, and E2E coverage
✅ Mock data and sample code included
✅ Jest configuration optimized
✅ CI/CD ready
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (development)
npm run test:watch

# Full validation pipeline
./tests/run-tests.sh
```

## 📁 Directory Structure

```
tests/
├── setup.ts                   # Global test configuration
├── jest.config.js             # Jest configuration (in root)
├── run-tests.sh              # Comprehensive test runner
├── TEST_SUITE_SUMMARY.md     # Complete test inventory
├── TESTING_GUIDE.md          # Developer testing guide
│
├── unit/                     # Unit tests (isolated)
│   ├── collectors/
│   │   ├── soc2.test.ts      # 64+ SOC2 control tests
│   │   ├── gdpr.test.ts      # 40+ GDPR compliance tests
│   │   └── iso27001.test.ts  # 30+ ISO27001 control tests
│   ├── analyzers/
│   │   ├── code-analyzer.test.ts  # Claude API integration
│   │   └── pii-detector.test.ts   # PII pattern detection
│   ├── reports/
│   │   ├── pdf-generator.test.ts  # PDF creation & formatting
│   │   └── json-formatter.test.ts # JSON schema validation
│   ├── github/
│   │   ├── api-client.test.ts     # GitHub API wrapper
│   │   ├── pr-commenter.test.ts   # PR comment posting
│   │   └── artifact-store.test.ts # Release artifact upload
│   └── utils/
│       ├── logger.test.ts         # Structured logging
│       ├── config.test.ts         # Configuration management
│       └── errors.test.ts         # Error handling
│
├── integration/              # Integration tests (with APIs)
│   ├── end-to-end.test.ts    # Full workflow tests
│   └── code-analyzer.integration.test.ts
│
└── fixtures/                 # Test data and samples
    ├── mock-data/
    │   ├── github-responses.ts    # Mock GitHub API responses
    │   └── claude-responses.ts    # Mock Claude API responses
    ├── sample-code/
    │   ├── clean-code.ts          # Compliant code samples
    │   └── violation-code.ts      # Violation examples
    └── README.md
```

## 🎯 Coverage Targets

| Metric | Target | Description |
|--------|--------|-------------|
| **Branches** | 95% | All code paths tested |
| **Functions** | 95% | All functions called |
| **Lines** | 95% | All lines executed |
| **Statements** | 95% | All statements run |

### Coverage Report

```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
open coverage/index.html
```

## 🧪 Test Categories

### 1. Unit Tests (tests/unit/)

**Purpose:** Test individual components in isolation with mocked dependencies.

**Files:** 13 test files, 319+ test cases

**Coverage:**
- ✅ All collectors (SOC2, GDPR, ISO27001)
- ✅ All analyzers (Claude integration, PII detection)
- ✅ All report generators (PDF, JSON)
- ✅ All GitHub integrations (API, comments, releases)
- ✅ All utilities (logging, config, errors)

**Run:** `npm run test:unit`

### 2. Integration Tests (tests/integration/)

**Purpose:** Test complete workflows with real or simulated APIs.

**Files:** 2 test files, 30+ test cases

**Coverage:**
- ✅ End-to-end SOC2 scans
- ✅ End-to-end GDPR scans
- ✅ End-to-end ISO27001 scans
- ✅ Multi-framework scans
- ✅ Report generation (PDF + JSON)
- ✅ PR comment posting
- ✅ Release artifact uploading
- ✅ Error scenarios
- ✅ Performance benchmarks

**Run:** `npm run test:integration`

### 3. Fixtures (tests/fixtures/)

**Purpose:** Reusable mock data and sample code for testing.

**Contents:**
- 📦 Mock GitHub API responses (PRs, reviews, deployments, etc.)
- 📦 Mock Claude API responses (GDPR analysis, SOC2 results, etc.)
- 📦 Sample clean code (compliant examples)
- 📦 Sample violation code (non-compliant examples)

## 🔧 Test Utilities

### Global Test Setup (tests/setup.ts)

Runs before all tests:
- Sets environment variables
- Configures global test utilities
- Sets test timeout (30s)
- Provides helper functions:
  - `testUtils.delay(ms)` - Sleep utility
  - `testUtils.mockGitHubResponse(data)` - Mock GitHub API
  - `testUtils.mockClaudeResponse(data)` - Mock Claude API

### Test Runner Script (tests/run-tests.sh)

Comprehensive test pipeline:
1. ✅ Check Node.js version (≥20)
2. 📦 Install dependencies
3. 🔍 Run ESLint
4. 📝 Run TypeScript type check
5. 🧪 Run unit tests
6. 🔗 Run integration tests
7. 📊 Generate coverage report
8. ✔️ Validate coverage threshold (≥95%)

**Usage:**
```bash
./tests/run-tests.sh

# Skip integration tests
SKIP_INTEGRATION=true ./tests/run-tests.sh
```

## 📚 Documentation

### TEST_SUITE_SUMMARY.md
Complete test inventory with:
- Test statistics
- Test case breakdown
- Coverage requirements
- Performance benchmarks
- Quality gates

### TESTING_GUIDE.md
Developer guide with:
- Quick start guide
- TDD workflow
- Mocking strategies
- Best practices
- Debugging tips
- Common issues

## 🏃 Running Tests

### All Tests

```bash
npm test
```

### Specific Test Suite

```bash
npm test -- tests/unit/collectors/soc2.test.ts
```

### Single Test

```bash
npm test -- -t "should detect code review violations"
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Full Validation

```bash
npm run validate
# Runs: lint + typecheck + test
```

## 🔬 Test-Driven Development

### Workflow

1. **Write test first** (Red)
   ```typescript
   it('should validate email format', () => {
     expect(validateEmail('invalid')).toBe(false);
   });
   ```

2. **Run test** (verify it fails)
   ```bash
   npm test
   ```

3. **Implement feature** (Green)
   ```typescript
   function validateEmail(email) {
     return /\S+@\S+\.\S+/.test(email);
   }
   ```

4. **Run test again** (verify it passes)
   ```bash
   npm test
   ```

5. **Refactor** (keep tests passing)

## 🎭 Mocking

### External APIs

```typescript
// Mock GitHub API
jest.mock('@octokit/rest');
mockOctokit.rest.pulls.get.mockResolvedValue({ data: mockPullRequest });

// Mock Claude API
jest.mock('@anthropic-ai/sdk');
mockAnthropic.messages.create.mockResolvedValue(mockClaudeResponse);
```

### Using Fixtures

```typescript
import { mockPRReviews } from '@tests/fixtures/mock-data/github-responses';

mockOctokit.rest.pulls.listReviews.mockResolvedValue({ data: mockPRReviews });
```

## 🚦 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- ✅ Every push
- ✅ Every pull request
- ✅ Daily schedule

### Quality Gates

Merges blocked if:
- ❌ Tests fail
- ❌ Coverage below 95%
- ❌ Linting errors
- ❌ Type errors

## 📈 Performance

### Benchmarks

| Operation | Target |
|-----------|--------|
| Single control check | <5s |
| Small repo scan (<100 files) | <30s |
| Medium repo (100-500 files) | <60s |
| Large repo (500-5000 files) | <180s |
| PDF generation | <5s |
| JSON formatting | <100ms |

### Running Benchmarks

```typescript
it('should complete scan in <60 seconds', async () => {
  const startTime = Date.now();
  await runScan();
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(60000);
}, 120000);
```

## 🐛 Debugging

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Run Single Test

```bash
npm test -- -t "specific test name"
```

### Use Console Logs

```typescript
it('test', () => {
  console.log('Debug value:', value);
  expect(value).toBe(expected);
});
```

### VS Code Debugger

1. Add breakpoint
2. Click "Debug Test" in Jest extension
3. Step through code

## 🔒 Security

### Environment Variables

```bash
# Required for integration tests
export GITHUB_TOKEN="ghp_..."
export ANTHROPIC_API_KEY="sk-ant-api..."
```

**⚠️ Never commit API keys!**

### Sensitive Data Handling

- API keys redacted in logs
- Test tokens used in unit tests
- Real keys only in integration tests (CI secrets)

## 📋 Checklist

Before Phase 4 (Documentation):

- [x] Test structure created (30 files)
- [x] Jest configuration optimized
- [x] Mock data prepared
- [x] Sample code created
- [x] Test runner script ready
- [x] Documentation complete
- [ ] Source code implemented
- [ ] Tests passing
- [ ] Coverage ≥95%
- [ ] Performance benchmarks met

## 🆘 Common Issues

### "Cannot find module"

```bash
npm install
```

### "Jest did not exit"

```typescript
afterAll(async () => {
  await cleanup();
});
```

### "Timeout exceeded"

```typescript
it('slow test', async () => {
  // ...
}, 60000); // Increase timeout
```

### "Coverage below threshold"

1. Run `npm run test:coverage`
2. Open `coverage/index.html`
3. Find uncovered lines (red/yellow)
4. Add tests for those lines

## 🤝 Contributing

### Adding New Tests

1. Create test file: `tests/unit/[component]/[name].test.ts`
2. Import from `@jest/globals`
3. Mock external dependencies
4. Follow TDD workflow
5. Aim for 95%+ coverage

### Updating Mocks

When APIs change:
1. Update `tests/fixtures/mock-data/`
2. Re-run tests
3. Fix breaking changes
4. Document updates

## 📞 Support

- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed help
- Review [TEST_SUITE_SUMMARY.md](./TEST_SUITE_SUMMARY.md) for test inventory
- See existing tests for examples
- Open issue on GitHub

---

**Test Suite Status:** ✅ Structure Complete | ⏳ Awaiting Implementation

**Next Steps:** Implement source code and achieve 95%+ coverage

**Happy Testing! 🧪**
