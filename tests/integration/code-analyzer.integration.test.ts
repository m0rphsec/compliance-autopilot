/**
 * Integration tests for CodeAnalyzer
 * Tests with real Anthropic API (requires ANTHROPIC_API_KEY)
 * Run with: ANTHROPIC_API_KEY=your_key npm test -- integration
 */

import { CodeAnalyzer } from '../../src/analyzers/code-analyzer';
import { AnalysisRequest, BatchAnalysisRequest } from '../../src/types/analyzer';

describe('CodeAnalyzer Integration Tests', () => {
  let analyzer: CodeAnalyzer;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      console.warn('Skipping integration tests: ANTHROPIC_API_KEY not set');
      return;
    }

    analyzer = new CodeAnalyzer(apiKey, {
      maxRequestsPerMinute: 50,
      maxConcurrentRequests: 10,
    });
  });

  // Skip tests if no API key
  const describeIfApiKey = apiKey ? describe : describe.skip;

  describeIfApiKey('Real API Integration', () => {
    it('should detect hardcoded secrets in code', async () => {
      const request: AnalysisRequest = {
        code: `
const config = {
  apiKey: "sk-1234567890abcdef",
  password: "MySecretPassword123!",
  databaseUrl: "postgresql://admin:password123@localhost/db"
};
        `,
        filePath: 'src/config.ts',
        framework: 'soc2',
        language: 'typescript',
      };

      const result = await analyzer.analyzeFile(request);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some((v) => v.severity === 'critical')).toBe(true);
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
    }, 30000);

    it('should detect PII in GDPR analysis', async () => {
      const request: AnalysisRequest = {
        code: `
function createUser(data) {
  const user = {
    email: data.email,
    ssn: data.socialSecurityNumber,
    phoneNumber: data.phone,
    address: data.homeAddress
  };

  // Store in database without encryption
  db.users.insert(user);

  return user;
}
        `,
        filePath: 'src/user-service.ts',
        framework: 'gdpr',
        language: 'typescript',
      };

      const result = await analyzer.analyzeFile(request);

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.type.includes('PII'))).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle clean code correctly', async () => {
      const request: AnalysisRequest = {
        code: `
import { hash } from 'bcrypt';

export async function authenticateUser(username: string, password: string) {
  const user = await db.users.findOne({ username });

  if (!user) {
    throw new Error('User not found');
  }

  const isValid = await hash.compare(password, user.passwordHash);

  if (!isValid) {
    await auditLog.recordFailedLogin(username);
    throw new Error('Invalid credentials');
  }

  await auditLog.recordSuccessfulLogin(username);
  return generateSessionToken(user);
}
        `,
        filePath: 'src/auth-service.ts',
        framework: 'iso27001',
        language: 'typescript',
      };

      const result = await analyzer.analyzeFile(request);

      expect(result.compliant).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    }, 30000);

    it('should analyze batch of files efficiently', async () => {
      const batchRequest: BatchAnalysisRequest = {
        requests: [
          {
            code: 'const x = 1;',
            filePath: 'file1.ts',
            framework: 'soc2',
          },
          {
            code: 'const password = "secret";',
            filePath: 'file2.ts',
            framework: 'soc2',
          },
          {
            code: 'const email = "user@example.com";',
            filePath: 'file3.ts',
            framework: 'gdpr',
          },
        ],
        maxConcurrency: 3,
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeBatch(batchRequest);
      const duration = Date.now() - startTime;

      expect(result.results).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(duration).toBeLessThan(30000); // Should be faster than sequential
      console.log(`Batch analysis completed in ${duration}ms`);
    }, 60000);

    it('should use cache for identical requests', async () => {
      const request: AnalysisRequest = {
        code: 'const test = "value";',
        filePath: 'test.ts',
        framework: 'soc2',
      };

      // First request
      const startTime1 = Date.now();
      const result1 = await analyzer.analyzeFile(request);
      const duration1 = Date.now() - startTime1;

      expect(result1.metadata.cached).toBe(false);

      // Second request (should be cached)
      const startTime2 = Date.now();
      const result2 = await analyzer.analyzeFile(request);
      const duration2 = Date.now() - startTime2;

      expect(result2.metadata.cached).toBe(true);
      expect(duration2).toBeLessThan(duration1); // Cache should be faster

      console.log(`First request: ${duration1}ms, Cached request: ${duration2}ms`);
    }, 60000);

    it('should meet performance target for 100 files', async () => {
      // Generate 100 small files
      const requests: AnalysisRequest[] = Array.from({ length: 100 }, (_, i) => ({
        code: `const value${i} = ${i};\nexport default value${i};`,
        filePath: `src/file${i}.ts`,
        framework: 'soc2' as const,
      }));

      const batchRequest: BatchAnalysisRequest = {
        requests,
        maxConcurrency: 10,
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeBatch(batchRequest);
      const duration = Date.now() - startTime;

      expect(result.results).toHaveLength(100);
      expect(duration).toBeLessThan(60000); // Should complete in less than 60 seconds

      console.log(`Analyzed 100 files in ${duration}ms (${duration / 1000}s)`);
      console.log(`Average per file: ${duration / 100}ms`);
      console.log(`Cache hit rate: ${(result.summary.cacheHitRate * 100).toFixed(2)}%`);
    }, 120000); // Extended timeout for 100 files
  });

  describeIfApiKey('Error Handling', () => {
    it('should handle rate limiting gracefully', async () => {
      // Create analyzer with very low rate limit to test retry logic
      const limitedAnalyzer = new CodeAnalyzer(apiKey!, {
        maxRequestsPerMinute: 5,
        maxConcurrentRequests: 2,
      });

      const requests: AnalysisRequest[] = Array.from({ length: 10 }, (_, i) => ({
        code: `const x${i} = ${i};`,
        filePath: `file${i}.ts`,
        framework: 'soc2' as const,
      }));

      // This should trigger rate limiting but complete successfully
      const results = await Promise.all(
        requests.map((req) => limitedAnalyzer.analyzeFile(req))
      );

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.compliant !== undefined)).toBe(true);
    }, 120000);

    it('should handle malformed code gracefully', async () => {
      const request: AnalysisRequest = {
        code: 'this is not valid code {{{]]]',
        filePath: 'broken.ts',
        framework: 'soc2',
        language: 'typescript',
      };

      const result = await analyzer.analyzeFile(request);

      // Should still return a result, even if it can't fully analyze
      expect(result).toBeDefined();
      expect(result.filePath).toBe('broken.ts');
    }, 30000);
  });

  describeIfApiKey('Cache Performance', () => {
    it('should demonstrate cache effectiveness', async () => {
      const uniqueCode = `const timestamp = ${Date.now()};`;
      const request: AnalysisRequest = {
        code: uniqueCode,
        filePath: 'test.ts',
        framework: 'soc2',
      };

      // Clear cache before test
      analyzer.clearCache();

      // First batch - no cache
      const batch1 = Array(10).fill(request);
      const start1 = Date.now();
      await Promise.all(batch1.map((r) => analyzer.analyzeFile(r)));
      const duration1 = Date.now() - start1;

      // Second batch - should use cache
      const batch2 = Array(10).fill(request);
      const start2 = Date.now();
      await Promise.all(batch2.map((r) => analyzer.analyzeFile(r)));
      const duration2 = Date.now() - start2;

      console.log(`Without cache: ${duration1}ms, With cache: ${duration2}ms`);
      console.log(`Cache speedup: ${(duration1 / duration2).toFixed(2)}x`);

      expect(duration2).toBeLessThan(duration1 * 0.5); // Cache should be at least 2x faster
    }, 120000);
  });
});
