/**
 * Unit tests for CodeAnalyzer
 * Tests with mock Claude responses for isolated testing
 */

import { CodeAnalyzer } from '../../../src/analyzers/code-analyzer';
import { AnalysisRequest, BatchAnalysisRequest } from '../../../src/types/analyzer';
import Anthropic from '@anthropic-ai/sdk';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock
    mockCreate = jest.fn();
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    } as any));

    analyzer = new CodeAnalyzer('test-api-key');
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => new CodeAnalyzer('')).toThrow('Anthropic API key is required');
    });

    it('should initialize with custom rate limit config', () => {
      const customAnalyzer = new CodeAnalyzer('test-key', {
        maxRequestsPerMinute: 100,
        maxConcurrentRequests: 20,
      });
      expect(customAnalyzer).toBeInstanceOf(CodeAnalyzer);
    });

    it('should initialize with custom cache config', () => {
      const customAnalyzer = new CodeAnalyzer(
        'test-key',
        {},
        { maxSize: 500, ttlMs: 1800000 }
      );
      expect(customAnalyzer).toBeInstanceOf(CodeAnalyzer);
    });
  });

  describe('analyzeFile', () => {
    const validRequest: AnalysisRequest = {
      code: 'const password = "hardcoded123";',
      filePath: 'test.ts',
      framework: 'soc2',
      language: 'typescript',
    };

    const mockClaudeResponse: Partial<Anthropic.Message> = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            compliant: false,
            score: 35,
            violations: [
              {
                severity: 'critical',
                type: 'CC6.6',
                description: 'Hardcoded password detected',
                lineNumbers: [1],
                codeSnippet: 'const password = "hardcoded123";',
                recommendation: 'Use environment variables for sensitive data',
              },
            ],
            recommendations: ['Store secrets in environment variables', 'Use a secrets manager'],
          }),
        },
      ],
      usage: {
        input_tokens: 150,
        output_tokens: 80,
      },
    } as Anthropic.Message;

    it('should analyze SOC2 compliance', async () => {
      mockCreate.mockResolvedValue(mockClaudeResponse);

      const result = await analyzer.analyzeFile(validRequest);

      expect(result).toMatchObject({
        filePath: 'test.ts',
        framework: 'soc2',
        compliant: false,
        score: 35,
        violations: expect.arrayContaining([
          expect.objectContaining({
            severity: 'critical',
            type: 'CC6.6',
          }),
        ]),
      });
      expect(result.metadata.tokensUsed).toBe(230);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should analyze GDPR compliance', async () => {
      mockCreate.mockResolvedValue({
        ...mockClaudeResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compliant: false,
              score: 40,
              violations: [
                {
                  severity: 'high',
                  type: 'PII_EXPOSURE',
                  description: 'Email address exposed without encryption',
                  recommendation: 'Encrypt PII data at rest',
                },
              ],
              recommendations: ['Implement encryption for PII'],
            }),
          },
        ],
      });

      const gdprRequest: AnalysisRequest = {
        ...validRequest,
        framework: 'gdpr',
        code: 'const email = "user@example.com";',
      };

      const result = await analyzer.analyzeFile(gdprRequest);

      expect(result.framework).toBe('gdpr');
      expect(result.violations[0].type).toBe('PII_EXPOSURE');
    });

    it('should analyze ISO27001 compliance', async () => {
      mockCreate.mockResolvedValue({
        ...mockClaudeResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compliant: true,
              score: 95,
              violations: [],
              recommendations: ['Continue following security best practices'],
            }),
          },
        ],
      });

      const isoRequest: AnalysisRequest = {
        ...validRequest,
        framework: 'iso27001',
      };

      const result = await analyzer.analyzeFile(isoRequest);

      expect(result.framework).toBe('iso27001');
      expect(result.compliant).toBe(true);
      expect(result.score).toBe(95);
    });

    it('should use cache for identical requests', async () => {
      mockCreate.mockResolvedValue(mockClaudeResponse);

      // First call
      await analyzer.analyzeFile(validRequest);
      expect(mockCreate).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await analyzer.analyzeFile(validRequest);
      expect(mockCreate).toHaveBeenCalledTimes(1); // Still 1
      expect(result.metadata.cached).toBe(true);
    });

    it('should handle Claude API errors gracefully', async () => {
      mockCreate.mockRejectedValue(
        new Anthropic.APIError(
          429,
          { type: 'rate_limit_error', message: 'Rate limit exceeded' },
          'Rate limit exceeded',
          {}
        )
      );

      await expect(analyzer.analyzeFile(validRequest)).rejects.toThrow(
        'Failed to analyze test.ts'
      );
    });

    it('should handle malformed JSON responses', async () => {
      mockCreate.mockResolvedValue({
        ...mockClaudeResponse,
        content: [{ type: 'text', text: 'Not valid JSON' }],
      });

      const result = await analyzer.analyzeFile(validRequest);

      expect(result.compliant).toBe(false);
      expect(result.violations[0].type).toBe('PARSE_ERROR');
    });

    it('should extract JSON from markdown code blocks', async () => {
      mockCreate.mockResolvedValue({
        ...mockClaudeResponse,
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify({
              compliant: true,
              score: 100,
              violations: [],
              recommendations: [],
            }) + '\n```',
          },
        ],
      });

      const result = await analyzer.analyzeFile(validRequest);

      expect(result.compliant).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe('analyzeBatch', () => {
    const batchRequest: BatchAnalysisRequest = {
      requests: [
        {
          code: 'const x = 1;',
          filePath: 'file1.ts',
          framework: 'soc2',
        },
        {
          code: 'const y = 2;',
          filePath: 'file2.ts',
          framework: 'gdpr',
        },
        {
          code: 'const z = 3;',
          filePath: 'file3.ts',
          framework: 'iso27001',
        },
      ],
      maxConcurrency: 2,
    };

    const mockClaudeResponse: Partial<Anthropic.Message> = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            compliant: true,
            score: 100,
            violations: [],
            recommendations: [],
          }),
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50 },
    } as Anthropic.Message;

    it('should analyze multiple files in parallel', async () => {
      mockCreate.mockResolvedValue(mockClaudeResponse);

      const result = await analyzer.analyzeBatch(batchRequest);

      expect(result.results).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.compliant).toBe(3);
      expect(result.summary.violations).toBe(0);
    });

    it('should respect max concurrency', async () => {
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      mockCreate.mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise((resolve) => setTimeout(resolve, 50));
        concurrentCalls--;
        return mockClaudeResponse;
      });

      await analyzer.analyzeBatch(batchRequest);

      expect(maxConcurrent).toBeLessThanOrEqual(2); // maxConcurrency set to 2
    });

    it('should calculate cache hit rate', async () => {
      mockCreate.mockResolvedValue(mockClaudeResponse);

      // First batch
      await analyzer.analyzeBatch(batchRequest);

      // Second batch with same requests (should hit cache)
      const result = await analyzer.analyzeBatch(batchRequest);

      expect(result.summary.cacheHitRate).toBeGreaterThan(0);
    });

    it('should handle mixed compliant and non-compliant results', async () => {
      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        return {
          ...mockClaudeResponse,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                compliant: callCount % 2 === 0, // Alternate compliant/non-compliant
                score: callCount % 2 === 0 ? 100 : 50,
                violations: callCount % 2 === 0 ? [] : [
                  {
                    severity: 'medium',
                    type: 'TEST',
                    description: 'Test violation',
                    recommendation: 'Fix it',
                  },
                ],
                recommendations: [],
              }),
            },
          ],
        };
      });

      const result = await analyzer.analyzeBatch(batchRequest);

      expect(result.summary.compliant).toBeGreaterThan(0);
      expect(result.summary.violations).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should handle large batches efficiently', async () => {
      const largeBatch: BatchAnalysisRequest = {
        requests: Array.from({ length: 100 }, (_, i) => ({
          code: `const x${i} = ${i};`,
          filePath: `file${i}.ts`,
          framework: 'soc2' as const,
        })),
        maxConcurrency: 10,
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compliant: true,
              score: 100,
              violations: [],
              recommendations: [],
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      } as Anthropic.Message);

      const startTime = Date.now();
      const result = await analyzer.analyzeBatch(largeBatch);
      const duration = Date.now() - startTime;

      expect(result.results).toHaveLength(100);
      expect(duration).toBeLessThan(60000); // Should complete in less than 60 seconds
    }, 70000); // Extend test timeout
  });

  describe('cache operations', () => {
    it('should get cache statistics', () => {
      const stats = analyzer.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should clear cache', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compliant: true,
              score: 100,
              violations: [],
              recommendations: [],
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      } as Anthropic.Message);

      const request: AnalysisRequest = {
        code: 'const x = 1;',
        filePath: 'test.ts',
        framework: 'soc2',
      };

      // Populate cache
      await analyzer.analyzeFile(request);
      let stats = analyzer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache
      analyzer.clearCache();
      stats = analyzer.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should cleanup expired entries', async () => {
      // Create analyzer with very short TTL for testing
      const shortTtlAnalyzer = new CodeAnalyzer('test-key', {}, { ttlMs: 100 });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compliant: true,
              score: 100,
              violations: [],
              recommendations: [],
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      } as Anthropic.Message);

      const request: AnalysisRequest = {
        code: 'const x = 1;',
        filePath: 'test.ts',
        framework: 'soc2',
      };

      await shortTtlAnalyzer.analyzeFile(request);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const removed = shortTtlAnalyzer.cleanupCache();
      expect(removed).toBeGreaterThan(0);
    });
  });

  describe('rate limiter', () => {
    it('should get rate limiter status', () => {
      const status = analyzer.getRateLimiterStatus();

      expect(status).toHaveProperty('activeRequests');
      expect(status).toHaveProperty('queuedRequests');
      expect(status).toHaveProperty('requestsInLastMinute');
    });

    it('should handle rate limit errors with retry', async () => {
      let attempts = 0;
      mockCreate.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Anthropic.APIError(
            429,
            { type: 'rate_limit_error', message: 'Rate limit exceeded' },
            'Rate limit exceeded',
            {}
          );
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                compliant: true,
                score: 100,
                violations: [],
                recommendations: [],
              }),
            },
          ],
          usage: { input_tokens: 100, output_tokens: 50 },
        } as Anthropic.Message;
      });

      const request: AnalysisRequest = {
        code: 'const x = 1;',
        filePath: 'test.ts',
        framework: 'soc2',
      };

      const result = await analyzer.analyzeFile(request);

      expect(attempts).toBe(3); // Should retry twice then succeed
      expect(result.compliant).toBe(true);
    });
  });
});
