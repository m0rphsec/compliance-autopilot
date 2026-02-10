# Contributing to Compliance Autopilot

Thank you for your interest in contributing to Compliance Autopilot! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

- 🐛 **Bug Reports** - Report issues you encounter
- ✨ **Feature Requests** - Suggest new features or improvements
- 📖 **Documentation** - Improve or add documentation
- 💻 **Code** - Submit pull requests with bug fixes or features
- 🧪 **Testing** - Help test new features and releases
- 💬 **Support** - Answer questions in issues and discussions

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 9 or higher
- Git
- A GitHub account
- An Anthropic API key (for testing)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/compliance-autopilot.git
   cd compliance-autopilot
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/m0rphsec/compliance-autopilot.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   # Set your API keys as environment variables for testing
   export ANTHROPIC_API_KEY=your-key-here
   export GITHUB_TOKEN=your-token-here
   ```

5. **Verify setup**
   ```bash
   npm run validate
   ```

## 🏗️ Project Structure

```
compliance-autopilot/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types/                # TypeScript type definitions
│   ├── collectors/           # Evidence collectors (SOC2, GDPR, ISO27001)
│   ├── analyzers/            # Code analyzers (Claude integration)
│   ├── reports/              # Report generators (PDF, JSON)
│   ├── github/               # GitHub API integration
│   └── utils/                # Utilities (logger, errors, config)
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test data and mocks
├── docs/                     # Documentation
├── action.yml               # GitHub Action metadata
└── package.json             # Dependencies and scripts
```

## 🔨 Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/issue-number-description
```

### 2. Make Changes

Follow our coding standards:

- **TypeScript**: Use strict mode, proper types
- **ESLint**: Run `npm run lint` to check
- **Prettier**: Run `npm run format` to format
- **Tests**: Write tests for new code

### 3. Test Your Changes

```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run full validation
npm run validate
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Good commit messages
git commit -m "feat: add HIPAA framework support"
git commit -m "fix: resolve PDF generation error for large reports"
git commit -m "docs: update README with new examples"
git commit -m "test: add unit tests for GDPR collector"
git commit -m "refactor: improve Claude API error handling"

# Bad commit messages (avoid)
git commit -m "update stuff"
git commit -m "fixes"
git commit -m "wip"
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Fill out the PR template
```

## 📝 Pull Request Guidelines

### PR Checklist

Before submitting, ensure:

- [ ] Code follows TypeScript/ESLint style guide
- [ ] All tests pass (`npm test`)
- [ ] Code coverage remains ≥95%
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains changes clearly
- [ ] No breaking changes (or clearly documented)
- [ ] Self-reviewed the code

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Coverage ≥95%
- [ ] Docs updated
- [ ] No breaking changes
```

### Review Process

1. **Automated Checks** - Must pass CI/CD
2. **Code Review** - At least one maintainer approval
3. **Testing** - Verify changes work as expected
4. **Documentation** - Check docs are updated
5. **Merge** - Squash and merge to main

## 🧪 Testing Guidelines

### Writing Tests

```typescript
// Example unit test
import { SOC2Collector } from '../src/collectors/soc2';

describe('SOC2Collector', () => {
  let collector: SOC2Collector;

  beforeEach(() => {
    collector = new SOC2Collector(mockOctokit, mockContext);
  });

  describe('CC1.1 - Code Review', () => {
    it('should pass when PR has approvals', async () => {
      // Arrange
      mockOctokit.rest.pulls.listReviews.mockResolvedValue({
        data: [{ state: 'APPROVED' }]
      });

      // Act
      const result = await collector.checkCC1_1();

      // Assert
      expect(result.status).toBe('PASS');
      expect(result.evidence.approvals).toHaveLength(1);
    });

    it('should fail when PR has no approvals', async () => {
      // Arrange
      mockOctokit.rest.pulls.listReviews.mockResolvedValue({
        data: []
      });

      // Act
      const result = await collector.checkCC1_1();

      // Assert
      expect(result.status).toBe('FAIL');
      expect(result.recommendations).toContain('Enable required reviews');
    });
  });
});
```

### Test Coverage

- Minimum 95% coverage required
- Test happy paths and edge cases
- Test error handling
- Mock external dependencies
- Use snapshot testing for reports

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npm test -- src/collectors/soc2.test.ts
```

## 🎨 Code Style

### TypeScript Guidelines

```typescript
// ✅ Good
interface ComplianceReport {
  framework: ComplianceFramework;
  timestamp: string;
  controls: ControlResult[];
}

async function generateReport(
  data: ComplianceReport
): Promise<ReportResult> {
  // Implementation
}

// ❌ Bad
interface report {
  framework: string;
  timestamp: any;
  controls: any[];
}

function generateReport(data: any): any {
  // Implementation
}
```

### Naming Conventions

- **Interfaces/Types**: PascalCase (`ComplianceReport`)
- **Variables/Functions**: camelCase (`generateReport`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: kebab-case (`code-analyzer.ts`)
- **Classes**: PascalCase (`SOC2Collector`)

### Documentation

```typescript
/**
 * Generates a PDF compliance report from collected evidence.
 *
 * @param report - The compliance report data
 * @returns Promise resolving to PDF generation result
 * @throws {ReportError} If PDF generation fails
 *
 * @example
 * ```typescript
 * const result = await generatePDF(report);
 * console.log(`PDF saved to ${result.path}`);
 * ```
 */
async function generatePDF(report: ComplianceReport): Promise<ReportResult> {
  // Implementation
}
```

## 🐛 Reporting Bugs

### Before Submitting

1. Check existing issues
2. Verify it's not a configuration issue
3. Test with latest version
4. Try to reproduce consistently

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Step 1
2. Step 2
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Version: [e.g., v1.0.0]
- Node.js: [e.g., 20.5.0]
- OS: [e.g., Ubuntu 22.04]

**Logs**
```
Error logs (with secrets redacted)
```

**Screenshots**
If applicable
```

## ✨ Feature Requests

### Before Submitting

1. Check existing feature requests
2. Verify it's not already implemented
3. Consider if it fits the project scope

### Feature Request Template

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives**
Other approaches considered

**Use Cases**
Who would benefit?

**Additional Context**
Any other relevant info
```

## 🔒 Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Report via [GitHub Security Advisories](https://github.com/m0rphsec/compliance-autopilot/security/advisories/new)
2. Include detailed description
3. Include steps to reproduce
4. We'll respond within 48 hours

See [SECURITY.md](./SECURITY.md) for details.

## 📖 Documentation

### Documentation Standards

- Clear, concise language
- Code examples for features
- Keep up-to-date with code changes
- Use proper markdown formatting

### Updating Docs

When adding features, update:
- `README.md` - Overview and quick start
- `docs/ARCHITECTURE.md` - System design changes
- `docs/EXAMPLES.md` - Usage examples
- `docs/CONTROLS.md` - Control mappings
- API docs (JSDoc comments)

## 🤝 Community

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/):

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on what's best for the community
- Show empathy

### Getting Help

- 🐛 Issues: [GitHub Issues](https://github.com/m0rphsec/compliance-autopilot/issues)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributors page

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Thank you for contributing to Compliance Autopilot!** 🎉

Your contributions help make compliance automation accessible to everyone.
