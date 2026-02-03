/**
 * Mock GitHub API responses for testing
 */

export const mockPullRequest = {
  id: 1,
  number: 123,
  state: 'open',
  title: 'Test PR',
  user: { login: 'developer1' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  head: { sha: 'abc123' },
  base: { sha: 'def456' },
};

export const mockPRReviews = [
  {
    id: 1,
    user: { login: 'reviewer1' },
    state: 'APPROVED',
    submitted_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
    user: { login: 'reviewer2' },
    state: 'APPROVED',
    submitted_at: '2024-01-02T01:00:00Z',
  },
];

export const mockPRReviewsNoApproval = [
  {
    id: 1,
    user: { login: 'reviewer1' },
    state: 'COMMENTED',
    submitted_at: '2024-01-02T00:00:00Z',
  },
];

export const mockCodeOfConduct = {
  type: 'file',
  name: 'CODE_OF_CONDUCT.md',
  path: 'CODE_OF_CONDUCT.md',
  content: Buffer.from('# Code of Conduct\n\nBe nice.').toString('base64'),
};

export const mockDeployments = [
  {
    id: 1,
    creator: { login: 'github-actions[bot]', type: 'Bot' },
    environment: 'production',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:05:00Z',
  },
];

export const mockManualDeployments = [
  {
    id: 1,
    creator: { login: 'admin-user', type: 'User' },
    environment: 'production',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const mockCollaborators = [
  { login: 'admin1', permissions: { admin: true, push: true, pull: true } },
  { login: 'dev1', permissions: { admin: false, push: true, pull: true } },
  { login: 'dev2', permissions: { admin: false, push: true, pull: true } },
  { login: 'dev3', permissions: { admin: false, push: true, pull: true } },
  { login: 'dev4', permissions: { admin: false, push: false, pull: true } },
];

export const mockCollaboratorsTooManyAdmins = [
  { login: 'admin1', permissions: { admin: true } },
  { login: 'admin2', permissions: { admin: true } },
  { login: 'admin3', permissions: { admin: true } },
  { login: 'dev1', permissions: { admin: false, push: true } },
];

export const mockIssues = [
  {
    number: 1,
    title: 'Security vulnerability found',
    labels: [{ name: 'security' }, { name: 'critical' }],
    state: 'closed',
    created_at: '2024-01-01T00:00:00Z',
    closed_at: '2024-01-01T12:00:00Z', // Closed within 12 hours
  },
  {
    number: 2,
    title: 'Another security issue',
    labels: [{ name: 'security' }],
    state: 'open',
    created_at: '2024-01-01T00:00:00Z', // Open for too long
  },
];

export const mockCommits = [
  {
    sha: 'abc123',
    commit: {
      message: 'feat: add user authentication\n\nImplemented JWT-based authentication with refresh tokens.',
      author: { name: 'Developer', email: 'dev@example.com' },
    },
  },
  {
    sha: 'def456',
    commit: {
      message: 'fix bug', // Poor commit message
      author: { name: 'Developer', email: 'dev@example.com' },
    },
  },
];

export const mockVulnerabilityAlerts = [
  {
    id: 1,
    state: 'open',
    dependency: { package: { name: 'lodash' } },
    security_advisory: {
      severity: 'high',
      summary: 'Prototype pollution',
    },
  },
];

export const mockRateLimit = {
  resources: {
    core: {
      limit: 5000,
      remaining: 4500,
      reset: Math.floor(Date.now() / 1000) + 3600,
    },
    graphql: {
      limit: 5000,
      remaining: 5000,
      reset: Math.floor(Date.now() / 1000) + 3600,
    },
  },
};

export const mockRateLimitExceeded = {
  resources: {
    core: {
      limit: 5000,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    },
  },
};

export const mockRepository = {
  id: 123,
  name: 'test-repo',
  full_name: 'test-owner/test-repo',
  private: false,
  owner: { login: 'test-owner' },
  html_url: 'https://github.com/test-owner/test-repo',
  default_branch: 'main',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockBranchProtection = {
  required_status_checks: {
    strict: true,
    contexts: ['ci/test', 'ci/lint'],
  },
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: true,
  },
  enforce_admins: { enabled: true },
  required_signatures: { enabled: false },
};

export const mockReleases = [
  {
    id: 1,
    tag_name: 'compliance-evidence-2024-01',
    name: 'Compliance Evidence - January 2024',
    upload_url: 'https://uploads.github.com/repos/.../releases/1/assets{?name,label}',
    html_url: 'https://github.com/.../releases/tag/compliance-evidence-2024-01',
  },
];

export const mockReleaseAsset = {
  id: 1,
  name: 'report-abc123.pdf',
  browser_download_url: 'https://github.com/.../releases/download/.../report-abc123.pdf',
  content_type: 'application/pdf',
  size: 1024 * 100, // 100KB
};

export const mockWorkflowRuns = [
  {
    id: 1,
    name: 'CI',
    status: 'completed',
    conclusion: 'success',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Deploy',
    status: 'completed',
    conclusion: 'success',
    created_at: '2024-01-01T00:05:00Z',
  },
];

export const mockPRComment = {
  id: 123,
  body: '<!-- compliance-autopilot-comment -->\n## Compliance Status\n✅ PASS',
  user: { login: 'github-actions[bot]' },
  html_url: 'https://github.com/.../issues/123#issuecomment-123',
};

export const mockErrorResponses = {
  notFound: {
    status: 404,
    message: 'Not Found',
  },
  forbidden: {
    status: 403,
    message: 'Resource not accessible by integration',
  },
  unauthorized: {
    status: 401,
    message: 'Bad credentials',
  },
  rateLimited: {
    status: 429,
    message: 'API rate limit exceeded',
    response: {
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
      },
    },
  },
  serverError: {
    status: 500,
    message: 'Internal Server Error',
  },
};
