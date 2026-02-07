"use strict";
/**
 * Usage examples for CodeAnalyzer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.example1_detectHardcodedSecrets = example1_detectHardcodedSecrets;
exports.example2_detectPII = example2_detectPII;
exports.example3_batchAnalysis = example3_batchAnalysis;
exports.example4_cacheDemo = example4_cacheDemo;
exports.example5_errorHandling = example5_errorHandling;
exports.example6_multiFramework = example6_multiFramework;
exports.example7_performanceBenchmark = example7_performanceBenchmark;
exports.runAllExamples = runAllExamples;
const code_analyzer_1 = require("./code-analyzer");
// Initialize analyzer
const analyzer = new code_analyzer_1.CodeAnalyzer(process.env.ANTHROPIC_API_KEY);
/**
 * Example 1: Analyze single file for hardcoded secrets (SOC2)
 */
async function example1_detectHardcodedSecrets() {
    console.log('Example 1: Detecting hardcoded secrets...\n');
    const request = {
        code: `
const config = {
  apiKey: "sk-1234567890abcdef",
  password: "MySecretPassword123!",
  databaseUrl: "postgresql://admin:password@localhost/db"
};

export default config;
    `,
        filePath: 'src/config.ts',
        framework: 'soc2',
        language: 'typescript',
        context: 'Configuration file for production application',
    };
    const result = await analyzer.analyzeFile(request);
    console.log(`File: ${result.filePath}`);
    console.log(`Compliant: ${result.compliant}`);
    console.log(`Score: ${result.score}/100`);
    console.log(`\nViolations (${result.violations.length}):`);
    result.violations.forEach((v) => {
        console.log(`  - [${v.severity.toUpperCase()}] ${v.type}: ${v.description}`);
        console.log(`    Recommendation: ${v.recommendation}`);
    });
    console.log(`\nGeneral Recommendations:`);
    result.recommendations.forEach((r) => console.log(`  - ${r}`));
    console.log(`\nTokens used: ${result.metadata.tokensUsed}`);
    console.log(`Duration: ${result.metadata.duration}ms\n`);
}
/**
 * Example 2: Analyze for PII exposure (GDPR)
 */
async function example2_detectPII() {
    console.log('Example 2: Detecting PII exposure...\n');
    const request = {
        code: `
interface User {
  email: string;
  ssn: string;
  phoneNumber: string;
  address: string;
}

function createUser(data: User) {
  // Storing PII without encryption
  database.insert('users', {
    email: data.email,
    ssn: data.ssn,
    phone: data.phoneNumber,
    address: data.address,
  });

  // Logging PII
  console.log('Created user:', data);

  return { success: true };
}
    `,
        filePath: 'src/user-service.ts',
        framework: 'gdpr',
        language: 'typescript',
    };
    const result = await analyzer.analyzeFile(request);
    console.log(`GDPR Compliance Analysis`);
    console.log(`Status: ${result.compliant ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Score: ${result.score}/100`);
    if (result.violations.length > 0) {
        console.log(`\nPII-Related Violations:`);
        result.violations
            .filter((v) => v.type.includes('PII'))
            .forEach((v) => {
            console.log(`  ${v.severity.toUpperCase()}: ${v.description}`);
            console.log(`  Fix: ${v.recommendation}\n`);
        });
    }
}
/**
 * Example 3: Batch analysis of multiple files
 */
async function example3_batchAnalysis() {
    console.log('Example 3: Batch analysis of multiple files...\n');
    const files = [
        {
            code: 'const apiKey = process.env.API_KEY;',
            filePath: 'src/secure-config.ts',
            framework: 'soc2',
        },
        {
            code: 'const password = "hardcoded";',
            filePath: 'src/insecure-config.ts',
            framework: 'soc2',
        },
        {
            code: 'import bcrypt from "bcrypt"; async function hash(pwd) { return bcrypt.hash(pwd, 10); }',
            filePath: 'src/crypto.ts',
            framework: 'iso27001',
        },
    ];
    const batchRequest = {
        requests: files,
        maxConcurrency: 3,
    };
    const startTime = Date.now();
    const result = await analyzer.analyzeBatch(batchRequest);
    const duration = Date.now() - startTime;
    console.log('Batch Analysis Summary:');
    console.log(`  Total files: ${result.summary.total}`);
    console.log(`  Compliant: ${result.summary.compliant}`);
    console.log(`  Violations: ${result.summary.violations}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Cache hit rate: ${(result.summary.cacheHitRate * 100).toFixed(1)}%`);
    console.log('\nResults by file:');
    result.results.forEach((r) => {
        const status = r.compliant ? '✓' : '✗';
        console.log(`  ${status} ${r.filePath} (score: ${r.score}/100)`);
    });
}
/**
 * Example 4: Cache effectiveness demonstration
 */
async function example4_cacheDemo() {
    console.log('Example 4: Cache effectiveness...\n');
    const request = {
        code: 'const x = 1;',
        filePath: 'test.ts',
        framework: 'soc2',
    };
    // First request (no cache)
    console.log('First request (no cache)...');
    const start1 = Date.now();
    const result1 = await analyzer.analyzeFile(request);
    const duration1 = Date.now() - start1;
    console.log(`Duration: ${duration1}ms`);
    console.log(`Cached: ${result1.metadata.cached}`);
    // Second request (cached)
    console.log('\nSecond request (should be cached)...');
    const start2 = Date.now();
    const result2 = await analyzer.analyzeFile(request);
    const duration2 = Date.now() - start2;
    console.log(`Duration: ${duration2}ms`);
    console.log(`Cached: ${result2.metadata.cached}`);
    const speedup = (duration1 / duration2).toFixed(2);
    console.log(`\nSpeedup: ${speedup}x faster with cache`);
    // Cache stats
    const stats = analyzer.getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`  Size: ${stats.size}/${stats.maxSize}`);
    console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
}
/**
 * Example 5: Error handling and retries
 */
async function example5_errorHandling() {
    console.log('Example 5: Error handling demonstration...\n');
    // Analyzer with aggressive rate limiting (to trigger retries)
    const limitedAnalyzer = new code_analyzer_1.CodeAnalyzer(process.env.ANTHROPIC_API_KEY, {
        maxRequestsPerMinute: 10,
        maxConcurrentRequests: 2,
        maxRetries: 3,
    });
    const requests = Array.from({ length: 15 }, (_, i) => ({
        code: `const value${i} = ${i};`,
        filePath: `file${i}.ts`,
        framework: 'soc2',
    }));
    console.log('Sending 15 requests with max 10/minute rate limit...');
    console.log('This will trigger rate limiting and retries.\n');
    try {
        const startTime = Date.now();
        const results = await Promise.all(requests.map(async (req) => {
            try {
                return await limitedAnalyzer.analyzeFile(req);
            }
            catch (error) {
                console.error(`Failed to analyze ${req.filePath}:`, error);
                return null;
            }
        }));
        const duration = Date.now() - startTime;
        const successful = results.filter((r) => r !== null).length;
        console.log(`\nCompleted in ${duration}ms`);
        console.log(`Successful: ${successful}/${requests.length}`);
        console.log('All requests completed despite rate limiting!');
    }
    catch (error) {
        console.error('Batch failed:', error);
    }
}
/**
 * Example 6: Multi-framework analysis
 */
async function example6_multiFramework() {
    console.log('Example 6: Multi-framework analysis...\n');
    const codeToAnalyze = `
import crypto from 'crypto';

interface UserData {
  email: string;
  password: string;
  creditCard: string;
}

function storeUser(user: UserData) {
  // No encryption
  db.users.insert(user);

  // Log sensitive data
  logger.info('User stored:', user);

  return { success: true };
}
  `;
    const frameworks = ['soc2', 'gdpr', 'iso27001'];
    console.log('Analyzing same code against all frameworks...\n');
    for (const framework of frameworks) {
        const result = await analyzer.analyzeFile({
            code: codeToAnalyze,
            filePath: 'src/user.ts',
            framework,
            language: 'typescript',
        });
        console.log(`${framework.toUpperCase()}:`);
        console.log(`  Compliant: ${result.compliant ? 'YES' : 'NO'}`);
        console.log(`  Score: ${result.score}/100`);
        console.log(`  Violations: ${result.violations.length}`);
        if (result.violations.length > 0) {
            console.log('  Top violations:');
            result.violations.slice(0, 2).forEach((v) => {
                console.log(`    - ${v.type}: ${v.description}`);
            });
        }
        console.log('');
    }
}
/**
 * Example 7: Performance benchmark
 */
async function example7_performanceBenchmark() {
    console.log('Example 7: Performance benchmark (100 files)...\n');
    const files = Array.from({ length: 100 }, (_, i) => ({
        code: `
// File ${i}
const value = ${i};
export function process() {
  return value * 2;
}
    `,
        filePath: `src/file-${i}.ts`,
        framework: 'soc2',
    }));
    const concurrencyLevels = [1, 5, 10, 20];
    console.log('Testing different concurrency levels:\n');
    for (const concurrency of concurrencyLevels) {
        const startTime = Date.now();
        const result = await analyzer.analyzeBatch({
            requests: files,
            maxConcurrency: concurrency,
        });
        const duration = Date.now() - startTime;
        const throughput = (100 / (duration / 1000)).toFixed(2);
        console.log(`Concurrency: ${concurrency}`);
        console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`  Throughput: ${throughput} files/sec`);
        console.log(`  Cache hit rate: ${(result.summary.cacheHitRate * 100).toFixed(1)}%\n`);
        // Clear cache between runs for fair comparison
        analyzer.clearCache();
    }
}
/**
 * Run all examples
 */
async function runAllExamples() {
    try {
        await example1_detectHardcodedSecrets();
        console.log('\n' + '='.repeat(80) + '\n');
        await example2_detectPII();
        console.log('\n' + '='.repeat(80) + '\n');
        await example3_batchAnalysis();
        console.log('\n' + '='.repeat(80) + '\n');
        await example4_cacheDemo();
        console.log('\n' + '='.repeat(80) + '\n');
        await example5_errorHandling();
        console.log('\n' + '='.repeat(80) + '\n');
        await example6_multiFramework();
        console.log('\n' + '='.repeat(80) + '\n');
        await example7_performanceBenchmark();
    }
    catch (error) {
        console.error('Example failed:', error);
    }
}
// Run if executed directly
if (require.main === module) {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Error: ANTHROPIC_API_KEY environment variable is required');
        console.error('Usage: ANTHROPIC_API_KEY=your_key ts-node examples.ts');
        process.exit(1);
    }
    runAllExamples().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=examples.js.map