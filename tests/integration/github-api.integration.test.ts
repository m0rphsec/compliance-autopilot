/**
 * GitHub API Integration Tests
 * Tests real GitHub API functionality using authenticated account (m0rphsec)
 *
 * Prerequisites:
 * - GitHub CLI authenticated: gh auth status
 * - GITHUB_TOKEN environment variable set
 * - Access to test repository: m0rphsec/compliance-autopilot
 *
 * Run with: npm test -- github-api.integration
 */

import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

describe('GitHub API Integration Tests', () => {
  let octokit: Octokit;
  const owner = 'm0rphsec';
  const repo = 'compliance-autopilot';
  const testBranch = `test-branch-${Date.now()}`;
  let testPrNumber: number | null = null;
  let testReleaseId: number | null = null;

  beforeAll(async () => {
    // Get GitHub token from environment or gh CLI
    const token = process.env.GITHUB_TOKEN || getGhToken();

    if (!token) {
      throw new Error('GitHub token not found. Set GITHUB_TOKEN or authenticate with gh CLI');
    }

    octokit = new Octokit({
      auth: token,
    });

    console.log('GitHub API tests initialized');
    console.log(`Repository: ${owner}/${repo}`);
  });

  afterAll(async () => {
    // Cleanup test resources
    try {
      // Close test PR if created
      if (testPrNumber) {
        await octokit.pulls.update({
          owner,
          repo,
          pull_number: testPrNumber,
          state: 'closed',
        });
        console.log(`Closed test PR #${testPrNumber}`);
      }

      // Delete test release if created
      if (testReleaseId) {
        await octokit.repos.deleteRelease({
          owner,
          repo,
          release_id: testReleaseId,
        });
        console.log(`Deleted test release #${testReleaseId}`);
      }

      // Delete test branch if created
      try {
        await octokit.git.deleteRef({
          owner,
          repo,
          ref: `heads/${testBranch}`,
        });
        console.log(`Deleted test branch: ${testBranch}`);
      } catch (error) {
        // Branch might not exist, ignore
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('1. Authentication & Permissions', () => {
    it('should verify GitHub API authentication', async () => {
      const { data: user } = await octokit.users.getAuthenticated();

      expect(user.login).toBe(owner);
      expect(user.type).toBe('User');
      console.log(`Authenticated as: ${user.login}`);
      console.log(`Account created: ${user.created_at}`);
    });

    it('should check API rate limits', async () => {
      const { data: rateLimit } = await octokit.rateLimit.get();

      expect(rateLimit.resources.core.limit).toBeGreaterThan(0);
      expect(rateLimit.resources.core.remaining).toBeLessThanOrEqual(
        rateLimit.resources.core.limit
      );

      console.log('Rate Limit Status:');
      console.log(`  Core: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
      console.log(`  Search: ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit}`);
      if (rateLimit.resources.graphql) {
        console.log(`  GraphQL: ${rateLimit.resources.graphql.remaining}/${rateLimit.resources.graphql.limit}`);
      }

      // Warn if rate limit is low
      if (rateLimit.resources.core.remaining < 100) {
        console.warn('WARNING: Low rate limit remaining!');
      }
    });

    it('should verify repository access permissions', async () => {
      const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
      });

      expect(repoData.name).toBe(repo);
      expect(repoData.owner.login).toBe(owner);
      expect(repoData.permissions?.admin || repoData.permissions?.push).toBe(true);

      console.log('Repository Permissions:');
      console.log(`  Admin: ${repoData.permissions?.admin}`);
      console.log(`  Push: ${repoData.permissions?.push}`);
      console.log(`  Pull: ${repoData.permissions?.pull}`);
    });

    it('should validate token scopes', async () => {
      const response = await octokit.request('GET /user');
      const scopes = response.headers['x-oauth-scopes']?.split(', ') || [];

      console.log('Token scopes:', scopes);

      // Check for required scopes
      expect(scopes).toContain('repo');
      expect(scopes.length).toBeGreaterThan(0);
    });
  });

  describe('2. Repository Analysis', () => {
    it('should analyze repository structure', async () => {
      const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
      });

      expect(repoData.name).toBe(repo);
      expect(repoData.default_branch).toBeTruthy();
      expect(repoData.visibility).toBeDefined();

      console.log('Repository Analysis:');
      console.log(`  Name: ${repoData.name}`);
      console.log(`  Default Branch: ${repoData.default_branch}`);
      console.log(`  Visibility: ${repoData.visibility}`);
      console.log(`  Size: ${repoData.size} KB`);
      console.log(`  Stars: ${repoData.stargazers_count}`);
      console.log(`  Language: ${repoData.language}`);
      console.log(`  Has Issues: ${repoData.has_issues}`);
      console.log(`  Has Wiki: ${repoData.has_wiki}`);
      console.log(`  Created: ${repoData.created_at}`);
      console.log(`  Updated: ${repoData.updated_at}`);
    });

    it('should list repository contents', async () => {
      const { data: contents } = await octokit.repos.getContent({
        owner,
        repo,
        path: '',
      });

      expect(Array.isArray(contents)).toBe(true);
      if (Array.isArray(contents)) {
        expect(contents.length).toBeGreaterThan(0);

        const fileNames = contents.map((item) => item.name);
        console.log('Root files:', fileNames.join(', '));

        // Check for expected files
        expect(fileNames).toContain('package.json');
      }
    });

    it('should retrieve repository languages', async () => {
      const { data: languages } = await octokit.repos.listLanguages({
        owner,
        repo,
      });

      expect(Object.keys(languages).length).toBeGreaterThan(0);

      console.log('Repository Languages:');
      Object.entries(languages).forEach(([lang, bytes]) => {
        const kb = (bytes / 1024).toFixed(2);
        console.log(`  ${lang}: ${kb} KB`);
      });
    });

    it('should get commit history', async () => {
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 5,
      });

      expect(commits.length).toBeGreaterThan(0);

      console.log('Recent Commits:');
      commits.forEach((commit, index) => {
        console.log(`  ${index + 1}. ${commit.sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]}`);
        console.log(`     Author: ${commit.commit.author?.name}`);
        console.log(`     Date: ${commit.commit.author?.date}`);
      });
    });

    it('should analyze repository branches', async () => {
      const { data: branches } = await octokit.repos.listBranches({
        owner,
        repo,
      });

      expect(branches.length).toBeGreaterThan(0);

      console.log('Repository Branches:');
      branches.forEach((branch) => {
        console.log(`  - ${branch.name} (${branch.protected ? 'protected' : 'unprotected'})`);
      });
    });
  });

  describe('3. Pull Request Operations', () => {
    it('should create a test branch and PR', async () => {
      // Get default branch reference
      const { data: defaultBranch } = await octokit.repos.getBranch({
        owner,
        repo,
        branch: 'master',
      });

      // Create new branch
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${testBranch}`,
        sha: defaultBranch.commit.sha,
      });

      console.log(`Created test branch: ${testBranch}`);

      // Create a test file
      const testContent = `# Test File\n\nCreated by integration tests at ${new Date().toISOString()}\n`;
      const encodedContent = Buffer.from(testContent).toString('base64');

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `test-file-${Date.now()}.md`,
        message: 'test: Add test file for integration tests',
        content: encodedContent,
        branch: testBranch,
      });

      // Create PR
      const { data: pr } = await octokit.pulls.create({
        owner,
        repo,
        title: '[TEST] Integration test PR - Safe to close',
        body: '## Test Pull Request\n\nThis PR was created by automated integration tests.\n\n**Safe to close immediately.**',
        head: testBranch,
        base: 'master',
      });

      testPrNumber = pr.number;

      expect(pr.number).toBeGreaterThan(0);
      expect(pr.state).toBe('open');
      expect(pr.title).toContain('[TEST]');

      console.log(`Created test PR #${pr.number}`);
      console.log(`PR URL: ${pr.html_url}`);
    }, 30000);

    it('should post comment on PR', async () => {
      if (!testPrNumber) {
        throw new Error('No test PR created');
      }

      const commentBody = `## Automated Test Comment

This comment was posted by integration tests at ${new Date().toISOString()}

### Test Results
- ✅ Authentication successful
- ✅ PR creation successful
- ✅ Comment posting successful

**This PR can be safely closed.**`;

      const { data: comment } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: testPrNumber,
        body: commentBody,
      });

      expect(comment.id).toBeGreaterThan(0);
      expect(comment.body).toContain('Automated Test Comment');

      console.log(`Posted comment on PR #${testPrNumber}`);
      console.log(`Comment URL: ${comment.html_url}`);
    });

    it('should list PR comments', async () => {
      if (!testPrNumber) {
        throw new Error('No test PR created');
      }

      const { data: comments } = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: testPrNumber,
      });

      expect(comments.length).toBeGreaterThan(0);

      console.log(`PR #${testPrNumber} has ${comments.length} comment(s)`);
      comments.forEach((comment, index) => {
        console.log(`  ${index + 1}. By ${comment.user?.login}: ${comment.body?.substring(0, 50)}...`);
      });
    });

    it('should update PR title and description', async () => {
      if (!testPrNumber) {
        throw new Error('No test PR created');
      }

      const updatedTitle = '[TEST] Updated PR Title - Integration Tests';
      const updatedBody = `## Updated Description

Updated at ${new Date().toISOString()}

This PR was modified by integration tests.`;

      const { data: updatedPr } = await octokit.pulls.update({
        owner,
        repo,
        pull_number: testPrNumber,
        title: updatedTitle,
        body: updatedBody,
      });

      expect(updatedPr.title).toBe(updatedTitle);
      expect(updatedPr.body).toContain('Updated Description');

      console.log(`Updated PR #${testPrNumber}`);
    });

    it('should list all open PRs', async () => {
      const { data: prs } = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
      });

      console.log(`Open PRs: ${prs.length}`);
      prs.forEach((pr) => {
        console.log(`  #${pr.number}: ${pr.title}`);
        console.log(`    Author: ${pr.user?.login}`);
        console.log(`    Created: ${pr.created_at}`);
      });

      // Our test PR should be in the list
      const testPr = prs.find((pr) => pr.number === testPrNumber);
      expect(testPr).toBeDefined();
    });
  });

  describe('4. Release Management', () => {
    it('should create a test release', async () => {
      const tagName = `v0.0.0-test-${Date.now()}`;

      const { data: release } = await octokit.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name: `Test Release ${tagName}`,
        body: `## Test Release

Created by integration tests at ${new Date().toISOString()}

This is a test release and can be deleted.`,
        draft: true, // Create as draft to avoid notifications
        prerelease: true,
      });

      testReleaseId = release.id;

      expect(release.id).toBeGreaterThan(0);
      expect(release.tag_name).toBe(tagName);
      expect(release.draft).toBe(true);

      console.log(`Created test release: ${tagName}`);
      console.log(`Release ID: ${release.id}`);
      console.log(`Release URL: ${release.html_url}`);
    });

    it('should upload release asset', async () => {
      if (!testReleaseId) {
        throw new Error('No test release created');
      }

      // Create a test artifact
      const artifactContent = JSON.stringify({
        name: 'test-artifact',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        message: 'This is a test artifact',
      }, null, 2);

      const { data: asset } = await octokit.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: testReleaseId,
        name: 'test-artifact.json',
        data: artifactContent as any,
      });

      expect(asset.id).toBeGreaterThan(0);
      expect(asset.name).toBe('test-artifact.json');
      expect(asset.state).toBe('uploaded');

      console.log(`Uploaded release asset: ${asset.name}`);
      console.log(`Asset size: ${asset.size} bytes`);
      console.log(`Download URL: ${asset.browser_download_url}`);
    });

    it('should list release assets', async () => {
      if (!testReleaseId) {
        throw new Error('No test release created');
      }

      const { data: assets } = await octokit.repos.listReleaseAssets({
        owner,
        repo,
        release_id: testReleaseId,
      });

      expect(assets.length).toBeGreaterThan(0);

      console.log(`Release has ${assets.length} asset(s)`);
      assets.forEach((asset) => {
        console.log(`  - ${asset.name} (${asset.size} bytes)`);
      });
    });

    it('should list all releases', async () => {
      const { data: releases } = await octokit.repos.listReleases({
        owner,
        repo,
        per_page: 5,
      });

      console.log(`Total releases: ${releases.length}`);
      releases.forEach((release) => {
        console.log(`  - ${release.tag_name} (${release.draft ? 'draft' : 'published'})`);
        console.log(`    Created: ${release.created_at}`);
        console.log(`    Assets: ${release.assets.length}`);
      });
    });

    it('should update release information', async () => {
      if (!testReleaseId) {
        throw new Error('No test release created');
      }

      const updatedBody = `## Updated Test Release

Updated at ${new Date().toISOString()}

This release was modified by integration tests.`;

      const { data: updatedRelease } = await octokit.repos.updateRelease({
        owner,
        repo,
        release_id: testReleaseId,
        body: updatedBody,
      });

      expect(updatedRelease.body).toContain('Updated Test Release');

      console.log(`Updated release #${testReleaseId}`);
    });
  });

  describe('5. Issue Management', () => {
    it('should list repository issues', async () => {
      const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        per_page: 10,
      });

      console.log(`Repository has ${issues.length} issue(s)`);
      issues.forEach((issue) => {
        if (!issue.pull_request) {
          console.log(`  #${issue.number}: ${issue.title} (${issue.state})`);
          console.log(`    Labels: ${issue.labels.map((l) => typeof l === 'string' ? l : l.name).join(', ')}`);
        }
      });
    });

    it('should search for issues', async () => {
      const query = `repo:${owner}/${repo} is:issue`;

      const { data: searchResults } = await octokit.search.issuesAndPullRequests({
        q: query,
        per_page: 5,
      });

      console.log(`Found ${searchResults.total_count} issues via search`);
      searchResults.items.forEach((issue) => {
        console.log(`  #${issue.number}: ${issue.title}`);
      });
    });
  });

  describe('6. Repository Security & Compliance', () => {
    it('should check branch protection rules', async () => {
      try {
        const { data: protection } = await octokit.repos.getBranchProtection({
          owner,
          repo,
          branch: 'master',
        });

        console.log('Branch Protection Status:');
        console.log(`  Required reviews: ${protection.required_pull_request_reviews?.required_approving_review_count || 0}`);
        console.log(`  Status checks: ${protection.required_status_checks?.contexts.length || 0}`);
        console.log(`  Enforce admins: ${protection.enforce_admins?.enabled}`);
      } catch (error: any) {
        if (error.status === 404) {
          console.log('No branch protection configured');
        } else {
          throw error;
        }
      }
    });

    it('should check security features', async () => {
      const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
      });

      console.log('Security Features:');
      console.log(`  Vulnerability alerts: ${repoData.security_and_analysis?.secret_scanning?.status || 'unknown'}`);
      console.log(`  Automated security fixes: ${repoData.security_and_analysis?.dependabot_security_updates?.status || 'unknown'}`);
    });

    it('should list repository workflows', async () => {
      try {
        const { data: workflows } = await octokit.actions.listRepoWorkflows({
          owner,
          repo,
        });

        console.log(`Repository has ${workflows.total_count} workflow(s)`);
        workflows.workflows.forEach((workflow) => {
          console.log(`  - ${workflow.name} (${workflow.state})`);
          console.log(`    Path: ${workflow.path}`);
        });
      } catch (error: any) {
        if (error.status === 404) {
          console.log('No GitHub Actions workflows found');
        } else {
          throw error;
        }
      }
    });
  });

  describe('7. Performance & Rate Limiting', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const startTime = Date.now();

      // Make 10 concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        octokit.repos.listCommits({
          owner,
          repo,
          per_page: 1,
          page: i + 1,
        })
      );

      const results = await Promise.all(requests);

      const duration = Date.now() - startTime;

      expect(results.length).toBe(10);
      console.log(`Completed 10 concurrent requests in ${duration}ms`);
      console.log(`Average: ${(duration / 10).toFixed(2)}ms per request`);

      // Should complete reasonably fast with concurrent requests
      expect(duration).toBeLessThan(5000);
    });

    it('should respect rate limiting with throttling', async () => {
      const { data: rateLimitBefore } = await octokit.rateLimit.get();

      console.log('Rate limit before test:');
      console.log(`  Remaining: ${rateLimitBefore.resources.core.remaining}`);

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await octokit.repos.get({ owner, repo });
      }

      const { data: rateLimitAfter } = await octokit.rateLimit.get();

      console.log('Rate limit after test:');
      console.log(`  Remaining: ${rateLimitAfter.resources.core.remaining}`);

      // Should have decreased
      expect(rateLimitAfter.resources.core.remaining).toBeLessThan(
        rateLimitBefore.resources.core.remaining
      );
    });
  });

  describe('8. Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      await expect(
        octokit.repos.get({
          owner,
          repo: 'non-existent-repo-12345',
        })
      ).rejects.toThrow();
    });

    it('should handle invalid API requests', async () => {
      await expect(
        octokit.repos.createRelease({
          owner,
          repo,
          tag_name: '', // Invalid: empty tag name
          name: 'Invalid Release',
        })
      ).rejects.toThrow();
    });

    it('should validate response data structure', async () => {
      const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
      });

      // Validate expected fields
      expect(repoData).toHaveProperty('id');
      expect(repoData).toHaveProperty('name');
      expect(repoData).toHaveProperty('owner');
      expect(repoData).toHaveProperty('default_branch');
      expect(repoData.owner).toHaveProperty('login');
    });
  });
});

/**
 * Helper function to get GitHub token from gh CLI
 */
function getGhToken(): string | null {
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8' }).trim();
    return token || null;
  } catch (error) {
    console.error('Failed to get token from gh CLI:', error);
    return null;
  }
}
