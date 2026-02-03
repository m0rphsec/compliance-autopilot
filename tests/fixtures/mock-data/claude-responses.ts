/**
 * Mock Claude API responses for testing
 */

export const mockGDPRAnalysisClean = {
  has_pii: false,
  pii_types: [],
  collection_methods: [],
  encryption_transit: true,
  encryption_rest: true,
  consent_mechanism: true,
  retention_policy: true,
  deletion_capability: true,
  gdpr_compliant: true,
  violations: [],
  recommendations: ['Continue following GDPR best practices'],
};

export const mockGDPRAnalysisViolations = {
  has_pii: true,
  pii_types: ['email', 'ssn', 'phone'],
  collection_methods: ['form input', 'API'],
  encryption_transit: false,
  encryption_rest: false,
  consent_mechanism: false,
  retention_policy: false,
  deletion_capability: false,
  gdpr_compliant: false,
  violations: [
    'Hardcoded email addresses found',
    'SSN stored in plain text',
    'HTTP used for sensitive data transmission',
    'No consent mechanism detected',
    'No data retention policy',
    'No deletion endpoint found',
  ],
  recommendations: [
    'Remove hardcoded PII from code',
    'Encrypt all PII at rest',
    'Use HTTPS for all API calls',
    'Implement consent collection UI',
    'Add TTL/expiration to stored data',
    'Create DELETE endpoint for user data',
  ],
};

export const mockSOC2Analysis = {
  controls_checked: [
    {
      control: 'CC1.1',
      status: 'PASS',
      evidence: 'PR has 2 approvals',
    },
    {
      control: 'CC6.1',
      status: 'PASS',
      evidence: 'Deployments automated via GitHub Actions',
    },
    {
      control: 'CC6.6',
      status: 'FAIL',
      evidence: 'Too many admin users (40%)',
      recommendation: 'Reduce admin access to <20% of users',
    },
  ],
  overall_compliant: false,
  summary: '2 of 3 controls passed',
};

export const mockISO27001Analysis = {
  controls_checked: [
    {
      control: 'A.9.2.1',
      title: 'User registration and de-registration',
      status: 'PASS',
    },
    {
      control: 'A.10.1.1',
      title: 'Policy on the use of cryptographic controls',
      status: 'FAIL',
      violation: 'HTTP used instead of HTTPS',
    },
  ],
  overall_compliant: false,
};

export const mockCodeAnalysisSecure = {
  security_issues: [],
  has_vulnerabilities: false,
  encryption_used: true,
  secure_protocols: true,
  input_validation: true,
  recommendations: [],
};

export const mockCodeAnalysisInsecure = {
  security_issues: [
    {
      type: 'SQL Injection',
      severity: 'CRITICAL',
      line: 42,
      description: 'Raw SQL query with user input',
    },
    {
      type: 'XSS',
      severity: 'HIGH',
      line: 78,
      description: 'Unescaped user input in HTML',
    },
  ],
  has_vulnerabilities: true,
  encryption_used: false,
  secure_protocols: false,
  input_validation: false,
  recommendations: [
    'Use parameterized queries',
    'Escape all user input before rendering',
    'Enable HTTPS',
    'Validate and sanitize all inputs',
  ],
};

export const mockClaudeError = {
  error: {
    type: 'rate_limit_error',
    message: 'Rate limit exceeded',
  },
};

export const mockClaudeAuthError = {
  error: {
    type: 'authentication_error',
    message: 'Invalid API key',
  },
};

export const mockClaudeTimeout = {
  error: {
    type: 'timeout_error',
    message: 'Request timed out',
  },
};

export const mockClaudeResponseFormat = {
  id: 'msg_123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: JSON.stringify(mockGDPRAnalysisClean),
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 1500,
    output_tokens: 800,
  },
};

export const mockClaudeStreamChunk = {
  type: 'content_block_delta',
  delta: {
    type: 'text_delta',
    text: '{"has_pii": false',
  },
};
