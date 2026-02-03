# Test Fixtures

This directory contains mock data and sample code for testing.

## Structure

```
fixtures/
├── mock-data/          # Mock API responses
│   ├── github-responses.ts
│   └── claude-responses.ts
├── sample-code/        # Sample code for analysis
│   ├── clean-code.ts
│   └── violation-code.ts
└── sample-repos/       # Test repositories (git submodules or local)
```

## Mock Data

### GitHub Responses (`github-responses.ts`)

Mock responses from GitHub API for testing:

- Pull requests
- Reviews
- Deployments
- Collaborators
- Issues
- Commits
- Vulnerabilities
- Rate limits
- Releases
- Errors

### Claude Responses (`claude-responses.ts`)

Mock responses from Claude API for testing:

- GDPR analysis (clean and violations)
- SOC2 analysis
- ISO27001 analysis
- Code analysis (secure and insecure)
- Error responses

## Sample Code

### Clean Code (`clean-code.ts`)

Example of compliant code:
- Uses HTTPS
- Encrypts PII
- Has data retention policies
- Implements deletion
- Validates inputs
- Gets user consent

### Violation Code (`violation-code.ts`)

Example of non-compliant code:
- Hardcoded PII (emails, SSNs)
- Hardcoded secrets (API keys, passwords)
- Uses HTTP
- SQL injection vulnerabilities
- XSS vulnerabilities
- No encryption
- No consent checks
- No data retention
- No deletion capability

## Usage

```typescript
import { mockPullRequest, mockPRReviews } from '@tests/fixtures/mock-data/github-responses';
import { mockGDPRAnalysisViolations } from '@tests/fixtures/mock-data/claude-responses';

// In tests
mockOctokit.rest.pulls.get.mockResolvedValue({ data: mockPullRequest });
mockAnthropic.messages.create.mockResolvedValue(mockGDPRAnalysisViolations);
```

## Test Repositories

For integration tests, you can:

1. Use local test repos in `sample-repos/`
2. Use GitHub test organization repos
3. Create temporary repos during tests
4. Use public repos with known compliance status

### Recommended Test Repos

- **Clean repo**: All controls passing
- **Violation repo**: Known violations
- **Large repo**: Performance testing
- **Monorepo**: Edge case testing
- **Private repo**: Permission testing
