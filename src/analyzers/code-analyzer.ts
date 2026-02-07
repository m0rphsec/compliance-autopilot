/**
 * Claude Sonnet 4.5 Code Analyzer
 * Smart prompting, rate limiting, retry logic, caching, and cost optimization
 */

import { Anthropic } from '@anthropic-ai/sdk';
import {
  AnalysisRequest,
  AnalysisResponse,
  BatchAnalysisRequest,
  BatchAnalysisResponse,
  Violation,
  RateLimitConfig,
} from '../types/analyzer';
import { ResponseCache } from '../utils/cache';
import { RateLimiter } from '../utils/rate-limiter';

export class CodeAnalyzer {
  private client: Anthropic;
  private cache: ResponseCache;
  private rateLimiter: RateLimiter;
  private modelVersion = 'claude-sonnet-4-5-20250929';

  constructor(
    apiKey: string,
    rateLimitConfig?: Partial<RateLimitConfig>,
    cacheConfig?: { maxSize?: number; ttlMs?: number }
  ) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({ apiKey });
    this.cache = new ResponseCache(cacheConfig?.maxSize, cacheConfig?.ttlMs);
    this.rateLimiter = new RateLimiter(rateLimitConfig);
  }

  /**
   * Analyze a single file for compliance violations
   */
  async analyzeFile(request: AnalysisRequest): Promise<AnalysisResponse> {
    // Check cache first
    const cached = this.cache.get(request.code, request.framework);
    if (cached) {
      console.log(`Cache hit for ${request.filePath}`);
      return cached;
    }

    const startTime = Date.now();
    const prompt = this.buildPrompt(request);

    try {
      const response = await this.rateLimiter.execute(() => this.callClaude(prompt));

      const analysis = this.parseResponse(response, request);
      const duration = Date.now() - startTime;

      const result: AnalysisResponse = {
        ...analysis,
        filePath: request.filePath,
        framework: request.framework,
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          cached: false,
          modelVersion: this.modelVersion,
        },
      };

      // Cache the result
      this.cache.set(request.code, request.framework, result);

      return result;
    } catch (error) {
      console.error(`Analysis failed for ${request.filePath}:`, error);
      throw new Error(
        `Failed to analyze ${request.filePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Analyze multiple files in parallel with batching
   */
  async analyzeBatch(batchRequest: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const startTime = Date.now();
    const maxConcurrency = batchRequest.maxConcurrency || 10;
    const results: AnalysisResponse[] = [];

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < batchRequest.requests.length; i += maxConcurrency) {
      const batch = batchRequest.requests.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map((request) => this.analyzeFile(request)));
      results.push(...batchResults);
    }

    const totalDuration = Date.now() - startTime;
    const compliantCount = results.filter((r) => r.compliant).length;
    const violationCount = results.filter((r) => !r.compliant).length;
    const cacheHits = results.filter((r) => r.metadata.cached).length;

    return {
      results,
      summary: {
        total: results.length,
        compliant: compliantCount,
        violations: violationCount,
        totalDuration,
        cacheHitRate: cacheHits / results.length,
      },
    };
  }

  /**
   * Build optimized prompt for Claude
   */
  private buildPrompt(request: AnalysisRequest): string {
    const frameworkPrompts = {
      soc2: this.buildSOC2Prompt(request),
      gdpr: this.buildGDPRPrompt(request),
      iso27001: this.buildISO27001Prompt(request),
    };

    return frameworkPrompts[request.framework];
  }

  /**
   * Build SOC2-specific prompt
   */
  private buildSOC2Prompt(request: AnalysisRequest): string {
    return `Analyze this code for SOC2 compliance violations.

File: ${request.filePath}
${request.language ? `Language: ${request.language}` : ''}
${request.context ? `Context: ${request.context}` : ''}

Code:
\`\`\`
${request.code}
\`\`\`

Check for:
1. Lack of code review enforcement (CC1.1)
2. Missing deployment controls (CC6.1)
3. Inadequate access controls (CC6.6)
4. Missing monitoring/logging (CC7.1)
5. Poor change management (CC7.2)
6. Unaddressed security vulnerabilities (CC8.1)

Return a JSON response with this exact structure:
{
  "compliant": boolean,
  "score": number (0-100),
  "violations": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "type": "string (control ID like CC1.1)",
      "description": "string",
      "lineNumbers": [number],
      "codeSnippet": "string (optional)",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string"]
}

Be concise and specific. Focus on actual compliance issues, not style preferences.`;
  }

  /**
   * Build GDPR-specific prompt
   */
  private buildGDPRPrompt(request: AnalysisRequest): string {
    return `Analyze this code for GDPR compliance violations.

File: ${request.filePath}
${request.language ? `Language: ${request.language}` : ''}
${request.context ? `Context: ${request.context}` : ''}

Code:
\`\`\`
${request.code}
\`\`\`

Check for:
1. PII handling (emails, names, SSNs, phone numbers, addresses)
2. Missing encryption for sensitive data
3. Lack of consent mechanisms
4. Missing data retention policies
5. No right to deletion implementation
6. Inadequate data minimization
7. Missing privacy by design principles

Return a JSON response with this exact structure:
{
  "compliant": boolean,
  "score": number (0-100),
  "violations": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "type": "string (e.g., 'PII_EXPOSURE', 'NO_ENCRYPTION')",
      "description": "string",
      "lineNumbers": [number],
      "codeSnippet": "string (optional)",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string"]
}

Be specific about what PII is exposed and how to fix it.`;
  }

  /**
   * Build ISO27001-specific prompt
   */
  private buildISO27001Prompt(request: AnalysisRequest): string {
    return `Analyze this code for ISO 27001 compliance violations.

File: ${request.filePath}
${request.language ? `Language: ${request.language}` : ''}
${request.context ? `Context: ${request.context}` : ''}

Code:
\`\`\`
${request.code}
\`\`\`

Check for:
1. Inadequate access control (A.9)
2. Missing cryptographic controls (A.10)
3. Poor physical security considerations (A.11)
4. Inadequate operational security (A.12)
5. Missing communications security (A.13)
6. Lack of security incident management (A.16)
7. Missing business continuity measures (A.17)

Return a JSON response with this exact structure:
{
  "compliant": boolean,
  "score": number (0-100),
  "violations": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "type": "string (control ID like A.9.1)",
      "description": "string",
      "lineNumbers": [number],
      "codeSnippet": "string (optional)",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string"]
}

Focus on security controls and operational practices.`;
  }

  /**
   * Call Claude API with optimized settings
   */
  private async callClaude(prompt: string): Promise<Anthropic.Message> {
    try {
      const message = await this.client.messages.create({
        model: this.modelVersion,
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature for consistent, focused analysis
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return message;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        console.error('Claude API error:', {
          status: error.status,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Parse Claude response into structured format
   */
  private parseResponse(
    message: Anthropic.Message,
    _request: AnalysisRequest
  ): Omit<AnalysisResponse, 'filePath' | 'framework' | 'metadata'> {
    try {
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = content.text.trim();
      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText);

      // Validate response structure
      if (
        typeof parsed.compliant !== 'boolean' ||
        typeof parsed.score !== 'number' ||
        !Array.isArray(parsed.violations) ||
        !Array.isArray(parsed.recommendations)
      ) {
        throw new Error('Invalid response structure from Claude');
      }

      return {
        compliant: parsed.compliant,
        score: parsed.score,
        violations: parsed.violations as Violation[],
        recommendations: parsed.recommendations,
      };
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      // Return safe fallback
      return {
        compliant: false,
        score: 0,
        violations: [
          {
            severity: 'high',
            type: 'PARSE_ERROR',
            description: 'Failed to parse analysis response',
            recommendation: 'Manual review required. The automated analysis could not complete.',
          },
        ],
        recommendations: ['Manually review this file for compliance issues'],
      };
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return this.cache.getStats();
  }

  /**
   * Get rate limiter status
   */
  getRateLimiterStatus(): {
    activeRequests: number;
    queuedRequests: number;
    requestsInLastMinute: number;
  } {
    return this.rateLimiter.getStatus();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    return this.cache.cleanup();
  }
}
