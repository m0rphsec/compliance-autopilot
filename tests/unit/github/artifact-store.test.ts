/**
 * Unit tests for Artifact Store
 *
 * Tests evidence uploads to GitHub Releases with immutability
 */

import { ArtifactStore, UploadResult } from '../../../src/github/artifact-store';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('@octokit/rest');
jest.mock('fs/promises');

describe('ArtifactStore', () => {
  let store: ArtifactStore;
  let mockOctokit: jest.Mocked<Octokit>;

  const mockFileContent = Buffer.from('Mock compliance report content');
  const mockFilePath = '/tmp/compliance-report.pdf';

  beforeEach(() => {
    jest.clearAllMocks();

    mockOctokit = {
      rest: {
        repos: {
          getReleaseByTag: jest.fn(),
          createRelease: jest.fn(),
          uploadReleaseAsset: jest.fn(),
          listReleases: jest.fn(),
          deleteRelease: jest.fn(),
          listReleaseAssets: jest.fn(),
        },
        git: {
          deleteRef: jest.fn(),
        },
      },
    } as any;

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);
    (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    store = new ArtifactStore('test-token', 'test-owner', 'test-repo');
  });

  describe('uploadEvidence', () => {
    it('should upload evidence to new release', async () => {
      const mockRelease = {
        id: 123,
        tag_name: 'compliance-evidence-test',
        html_url: 'https://github.com/test/repo/releases/tag/compliance-evidence-test',
      };

      const mockUploadResponse = {
        data: {
          browser_download_url: 'https://github.com/test/repo/releases/download/test/report.pdf',
        },
      };

      // Release doesn't exist
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 } as any);
      // Create new release
      mockOctokit.rest.repos.createRelease.mockResolvedValue({ data: mockRelease } as any);
      // Upload asset
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue(mockUploadResponse as any);

      const result = await store.uploadEvidence(mockFilePath, {
        tagName: 'compliance-evidence-test',
        prNumber: 123,
        framework: 'soc2',
      });

      expect(result.success).toBe(true);
      expect(result.artifact.filename).toBe('compliance-report.pdf');
      expect(result.artifact.contentType).toBe('application/pdf');
      expect(result.artifact.sha256).toBeTruthy();
      expect(result.releaseUrl).toBe(mockRelease.html_url);
      expect(result.downloadUrl).toBe(mockUploadResponse.data.browser_download_url);
    });

    it('should use existing release if available', async () => {
      const mockRelease = {
        id: 456,
        tag_name: 'compliance-evidence-existing',
        html_url: 'https://github.com/test/repo/releases/tag/existing',
      };

      const mockUploadResponse = {
        data: {
          browser_download_url: 'https://github.com/test/repo/releases/download/test/report.pdf',
        },
      };

      // Release exists
      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);
      // Upload asset
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue(mockUploadResponse as any);

      await store.uploadEvidence(mockFilePath, {
        tagName: 'compliance-evidence-existing',
      });

      expect(mockOctokit.rest.repos.createRelease).not.toHaveBeenCalled();
      expect(mockOctokit.rest.repos.uploadReleaseAsset).toHaveBeenCalled();
    });

    it('should handle existing asset gracefully', async () => {
      const mockRelease = {
        id: 789,
        tag_name: 'compliance-evidence-test',
        html_url: 'https://github.com/test/repo/releases/tag/test',
      };

      const existingAsset = {
        name: 'compliance-report.pdf',
        browser_download_url: 'https://github.com/test/repo/releases/download/test/report.pdf',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);

      const error = new Error('Asset already exists') as any;
      error.status = 422;
      error.message = 'Validation Failed: already_exists';
      mockOctokit.rest.repos.uploadReleaseAsset.mockRejectedValue(error);

      mockOctokit.rest.repos.listReleaseAssets.mockResolvedValue({
        data: [existingAsset],
      } as any);

      const result = await store.uploadEvidence(mockFilePath, {
        tagName: 'compliance-evidence-test',
      });

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe(existingAsset.browser_download_url);
    });

    it('should throw error on upload failure', async () => {
      const mockRelease = {
        id: 999,
        tag_name: 'test',
        html_url: 'https://github.com',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockRejectedValue(new Error('Upload failed'));

      await expect(
        store.uploadEvidence(mockFilePath, { tagName: 'test' })
      ).rejects.toThrow(/Failed to upload evidence artifact/);
    });

    it('should include helpful error message for permission issues', async () => {
      const mockRelease = {
        id: 111,
        tag_name: 'test',
        html_url: 'https://github.com',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);

      const error = new Error('Forbidden') as any;
      error.status = 403;
      mockOctokit.rest.repos.uploadReleaseAsset.mockRejectedValue(error);

      try {
        await store.uploadEvidence(mockFilePath, { tagName: 'test' });
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('contents:write');
        expect(e.message).toContain('permissions:');
      }
    });
  });

  describe('uploadBulkEvidence', () => {
    it('should upload multiple files', async () => {
      const mockRelease = {
        id: 222,
        tag_name: 'bulk-test',
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 } as any);
      mockOctokit.rest.repos.createRelease.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      const filePaths = [
        '/tmp/report1.pdf',
        '/tmp/report2.json',
        '/tmp/report3.html',
      ];

      const results = await store.uploadBulkEvidence(filePaths, {
        tagName: 'bulk-test',
      });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(mockOctokit.rest.repos.uploadReleaseAsset).toHaveBeenCalledTimes(3);
    });

    it('should continue on individual file errors', async () => {
      const mockRelease = {
        id: 333,
        tag_name: 'bulk-error-test',
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);

      // First succeeds, second fails, third succeeds
      mockOctokit.rest.repos.uploadReleaseAsset
        .mockResolvedValueOnce({
          data: { browser_download_url: 'https://github.com/download1' },
        } as any)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({
          data: { browser_download_url: 'https://github.com/download3' },
        } as any);

      const filePaths = ['/tmp/1.pdf', '/tmp/2.pdf', '/tmp/3.pdf'];

      const results = await store.uploadBulkEvidence(filePaths, {
        tagName: 'bulk-error-test',
      });

      expect(results).toHaveLength(2); // Only successful uploads
    });
  });

  describe('Tag Generation', () => {
    it('should generate tag with framework', async () => {
      const mockRelease = {
        id: 444,
        tag_name: expect.stringContaining('soc2'),
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 } as any);
      mockOctokit.rest.repos.createRelease.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence(mockFilePath, { framework: 'soc2' });

      const createCall = mockOctokit.rest.repos.createRelease.mock.calls[0][0];
      expect(createCall.tag_name).toContain('soc2');
    });

    it('should generate tag with PR number', async () => {
      const mockRelease = {
        id: 555,
        tag_name: 'test',
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 } as any);
      mockOctokit.rest.repos.createRelease.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence(mockFilePath, { prNumber: 123 });

      const createCall = mockOctokit.rest.repos.createRelease.mock.calls[0][0];
      expect(createCall.tag_name).toContain('pr-123');
    });
  });

  describe('Release Metadata', () => {
    it('should create release with descriptive name', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 } as any);
      mockOctokit.rest.repos.createRelease.mockResolvedValue({
        data: {
          id: 666,
          tag_name: 'test',
          html_url: 'https://github.com/test',
        },
      } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence(mockFilePath, {
        framework: 'soc2',
        prNumber: 456,
      });

      const createCall = mockOctokit.rest.repos.createRelease.mock.calls[0][0];
      expect(createCall.name).toContain('Compliance Evidence');
      expect(createCall.name).toContain('SOC2');
      expect(createCall.name).toContain('PR #456');
    });

    it('should create release with detailed body', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue({ status: 404 } as any);
      mockOctokit.rest.repos.createRelease.mockResolvedValue({
        data: {
          id: 777,
          tag_name: 'test',
          html_url: 'https://github.com/test',
        },
      } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence(mockFilePath, {
        commitSha: 'abc123def456',
        framework: 'gdpr',
      });

      const createCall = mockOctokit.rest.repos.createRelease.mock.calls[0][0];
      expect(createCall.body).toContain('Compliance Evidence Package');
      expect(createCall.body).toContain('GDPR');
      expect(createCall.body).toContain('abc123d');
      expect(createCall.body).toContain('SHA-256');
    });
  });

  describe('Content Types', () => {
    it('should detect PDF content type', async () => {
      const mockRelease = {
        id: 888,
        tag_name: 'test',
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence('/tmp/report.pdf');

      const uploadCall = mockOctokit.rest.repos.uploadReleaseAsset.mock.calls[0][0];
      expect(uploadCall.headers['content-type']).toBe('application/pdf');
    });

    it('should detect JSON content type', async () => {
      const mockRelease = {
        id: 999,
        tag_name: 'test',
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence('/tmp/evidence.json');

      const uploadCall = mockOctokit.rest.repos.uploadReleaseAsset.mock.calls[0][0];
      expect(uploadCall.headers['content-type']).toBe('application/json');
    });

    it('should use default content type for unknown extensions', async () => {
      const mockRelease = {
        id: 1000,
        tag_name: 'test',
        html_url: 'https://github.com/test',
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue({ data: mockRelease } as any);
      mockOctokit.rest.repos.uploadReleaseAsset.mockResolvedValue({
        data: { browser_download_url: 'https://github.com/download' },
      } as any);

      await store.uploadEvidence('/tmp/report.xyz');

      const uploadCall = mockOctokit.rest.repos.uploadReleaseAsset.mock.calls[0][0];
      expect(uploadCall.headers['content-type']).toBe('application/octet-stream');
    });
  });

  describe('listEvidenceReleases', () => {
    it('should list compliance evidence releases', async () => {
      const mockReleases = {
        data: [
          {
            id: 1,
            tag_name: 'compliance-evidence-soc2-2024-01-01',
            name: 'Compliance Evidence - SOC2',
            html_url: 'https://github.com/test/releases/1',
            created_at: '2024-01-01T00:00:00Z',
            assets: [
              {
                name: 'report.pdf',
                size: 1024,
                content_type: 'application/pdf',
                created_at: '2024-01-01T00:00:00Z',
                browser_download_url: 'https://github.com/download/report.pdf',
              },
            ],
          },
          {
            id: 2,
            tag_name: 'v1.0.0', // Non-compliance release
            name: 'Version 1.0.0',
            html_url: 'https://github.com/test/releases/2',
            created_at: '2024-01-02T00:00:00Z',
            assets: [],
          },
        ],
      };

      mockOctokit.rest.repos.listReleases.mockResolvedValue(mockReleases as any);

      const releases = await store.listEvidenceReleases();

      expect(releases).toHaveLength(1); // Only compliance releases
      expect(releases[0].tagName).toContain('compliance-evidence');
      expect(releases[0].assets).toHaveLength(1);
      expect(releases[0].assets[0].filename).toBe('report.pdf');
    });

    it('should handle empty releases list', async () => {
      mockOctokit.rest.repos.listReleases.mockResolvedValue({ data: [] } as any);

      const releases = await store.listEvidenceReleases();

      expect(releases).toHaveLength(0);
    });
  });

  describe('deleteRelease', () => {
    it('should delete release and tag', async () => {
      const mockRelease = {
        data: {
          id: 1111,
        },
      };

      mockOctokit.rest.repos.getReleaseByTag.mockResolvedValue(mockRelease as any);
      mockOctokit.rest.repos.deleteRelease.mockResolvedValue({} as any);
      mockOctokit.rest.git.deleteRef.mockResolvedValue({} as any);

      await store.deleteRelease('compliance-evidence-test');

      expect(mockOctokit.rest.repos.deleteRelease).toHaveBeenCalledWith(
        expect.objectContaining({ release_id: 1111 })
      );
      expect(mockOctokit.rest.git.deleteRef).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'tags/compliance-evidence-test' })
      );
    });

    it('should handle delete errors gracefully', async () => {
      mockOctokit.rest.repos.getReleaseByTag.mockRejectedValue(new Error('Not found'));

      await expect(store.deleteRelease('non-existent')).resolves.not.toThrow();
    });
  });
});
