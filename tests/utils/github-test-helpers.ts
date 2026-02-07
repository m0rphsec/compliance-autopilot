/**
 * GitHub API Test Helpers
 * Utility functions for GitHub integration tests
 */

import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

export interface GitHubTestConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface TestBranchInfo {
  name: string;
  sha: string;
  created: boolean;
}

export interface TestPRInfo {
  number: number;
  title: string;
  url: string;
}

export interface TestReleaseInfo {
  id: number;
  tagName: string;
  url: string;
}

/**
 * Get GitHub token from environment or gh CLI
 */
export function getGitHubToken(): string {
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    return envToken;
  }

  try {
    const cliToken = execSync('gh auth token', { encoding: 'utf-8' }).trim();
    if (cliToken) {
      return cliToken;
    }
  } catch (error) {
    console.error('Failed to get token from gh CLI:', error);
  }

  throw new Error('GitHub token not found. Set GITHUB_TOKEN or authenticate with gh CLI');
}

/**
 * Get current user info using gh CLI
 */
export function getGitHubUser(): { login: string; id: number } {
  try {
    const userJson = execSync('gh api user', { encoding: 'utf-8' });
    const user = JSON.parse(userJson);
    return {
      login: user.login,
      id: user.id,
    };
  } catch (error) {
    throw new Error('Failed to get GitHub user info. Ensure gh CLI is authenticated');
  }
}

/**
 * Check if running in CI environment
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI
  );
}

/**
 * Get rate limit status using gh CLI
 */
export function getRateLimitStatus(): {
  limit: number;
  remaining: number;
  reset: number;
} {
  try {
    const rateLimitJson = execSync('gh api rate_limit', { encoding: 'utf-8' });
    const rateLimit = JSON.parse(rateLimitJson);
    return {
      limit: rateLimit.resources.core.limit,
      remaining: rateLimit.resources.core.remaining,
      reset: rateLimit.resources.core.reset,
    };
  } catch (error) {
    throw new Error('Failed to get rate limit status');
  }
}

/**
 * Create a test branch with unique name
 */
export async function createTestBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseBranch: string = 'master'
): Promise<TestBranchInfo> {
  const branchName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Get base branch SHA
  const { data: baseBranchData } = await octokit.repos.getBranch({
    owner,
    repo,
    branch: baseBranch,
  });

  // Create new branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseBranchData.commit.sha,
  });

  return {
    name: branchName,
    sha: baseBranchData.commit.sha,
    created: true,
  };
}

/**
 * Delete a test branch
 */
export async function deleteTestBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string
): Promise<void> {
  try {
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });
  } catch (error: any) {
    if (error.status !== 404) {
      console.error(`Failed to delete branch ${branchName}:`, error.message);
    }
  }
}

/**
 * Create a test file in a branch
 */
export async function createTestFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  message: string
): Promise<void> {
  const encodedContent = Buffer.from(content).toString('base64');

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: encodedContent,
    branch,
  });
}

/**
 * Create a test pull request
 */
export async function createTestPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  head: string,
  base: string = 'master',
  title: string = '[TEST] Integration test PR'
): Promise<TestPRInfo> {
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body: `## Automated Test PR\n\nCreated: ${new Date().toISOString()}\n\n**Safe to close**`,
    head,
    base,
  });

  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
  };
}

/**
 * Close and cleanup a test pull request
 */
export async function cleanupTestPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  try {
    await octokit.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      state: 'closed',
    });
  } catch (error: any) {
    if (error.status !== 404) {
      console.error(`Failed to close PR #${prNumber}:`, error.message);
    }
  }
}

/**
 * Create a test release (draft)
 */
export async function createTestRelease(
  octokit: Octokit,
  owner: string,
  repo: string,
  tagName?: string
): Promise<TestReleaseInfo> {
  const tag = tagName || `v0.0.0-test-${Date.now()}`;

  const { data: release } = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: `Test Release ${tag}`,
    body: `Automated test release\nCreated: ${new Date().toISOString()}`,
    draft: true,
    prerelease: true,
  });

  return {
    id: release.id,
    tagName: release.tag_name,
    url: release.html_url,
  };
}

/**
 * Delete a test release
 */
export async function cleanupTestRelease(
  octokit: Octokit,
  owner: string,
  repo: string,
  releaseId: number
): Promise<void> {
  try {
    await octokit.repos.deleteRelease({
      owner,
      repo,
      release_id: releaseId,
    });
  } catch (error: any) {
    if (error.status !== 404) {
      console.error(`Failed to delete release #${releaseId}:`, error.message);
    }
  }
}

/**
 * Wait for rate limit reset if needed
 */
export async function waitForRateLimit(
  octokit: Octokit,
  minRemaining: number = 10
): Promise<void> {
  const { data: rateLimit } = await octokit.rateLimit.get();

  if (rateLimit.resources.core.remaining < minRemaining) {
    const resetTime = rateLimit.resources.core.reset * 1000;
    const waitTime = resetTime - Date.now();

    if (waitTime > 0) {
      console.log(`Rate limit low. Waiting ${Math.ceil(waitTime / 1000)}s for reset...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
    }
  }
}

/**
 * Verify repository access and permissions
 */
export async function verifyRepositoryAccess(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{
  accessible: boolean;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}> {
  try {
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      accessible: true,
      permissions: {
        admin: repoData.permissions?.admin || false,
        push: repoData.permissions?.push || false,
        pull: repoData.permissions?.pull || false,
      },
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        accessible: false,
        permissions: {
          admin: false,
          push: false,
          pull: false,
        },
      };
    }
    throw error;
  }
}

/**
 * Generate test file content
 */
export function generateTestFileContent(fileName: string, purpose: string = 'testing'): string {
  return `# ${fileName}

## Purpose
${purpose}

## Metadata
- Created: ${new Date().toISOString()}
- Generator: GitHub Integration Tests
- Safe to delete: Yes

## Content
This is a test file created by automated integration tests.
It can be safely deleted.

\`\`\`json
{
  "test": true,
  "timestamp": "${new Date().toISOString()}",
  "purpose": "${purpose}"
}
\`\`\`
`;
}

/**
 * Upload artifact to release
 */
export async function uploadReleaseArtifact(
  octokit: Octokit,
  owner: string,
  repo: string,
  releaseId: number,
  fileName: string,
  content: string
): Promise<{ id: number; name: string; size: number; url: string }> {
  const { data: asset } = await octokit.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: releaseId,
    name: fileName,
    data: content as any,
  });

  return {
    id: asset.id,
    name: asset.name,
    size: asset.size,
    url: asset.browser_download_url,
  };
}

/**
 * Print rate limit summary
 */
export function printRateLimitSummary(rateLimit: any): void {
  console.log('\nGitHub API Rate Limit Status:');
  console.log('─'.repeat(50));
  console.log(`Core API:        ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
  console.log(`Search API:      ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit}`);
  console.log(`GraphQL API:     ${rateLimit.resources.graphql.remaining}/${rateLimit.resources.graphql.limit}`);

  const resetTime = new Date(rateLimit.resources.core.reset * 1000);
  console.log(`Reset time:      ${resetTime.toLocaleString()}`);
  console.log('─'.repeat(50));

  if (rateLimit.resources.core.remaining < 100) {
    console.warn('⚠️  WARNING: Low rate limit remaining!');
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
