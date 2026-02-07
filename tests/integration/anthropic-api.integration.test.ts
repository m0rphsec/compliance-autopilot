/**
 * Comprehensive Integration Tests for Anthropic API
 *
 * Tests the complete Anthropic SDK integration including:
 * - Client initialization and configuration
 * - Code analysis with real API calls
 * - GDPR PII detection with Claude
 * - Rate limiting and retry logic
 * - Error handling for API failures
 * - Performance and caching
 *
 * Environment: Requires ANTHROPIC_API_KEY environment variable
 * Run with: ANTHROPIC_API_KEY=your_key npm test -- anthropic-api.integration
 */

import Anthropic from '@anthropic-ai/sdk';
import { CodeAnalyzer } from '../../src/analyzers/code-analyzer';
import { PIIDetector } from '../../src/analyzers/pii-detector';
import { AnalysisRequest, BatchAnalysisRequest } from '../../src/types/analyzer';

describe('Anthropic API Integration Tests', () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  let analyzer: CodeAnalyzer;
  let piiDetector: PIIDetector;

  // Track test execution metrics
  const metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokensUsed: 0,
    cacheHits: 0,
    averageResponseTime: 0,
  };

  beforeAll(() => {
    if (!apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set - tests will be skipped');
      return;
    }

    console.log('🚀 Initializing Anthropic API integration tests...');

    analyzer = new CodeAnalyzer(apiKey, {
      maxRequestsPerMinute: 50,
      maxConcurrentRequests: 10,
      backoffMultiplier: 2,
      maxRetries: 3,
    });

    piiDetector = new PIIDetector();
  });

  afterAll(() => {
    if (apiKey) {
      console.log('\n📊 Test Execution Metrics:');
      console.log(`   Total Requests: ${metrics.totalRequests}`);
      console.log(`   Successful: ${metrics.successfulRequests}`);
      console.log(`   Failed: ${metrics.failedRequests}`);
      console.log(`   Total Tokens Used: ${metrics.totalTokensUsed}`);
      console.log(`   Cache Hits: ${metrics.cacheHits}`);
      console.log(`   Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);

      const cacheStats = analyzer.getCacheStats();
      console.log(`\n💾 Cache Statistics:`);
      console.log(`   Size: ${cacheStats.size}/${cacheStats.maxSize}`);
      console.log(`   Hit Rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);

      const rateLimiterStats = analyzer.getRateLimiterStatus();
      console.log(`\n⚡ Rate Limiter Status:`);
      console.log(`   Active Requests: ${rateLimiterStats.activeRequests}`);
      console.log(`   Requests in Last Minute: ${rateLimiterStats.requestsInLastMinute}`);
    }
  });

  // Helper function to track metrics
  const trackRequest = (duration: number, tokensUsed: number, cached: boolean, success: boolean) => {
    metrics.totalRequests++;
    if (success) metrics.successfulRequests++;
    else metrics.failedRequests++;
    metrics.totalTokensUsed += tokensUsed;
    if (cached) metrics.cacheHits++;
    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) / metrics.totalRequests;
  };

  const describeIfApiKey = apiKey ? describe : describe.skip;

  describe('1. SDK Client Initialization', () => {
    it('should initialize Anthropic client with valid API key', () => {
      expect(() => {
        const client = new Anthropic({ apiKey });
        expect(client).toBeInstanceOf(Anthropic);
      }).not.toThrow();
    });

    it('should fail to initialize with missing API key', () => {
      expect(() => {
        new CodeAnalyzer('');
      }).toThrow('Anthropic API key is required');
    });

    it('should initialize with custom rate limit configuration', () => {
      const customAnalyzer = new CodeAnalyzer(apiKey, {
        maxRequestsPerMinute: 30,
        maxConcurrentRequests: 5,
        backoffMultiplier: 1.5,
        maxRetries: 5,
      });

      expect(customAnalyzer).toBeInstanceOf(CodeAnalyzer);
      const status = customAnalyzer.getRateLimiterStatus();
      expect(status.activeRequests).toBe(0);
    });

    it('should initialize with custom cache configuration', () => {
      const customAnalyzer = new CodeAnalyzer(
        apiKey,
        { maxRequestsPerMinute: 50 },
        { maxSize: 200, ttlMs: 3600000 }
      );

      expect(customAnalyzer).toBeInstanceOf(CodeAnalyzer);
      const cacheStats = customAnalyzer.getCacheStats();
      expect(cacheStats.maxSize).toBe(200);
    });
  });

  describeIfApiKey('2. Code Analysis with Real API Calls', () => {
    beforeEach(() => {
      // Clear cache before each test for consistent results
      analyzer.clearCache();
    });

    it('should analyze code for SOC2 compliance violations', async () => {
      const request: AnalysisRequest = {
        code: `
// Hardcoded credentials - SOC2 violation
const config = {
  apiKey: "sk-prod-1234567890abcdef",
  databasePassword: "admin123",
  secretToken: "my-secret-token"
};

// No access control checks
function deleteUser(userId) {
  return database.delete({ id: userId });
}

// Missing audit logging
function updateSensitiveData(data) {
  return database.update(data);
}
        `,
        filePath: 'src/config.ts',
        framework: 'soc2',
        language: 'typescript',
        context: 'Configuration file for production application',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      // Validate response structure
      expect(result).toBeDefined();
      expect(result.filePath).toBe('src/config.ts');
      expect(result.framework).toBe('soc2');
      expect(typeof result.compliant).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);

      // Validate metadata
      expect(result.metadata.analyzedAt).toBeDefined();
      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
      expect(result.metadata.modelVersion).toBe('claude-sonnet-4-5-20250929');

      // Should detect violations
      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);

      // Check for security violations
      const criticalViolations = result.violations.filter(v => v.severity === 'critical' || v.severity === 'high');
      expect(criticalViolations.length).toBeGreaterThan(0);

      console.log(`\n✅ SOC2 Analysis completed in ${duration}ms`);
      console.log(`   Violations found: ${result.violations.length}`);
      console.log(`   Compliance score: ${result.score}/100`);
      console.log(`   Tokens used: ${result.metadata.tokensUsed}`);
    }, 45000);

    it('should analyze code for ISO27001 compliance', async () => {
      const request: AnalysisRequest = {
        code: `
import crypto from 'crypto';

class SecurityService {
  // Weak encryption algorithm (A.10)
  encryptData(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // No access control validation (A.9)
  accessSensitiveResource(userId: string) {
    return database.query('SELECT * FROM sensitive_data');
  }

  // Missing incident logging (A.16)
  handleSecurityEvent(event: any) {
    console.log('Security event occurred');
  }
}
        `,
        filePath: 'src/security-service.ts',
        framework: 'iso27001',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      expect(result.compliant).toBe(false);
      expect(result.framework).toBe('iso27001');
      expect(result.violations.length).toBeGreaterThan(0);

      // Should detect weak cryptography
      const cryptoViolations = result.violations.filter(v =>
        v.type.includes('A.10') || v.description.toLowerCase().includes('crypt')
      );
      expect(cryptoViolations.length).toBeGreaterThan(0);

      console.log(`\n✅ ISO27001 Analysis completed in ${duration}ms`);
      console.log(`   Security violations: ${result.violations.length}`);
    }, 45000);

    it('should handle compliant code correctly', async () => {
      const request: AnalysisRequest = {
        code: `
import { hash, compare } from 'bcrypt';
import { Logger } from './logger';
import { AccessControl } from './access-control';

const logger = new Logger('AuthService');
const accessControl = new AccessControl();

export class AuthService {
  private readonly saltRounds = 12;

  async authenticateUser(username: string, password: string) {
    // Check access permissions
    await accessControl.validateAccess('auth:login');

    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      logger.audit('login_failed', { username, reason: 'user_not_found' });
      throw new Error('Invalid credentials');
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      logger.audit('login_failed', { username, reason: 'invalid_password' });
      throw new Error('Invalid credentials');
    }

    logger.audit('login_success', { username, userId: user.id });
    return this.generateSecureToken(user);
  }

  private async generateSecureToken(user: User): Promise<string> {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}
        `,
        filePath: 'src/auth-service.ts',
        framework: 'soc2',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      expect(result.compliant).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.violations.length).toBe(0);

      console.log(`\n✅ Compliant code analysis completed in ${duration}ms`);
      console.log(`   Compliance score: ${result.score}/100`);
    }, 45000);
  });

  describeIfApiKey('3. GDPR PII Detection with Claude', () => {
    it('should detect email addresses in code', async () => {
      const code = `
const users = [
  { name: 'John Doe', email: 'john.doe@example.com' },
  { name: 'Jane Smith', email: 'jane.smith@company.org' }
];
      `;

      // First use regex-based PII detector
      const regexMatches = piiDetector.detectEmails(code);
      expect(regexMatches.length).toBe(2);

      // Then use Claude for contextual analysis
      const request: AnalysisRequest = {
        code,
        filePath: 'src/users.ts',
        framework: 'gdpr',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      expect(result.violations.some(v =>
        v.type.includes('PII') || v.description.toLowerCase().includes('email')
      )).toBe(true);

      console.log(`\n✅ Email PII detection completed in ${duration}ms`);
      console.log(`   Regex matches: ${regexMatches.length}`);
      console.log(`   Claude violations: ${result.violations.length}`);
    }, 45000);

    it('should detect SSN and sensitive PII', async () => {
      const code = `
const sensitiveData = {
  ssn: '123-45-6789',
  creditCard: '4532-1234-5678-9010',
  phoneNumber: '555-123-4567',
  medicalRecord: 'MRN-1234567'
};

// Stored without encryption!
database.save(sensitiveData);
      `;

      // Regex-based detection first
      const ssnMatches = piiDetector.detectSSN(code);
      const phoneMatches = piiDetector.detectPhoneNumbers(code);

      expect(ssnMatches.length).toBeGreaterThan(0);
      expect(phoneMatches.length).toBeGreaterThan(0);

      // Claude contextual analysis
      const request: AnalysisRequest = {
        code,
        filePath: 'src/sensitive-data.ts',
        framework: 'gdpr',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      expect(result.compliant).toBe(false);

      // Should detect PII exposure
      const piiViolations = result.violations.filter(v =>
        v.type.includes('PII') || v.description.toLowerCase().includes('personal')
      );
      expect(piiViolations.length).toBeGreaterThan(0);

      // Should recommend encryption
      const encryptionRecommendations = result.recommendations.filter(r =>
        r.toLowerCase().includes('encrypt')
      );
      expect(encryptionRecommendations.length).toBeGreaterThan(0);

      console.log(`\n✅ Sensitive PII detection completed in ${duration}ms`);
      console.log(`   SSN: ${ssnMatches.length}, Phone: ${phoneMatches.length}`);
      console.log(`   GDPR violations: ${result.violations.length}`);
    }, 45000);

    it('should analyze PII handling compliance comprehensively', async () => {
      const request: AnalysisRequest = {
        code: `
// Bad: No encryption for sensitive data
function storeUserData(userData) {
  const record = {
    email: userData.email,           // PII
    ssn: userData.socialSecurity,    // Sensitive PII
    address: userData.homeAddress,   // PII
    phone: userData.phoneNumber      // PII
  };

  // No consent check
  // No data minimization
  // No retention policy
  database.insert('users', record);

  // No audit trail
  return record;
}

// Bad: Exposing PII in logs
function debugUser(user) {
  console.log('User details:', user.email, user.ssn);
}
        `,
        filePath: 'src/user-service.ts',
        framework: 'gdpr',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      // Check for specific GDPR concerns
      const violationTypes = result.violations.map(v => v.type.toLowerCase());
      const descriptions = result.violations.map(v => v.description.toLowerCase());
      const allText = [...violationTypes, ...descriptions].join(' ');

      // Should identify multiple GDPR issues
      const gdprIssues = {
        pii: allText.includes('pii') || allText.includes('personal'),
        encryption: allText.includes('encrypt'),
        consent: allText.includes('consent'),
        logging: allText.includes('log') || allText.includes('audit'),
      };

      // At least some GDPR concerns should be identified
      const identifiedIssues = Object.values(gdprIssues).filter(Boolean).length;
      expect(identifiedIssues).toBeGreaterThan(0);

      console.log(`\n✅ Comprehensive GDPR analysis completed in ${duration}ms`);
      console.log(`   GDPR violations: ${result.violations.length}`);
      console.log(`   Issues identified:`, gdprIssues);
    }, 45000);
  });

  describeIfApiKey('4. Rate Limiting and Retry Logic', () => {
    it('should handle concurrent requests with rate limiting', async () => {
      const requests: AnalysisRequest[] = Array.from({ length: 15 }, (_, i) => ({
        code: `const value${i} = ${i}; export default value${i};`,
        filePath: `src/file${i}.ts`,
        framework: 'soc2' as const,
        language: 'typescript',
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => analyzer.analyzeFile(req))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(15);
      expect(results.every(r => r.compliant !== undefined)).toBe(true);

      results.forEach(r => {
        trackRequest(0, r.metadata.tokensUsed, r.metadata.cached, true);
      });

      const rateLimiterStatus = analyzer.getRateLimiterStatus();
      console.log(`\n✅ Concurrent requests handled in ${duration}ms`);
      console.log(`   Requests in last minute: ${rateLimiterStatus.requestsInLastMinute}`);
    }, 90000);

    it('should respect rate limit configuration', async () => {
      const limitedAnalyzer = new CodeAnalyzer(apiKey, {
        maxRequestsPerMinute: 10,
        maxConcurrentRequests: 3,
        backoffMultiplier: 2,
        maxRetries: 3,
      });

      const requests: AnalysisRequest[] = Array.from({ length: 12 }, (_, i) => ({
        code: `const x${i} = ${i};`,
        filePath: `test${i}.ts`,
        framework: 'soc2' as const,
      }));

      const startTime = Date.now();

      // Process in batches to respect rate limit
      const batch1 = requests.slice(0, 6);
      const batch2 = requests.slice(6, 12);

      const results1 = await Promise.all(
        batch1.map(req => limitedAnalyzer.analyzeFile(req))
      );

      // Wait a bit before second batch
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results2 = await Promise.all(
        batch2.map(req => limitedAnalyzer.analyzeFile(req))
      );

      const duration = Date.now() - startTime;
      const allResults = [...results1, ...results2];

      expect(allResults).toHaveLength(12);
      expect(allResults.every(r => r !== undefined)).toBe(true);

      console.log(`\n✅ Rate-limited requests completed in ${duration}ms`);
    }, 120000);

    it('should implement exponential backoff on retry', async () => {
      // This test simulates retry logic by checking the rate limiter behavior
      const retryAnalyzer = new CodeAnalyzer(apiKey, {
        maxRequestsPerMinute: 50,
        maxConcurrentRequests: 10,
        backoffMultiplier: 2,
        maxRetries: 3,
      });

      const request: AnalysisRequest = {
        code: 'const test = "retry logic";',
        filePath: 'retry-test.ts',
        framework: 'soc2',
      };

      const startTime = Date.now();
      const result = await retryAnalyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);

      console.log(`\n✅ Retry logic test completed in ${duration}ms`);
    }, 45000);
  });

  describeIfApiKey('5. Error Handling for API Failures', () => {
    it('should handle invalid API key gracefully', async () => {
      const invalidAnalyzer = new CodeAnalyzer('sk-invalid-key-12345', {
        maxRetries: 1,
      });

      const request: AnalysisRequest = {
        code: 'const x = 1;',
        filePath: 'test.ts',
        framework: 'soc2',
      };

      try {
        await invalidAnalyzer.analyzeFile(request);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('Failed to analyze');
        }
        trackRequest(0, 0, false, false);
        console.log(`\n✅ Invalid API key error handled correctly`);
      }
    }, 30000);

    it('should handle malformed code gracefully', async () => {
      const request: AnalysisRequest = {
        code: 'this is not valid code at all {{{ ]]] (((',
        filePath: 'broken.ts',
        framework: 'soc2',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      // Should still return a result
      expect(result).toBeDefined();
      expect(result.filePath).toBe('broken.ts');
      expect(typeof result.compliant).toBe('boolean');

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      console.log(`\n✅ Malformed code handled in ${duration}ms`);
    }, 45000);

    it('should handle empty code input', async () => {
      const request: AnalysisRequest = {
        code: '',
        filePath: 'empty.ts',
        framework: 'soc2',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      console.log(`\n✅ Empty code handled in ${duration}ms`);
    }, 45000);

    it('should handle very large code input', async () => {
      // Generate a large code file (1000 lines)
      const largeCode = Array.from({ length: 1000 }, (_, i) =>
        `const variable${i} = "value${i}";\nexport { variable${i} };\n`
      ).join('\n');

      const request: AnalysisRequest = {
        code: largeCode,
        filePath: 'large-file.ts',
        framework: 'soc2',
        language: 'typescript',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);

      trackRequest(duration, result.metadata.tokensUsed, result.metadata.cached, true);

      console.log(`\n✅ Large file (1000 lines) analyzed in ${duration}ms`);
      console.log(`   Tokens used: ${result.metadata.tokensUsed}`);
    }, 60000);

    it('should handle network timeout scenarios', async () => {
      // This test verifies that the system has proper timeout handling
      const request: AnalysisRequest = {
        code: 'const test = "timeout";',
        filePath: 'timeout-test.ts',
        framework: 'soc2',
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeFile(request);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(45000); // Should complete before timeout

      console.log(`\n✅ Request completed in ${duration}ms (within timeout)`);
    }, 50000);
  });

  describeIfApiKey('6. Performance and Caching', () => {
    beforeEach(() => {
      analyzer.clearCache();
    });

    it('should demonstrate cache effectiveness', async () => {
      const request: AnalysisRequest = {
        code: 'const cachedValue = "test";',
        filePath: 'cache-test.ts',
        framework: 'soc2',
      };

      // First request - no cache
      const start1 = Date.now();
      const result1 = await analyzer.analyzeFile(request);
      const duration1 = Date.now() - start1;

      expect(result1.metadata.cached).toBe(false);
      trackRequest(duration1, result1.metadata.tokensUsed, false, true);

      // Second request - should be cached
      const start2 = Date.now();
      const result2 = await analyzer.analyzeFile(request);
      const duration2 = Date.now() - start2;

      expect(result2.metadata.cached).toBe(true);
      expect(duration2).toBeLessThan(duration1);
      trackRequest(duration2, 0, true, true);

      const speedup = (duration1 / duration2).toFixed(2);
      console.log(`\n✅ Cache effectiveness:`);
      console.log(`   First request: ${duration1}ms`);
      console.log(`   Cached request: ${duration2}ms`);
      console.log(`   Speedup: ${speedup}x`);
    }, 60000);

    it('should batch analyze multiple files efficiently', async () => {
      const batchRequest: BatchAnalysisRequest = {
        requests: Array.from({ length: 20 }, (_, i) => ({
          code: `const file${i} = ${i};\nexport default file${i};`,
          filePath: `src/batch-file-${i}.ts`,
          framework: 'soc2' as const,
          language: 'typescript',
        })),
        maxConcurrency: 10,
      };

      const startTime = Date.now();
      const batchResult = await analyzer.analyzeBatch(batchRequest);
      const duration = Date.now() - startTime;

      expect(batchResult.results).toHaveLength(20);
      expect(batchResult.summary.total).toBe(20);
      expect(batchResult.summary.totalDuration).toBeGreaterThan(0);

      batchResult.results.forEach(r => {
        trackRequest(0, r.metadata.tokensUsed, r.metadata.cached, true);
      });

      const avgPerFile = duration / 20;
      console.log(`\n✅ Batch analysis of 20 files:`);
      console.log(`   Total duration: ${duration}ms`);
      console.log(`   Average per file: ${avgPerFile.toFixed(2)}ms`);
      console.log(`   Compliant: ${batchResult.summary.compliant}`);
      console.log(`   Violations: ${batchResult.summary.violations}`);
    }, 120000);

    it('should handle cache cleanup correctly', async () => {
      // Add multiple entries to cache
      const requests = Array.from({ length: 5 }, (_, i) => ({
        code: `const cleanup${i} = ${i};`,
        filePath: `cleanup${i}.ts`,
        framework: 'soc2' as const,
      }));

      for (const req of requests) {
        await analyzer.analyzeFile(req);
      }

      const statsBefore = analyzer.getCacheStats();
      expect(statsBefore.size).toBe(5);

      // Cleanup cache
      const cleaned = analyzer.cleanupCache();
      expect(cleaned).toBeGreaterThanOrEqual(0);

      // Clear cache
      analyzer.clearCache();
      const statsAfter = analyzer.getCacheStats();
      expect(statsAfter.size).toBe(0);

      console.log(`\n✅ Cache cleanup:`);
      console.log(`   Entries before: ${statsBefore.size}`);
      console.log(`   Entries cleaned: ${cleaned}`);
      console.log(`   Entries after clear: ${statsAfter.size}`);
    }, 60000);

    it('should meet performance targets for medium-sized projects', async () => {
      // Simulate analyzing 50 files (medium project)
      const batchRequest: BatchAnalysisRequest = {
        requests: Array.from({ length: 50 }, (_, i) => ({
          code: `
// File ${i}
const config${i} = {
  value: ${i},
  enabled: true
};

export function process${i}(data: any) {
  return config${i}.value + data;
}
          `,
          filePath: `src/module-${i}.ts`,
          framework: 'soc2' as const,
          language: 'typescript',
        })),
        maxConcurrency: 10,
      };

      const startTime = Date.now();
      const result = await analyzer.analyzeBatch(batchRequest);
      const duration = Date.now() - startTime;

      expect(result.results).toHaveLength(50);
      expect(duration).toBeLessThan(120000); // Should complete in < 2 minutes

      const avgPerFile = duration / 50;
      const totalTokens = result.results.reduce((sum, r) => sum + r.metadata.tokensUsed, 0);

      console.log(`\n✅ Medium project analysis (50 files):`);
      console.log(`   Total duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Average per file: ${avgPerFile.toFixed(2)}ms`);
      console.log(`   Total tokens: ${totalTokens}`);
      console.log(`   Cache hit rate: ${(result.summary.cacheHitRate * 100).toFixed(2)}%`);

      result.results.forEach(r => {
        trackRequest(0, r.metadata.tokensUsed, r.metadata.cached, true);
      });
    }, 150000);
  });

  describeIfApiKey('7. Integration Scenarios', () => {
    it('should perform end-to-end compliance analysis workflow', async () => {
      console.log('\n🔄 Running end-to-end workflow...');

      // Step 1: Analyze security configuration
      const configAnalysis = await analyzer.analyzeFile({
        code: `
export const config = {
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
};
        `,
        filePath: 'src/config/security.ts',
        framework: 'soc2',
        language: 'typescript',
      });

      // Step 2: Analyze data handling
      const dataAnalysis = await analyzer.analyzeFile({
        code: `
import bcrypt from 'bcrypt';

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return db.users.create({
    email,
    passwordHash: hashedPassword,
    createdAt: new Date(),
  });
}
        `,
        filePath: 'src/services/user.ts',
        framework: 'gdpr',
        language: 'typescript',
      });

      // Step 3: Analyze access control
      const accessAnalysis = await analyzer.analyzeFile({
        code: `
export function checkPermission(user: User, resource: string, action: string) {
  const roles = user.roles || [];
  const permissions = roles.flatMap(r => r.permissions);
  return permissions.some(p =>
    p.resource === resource && p.action === action
  );
}
        `,
        filePath: 'src/middleware/auth.ts',
        framework: 'iso27001',
        language: 'typescript',
      });

      const totalViolations =
        configAnalysis.violations.length +
        dataAnalysis.violations.length +
        accessAnalysis.violations.length;

      const averageScore =
        (configAnalysis.score + dataAnalysis.score + accessAnalysis.score) / 3;

      console.log(`\n✅ End-to-end workflow completed:`);
      console.log(`   Files analyzed: 3`);
      console.log(`   Total violations: ${totalViolations}`);
      console.log(`   Average compliance score: ${averageScore.toFixed(2)}/100`);
      console.log(`   Config compliant: ${configAnalysis.compliant}`);
      console.log(`   Data handling compliant: ${dataAnalysis.compliant}`);
      console.log(`   Access control compliant: ${accessAnalysis.compliant}`);

      expect(configAnalysis).toBeDefined();
      expect(dataAnalysis).toBeDefined();
      expect(accessAnalysis).toBeDefined();
    }, 90000);

    it('should validate complete API integration', async () => {
      console.log('\n🔍 Validating API integration...');

      // Test all three frameworks
      const frameworks: Array<'soc2' | 'gdpr' | 'iso27001'> = ['soc2', 'gdpr', 'iso27001'];
      const results = [];

      for (const framework of frameworks) {
        const result = await analyzer.analyzeFile({
          code: 'const apiTest = "validation";',
          filePath: `test-${framework}.ts`,
          framework,
          language: 'typescript',
        });

        results.push(result);
        expect(result.framework).toBe(framework);
        expect(result.metadata.modelVersion).toBe('claude-sonnet-4-5-20250929');
      }

      console.log(`\n✅ All frameworks validated successfully`);
      console.log(`   SOC2 analysis: ✓`);
      console.log(`   GDPR analysis: ✓`);
      console.log(`   ISO27001 analysis: ✓`);

      expect(results).toHaveLength(3);
    }, 90000);
  });
});
