# Testing Guide - Compliance Autopilot

## Quick Start

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration

# Watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Full validation (lint + typecheck + test)
npm run validate

# Or use the comprehensive test runner
./tests/run-tests.sh
```

## Test-Driven Development Workflow

### 1. Write Test First (Red)

```typescript
// tests/unit/collectors/soc2.test.ts
it('should detect code review violations', async () => {
  const collector = new SOC2Collector();
  const result = await collector.checkCC1_1({ prNumber: 123 });

  expect(result.status).toBe('FAIL');
  expect(result.violation).toContain('Missing approval');
});
```

### 2. Run Test (Verify It Fails)

```bash
npm test -- tests/unit/collectors/soc2.test.ts
```

### 3. Implement Feature (Green)

```typescript
// src/collectors/soc2.ts
async checkCC1_1(context) {
  const reviews = await this.github.pulls.listReviews(context);
  const approvals = reviews.filter(r => r.state === 'APPROVED');

  if (approvals.length === 0) {
    return { status: 'FAIL', violation: 'Missing approval' };
  }

  return { status: 'PASS' };
}
```

### 4. Run Test Again (Verify It Passes)

```bash
npm test -- tests/unit/collectors/soc2.test.ts
```

### 5. Refactor (Clean Up)

- Extract common logic
- Improve naming
- Add documentation
- Keep tests passing

## Test Organization

### Unit Tests

**Purpose:** Test individual functions/classes in isolation

**Structure:**
```
tests/unit/
├── collectors/      # Business logic tests
├── analyzers/       # AI integration tests
├── reports/         # Report generation tests
├── github/          # API integration tests
└── utils/           # Utility function tests
```

**Example:**
```typescript
describe('SOC2Collector', () => {
  let collector: SOC2Collector;
  let mockGitHub: MockGitHub;

  beforeEach(() => {
    mockGitHub = new MockGitHub();
    collector = new SOC2Collector(mockGitHub);
  });

  describe('checkCC1_1', () => {
    it('should pass with approvals', async () => {
      mockGitHub.setReviews([{ state: 'APPROVED' }]);
      const result = await collector.checkCC1_1();
      expect(result.status).toBe('PASS');
    });
  });
});
```

### Integration Tests

**Purpose:** Test complete workflows with real/simulated APIs

**Structure:**
```
tests/integration/
├── end-to-end.test.ts           # Full scan workflows
├── code-analyzer.integration.test.ts  # Claude API
└── github.integration.test.ts   # GitHub API (future)
```

**Example:**
```typescript
describe('End-to-End SOC2 Scan', () => {
  it('should complete full scan', async () => {
    const result = await runComplianceScan({
      framework: 'soc2',
      repo: 'test-org/test-repo',
    });

    expect(result.status).toBe('PASS');
    expect(result.report).toBeDefined();
    expect(result.pdfUrl).toMatch(/github\.com/);
  }, 120000); // 2 minute timeout
});
```

## Mocking Strategies

### 1. Mock External APIs

```typescript
// Mock GitHub API
jest.mock('@octokit/rest');
const mockOctokit = {
  rest: {
    pulls: {
      listReviews: jest.fn().mockResolvedValue({
        data: [{ state: 'APPROVED' }],
      }),
    },
  },
};

// Mock Claude API
jest.mock('@anthropic-ai/sdk');
const mockAnthropic = {
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: '{"compliant": true}' }],
    }),
  },
};
```

### 2. Use Test Fixtures

```typescript
import { mockPullRequest, mockPRReviews } from '@tests/fixtures/mock-data/github-responses';

mockOctokit.rest.pulls.get.mockResolvedValue({ data: mockPullRequest });
mockOctokit.rest.pulls.listReviews.mockResolvedValue({ data: mockPRReviews });
```

### 3. Spy on Functions

```typescript
const loggerSpy = jest.spyOn(console, 'log');

// ... run code ...

expect(loggerSpy).toHaveBeenCalledWith('Scan complete');
loggerSpy.mockRestore();
```

## Testing Best Practices

### ✅ DO

- **Write tests first** (TDD)
- **Test one thing per test**
- **Use descriptive test names**
  ```typescript
  // Good
  it('should FAIL when PR has 0 approvals', async () => {

  // Bad
  it('test reviews', async () => {
  ```

- **Arrange-Act-Assert pattern**
  ```typescript
  // Arrange
  const input = { prNumber: 123 };
  mockAPI.setResponse([]);

  // Act
  const result = await collector.check(input);

  // Assert
  expect(result.status).toBe('FAIL');
  ```

- **Mock external dependencies**
- **Test edge cases** (empty, null, errors)
- **Test error handling**
- **Keep tests fast** (<1s for unit tests)
- **Use beforeEach for setup**
- **Clean up in afterEach**

### ❌ DON'T

- **Test implementation details**
- **Create test interdependencies**
- **Use real API keys in tests**
- **Commit test outputs** (coverage/, logs/)
- **Skip tests** (use .skip only temporarily)
- **Write overly complex tests**
- **Test framework code** (test your code only)

## Coverage Goals

### Target: 95%+ Across All Metrics

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 95,    // All code paths
    functions: 95,   // All functions called
    lines: 95,       // All lines executed
    statements: 95,  // All statements run
  },
}
```

### Checking Coverage

```bash
# Generate HTML report
npm run test:coverage

# Open in browser
open coverage/index.html

# Check specific file
npm test -- --coverage --collectCoverageFrom=src/collectors/soc2.ts
```

### Improving Coverage

1. **Find uncovered lines:**
   ```bash
   npm run test:coverage
   # Look for red/yellow lines in coverage/index.html
   ```

2. **Write tests for uncovered code:**
   ```typescript
   // Add test for error path
   it('should handle API errors', async () => {
     mockAPI.rejectWith(new Error('API Error'));
     await expect(collector.check()).rejects.toThrow();
   });
   ```

3. **Remove dead code:**
   - If code isn't covered and isn't needed, delete it

## Performance Testing

### Benchmarking

```typescript
it('should complete scan in <60 seconds', async () => {
  const startTime = Date.now();

  await runComplianceScan({ framework: 'soc2' });

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(60000);
}, 120000); // 2x timeout for safety
```

### Memory Testing

```typescript
it('should not leak memory', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Run operation 100 times
  for (let i = 0; i < 100; i++) {
    await processData();
  }

  global.gc(); // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed;

  const increase = finalMemory - initialMemory;
  expect(increase).toBeLessThan(50 * 1024 * 1024); // <50MB
});
```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should detect code review violations"
```

### Run Single File

```bash
npm test -- tests/unit/collectors/soc2.test.ts
```

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Use Console Logs

```typescript
it('should work', () => {
  console.log('Value:', someValue); // Will show in output
  expect(someValue).toBe(expected);
});
```

### Use VS Code Debugger

1. Add breakpoint in test
2. Click "Debug Test" in Jest extension
3. Step through code

### Check Mock Calls

```typescript
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith({ expected: 'args' });

// See all calls
console.log(mockFunction.mock.calls);
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Every push to any branch
- Every pull request
- Daily schedule (for integration tests)

### Quality Gates

Pull requests must:
- ✅ Pass all tests
- ✅ Maintain 95%+ coverage
- ✅ Pass linting
- ✅ Pass type checking
- ✅ Complete in <10 minutes

### Failure Handling

If tests fail in CI:
1. Check the GitHub Actions logs
2. Reproduce locally: `npm test`
3. Fix the issue
4. Push fix
5. CI re-runs automatically

## Common Issues

### Issue: "Cannot find module"

**Solution:**
```bash
npm install
```

### Issue: "Jest did not exit one second after test run"

**Solution:**
```typescript
// Close connections in afterAll
afterAll(async () => {
  await database.close();
  await server.close();
});
```

### Issue: "Timeout of 5000ms exceeded"

**Solution:**
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // ...
}, 30000); // 30 seconds
```

### Issue: "Coverage below threshold"

**Solution:**
1. Run `npm run test:coverage`
2. Open `coverage/index.html`
3. Find uncovered lines (red/yellow)
4. Add tests for those lines

### Issue: "Tests pass locally but fail in CI"

**Possible causes:**
- Different Node version
- Missing environment variables
- Timing issues (use jest.useFakeTimers)
- Platform differences (Windows vs Linux)

**Solution:**
```bash
# Match CI environment
nvm use 20
npm ci  # Use exact versions from package-lock.json
npm test
```

## Test Maintenance

### When to Update Tests

- **New feature added:** Write tests first (TDD)
- **Bug fixed:** Add test that would catch the bug
- **API changed:** Update mocks
- **Refactoring:** Tests should still pass
- **Dependencies updated:** Verify tests still work

### Keeping Tests Clean

- **Remove obsolete tests**
- **Update outdated comments**
- **Consolidate duplicate tests**
- **Improve test names**
- **Refactor test utilities**

### Regular Maintenance

- **Weekly:** Review coverage, fix any drops
- **Monthly:** Update test dependencies
- **Quarterly:** Review and refactor test suite
- **Yearly:** Audit test strategy and patterns

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### Project Files

- `jest.config.js` - Jest configuration
- `tests/setup.ts` - Global test setup
- `tests/fixtures/` - Mock data and samples
- `tests/TEST_SUITE_SUMMARY.md` - Complete test inventory

### Getting Help

- Check existing tests for examples
- Read error messages carefully
- Search Jest documentation
- Ask in project Discord/Slack
- Open GitHub issue

---

**Happy Testing! 🧪**

Remember: **Good tests make confident developers.**
