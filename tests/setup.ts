/**
 * Jest setup file
 * Runs before all tests to configure global test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GITHUB_TOKEN = 'test-github-token';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error, // Keep errors visible
};

// Set reasonable timeouts for async operations
jest.setTimeout(30000);

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        delay: (ms: number) => Promise<void>;
        mockGitHubResponse: (data: any) => Promise<any>;
        mockClaudeResponse: (data: any) => Promise<any>;
      };
    }
  }
}

(global as any).testUtils = {
  delay: (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  mockGitHubResponse: async (data: any): Promise<any> => ({
    status: 200,
    data,
    headers: {
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4999',
      'x-ratelimit-reset': Date.now() + 3600000,
    },
  }),

  mockClaudeResponse: async (data: any): Promise<any> => ({
    id: 'test-message-id',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: JSON.stringify(data) }],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 200 },
  }),
};
