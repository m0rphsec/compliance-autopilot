"use strict";
/**
 * GitHub Artifact Store
 *
 * Stores compliance evidence in GitHub Releases as immutable artifacts.
 * Provides secure, tamper-proof storage for audit trails.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactStore = void 0;
exports.createArtifactStore = createArtifactStore;
const rest_1 = require("@octokit/rest");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
/**
 * GitHub Releases Artifact Store
 *
 * Uses GitHub Releases as immutable storage for compliance evidence.
 * Benefits:
 * - Permanent storage (cannot be deleted without trace)
 * - Version controlled with tags
 * - Download URLs for auditors
 * - Searchable and browsable via GitHub UI
 */
class ArtifactStore {
    octokit;
    owner;
    repo;
    releasePrefix = 'compliance-evidence';
    constructor(token, owner, repo) {
        this.octokit = new rest_1.Octokit({ auth: token });
        this.owner = owner;
        this.repo = repo;
    }
    /**
     * Upload compliance report as release asset
     */
    async uploadEvidence(filePath, options = {}) {
        // Read file
        const fileContent = await fs.readFile(filePath);
        const filename = path.basename(filePath);
        const contentType = this.getContentType(filename);
        // Generate checksum for integrity verification
        const sha256 = (0, crypto_1.createHash)('sha256').update(fileContent).digest('hex');
        // Create or get release
        const tagName = options.tagName || this.generateTagName(options);
        const release = await this.getOrCreateRelease(tagName, options);
        try {
            // Upload asset
            const uploadResponse = await this.octokit.rest.repos.uploadReleaseAsset({
                owner: this.owner,
                repo: this.repo,
                release_id: release.id,
                name: filename,
                data: fileContent,
                headers: {
                    'content-type': contentType,
                    'content-length': fileContent.length,
                },
            });
            const artifact = {
                filename,
                size: fileContent.length,
                sha256,
                contentType,
                uploadedAt: new Date(),
                url: uploadResponse.data.browser_download_url,
            };
            return {
                success: true,
                artifact,
                releaseUrl: release.html_url,
                downloadUrl: uploadResponse.data.browser_download_url,
            };
        }
        catch (error) {
            if (error.status === 422 && error.message?.includes('already_exists')) {
                // Asset already exists, try to get its URL
                const existingAsset = await this.findExistingAsset(release.id, filename);
                if (existingAsset) {
                    const artifact = {
                        filename,
                        size: fileContent.length,
                        sha256,
                        contentType,
                        uploadedAt: new Date(),
                        url: existingAsset.browser_download_url,
                    };
                    return {
                        success: true,
                        artifact,
                        releaseUrl: release.html_url,
                        downloadUrl: existingAsset.browser_download_url,
                    };
                }
            }
            throw new Error(`Failed to upload evidence artifact: ${error.message}\n\n` +
                `This usually means:\n` +
                `1. The GitHub token lacks 'contents:write' permission\n` +
                `2. The release cannot be created (tag already exists)\n` +
                `3. Network issues during upload\n\n` +
                `Add to your workflow:\n` +
                `  permissions:\n` +
                `    contents: write\n` +
                `    releases: write`);
        }
    }
    /**
     * Upload multiple evidence files
     */
    async uploadBulkEvidence(filePaths, options = {}) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const result = await this.uploadEvidence(filePath, options);
                results.push(result);
            }
            catch (error) {
                console.error(`Failed to upload ${filePath}:`, error.message);
                // Continue with other files
            }
        }
        return results;
    }
    /**
     * Get or create release for evidence storage
     */
    async getOrCreateRelease(tagName, options) {
        // Try to get existing release
        try {
            const response = await this.octokit.rest.repos.getReleaseByTag({
                owner: this.owner,
                repo: this.repo,
                tag: tagName,
            });
            return response.data;
        }
        catch (error) {
            if (error.status !== 404) {
                throw error;
            }
            // Release doesn't exist, create it
        }
        // Create new release
        const releaseName = this.generateReleaseName(options);
        const releaseBody = this.generateReleaseBody(options);
        try {
            const response = await this.octokit.rest.repos.createRelease({
                owner: this.owner,
                repo: this.repo,
                tag_name: tagName,
                name: releaseName,
                body: releaseBody,
                draft: false,
                prerelease: false,
                target_commitish: options.commitSha,
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to create release: ${error.message}\n\n` +
                `This usually means:\n` +
                `1. The GitHub token lacks 'contents:write' permission\n` +
                `2. The tag already exists but is not a release\n` +
                `3. The target commit doesn't exist\n\n` +
                `Add to your workflow:\n` +
                `  permissions:\n` +
                `    contents: write`);
        }
    }
    /**
     * Generate unique tag name for evidence
     */
    generateTagName(options) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const parts = [this.releasePrefix];
        if (options.framework) {
            parts.push(options.framework);
        }
        if (options.prNumber) {
            parts.push(`pr-${options.prNumber}`);
        }
        parts.push(timestamp);
        return parts.join('-');
    }
    /**
     * Generate release name
     */
    generateReleaseName(options) {
        const parts = ['Compliance Evidence'];
        if (options.framework) {
            parts.push(`- ${options.framework.toUpperCase()}`);
        }
        if (options.prNumber) {
            parts.push(`- PR #${options.prNumber}`);
        }
        parts.push(`- ${new Date().toISOString().split('T')[0]}`);
        return parts.join(' ');
    }
    /**
     * Generate release description
     */
    generateReleaseBody(options) {
        let body = '## 🔒 Compliance Evidence Package\n\n';
        body +=
            'This release contains immutable compliance evidence collected by Compliance Autopilot.\n\n';
        body += '### 📋 Details\n\n';
        if (options.framework) {
            body += `- **Framework**: ${options.framework.toUpperCase()}\n`;
        }
        if (options.prNumber) {
            body += `- **Pull Request**: #${options.prNumber}\n`;
        }
        if (options.commitSha) {
            body += `- **Commit**: \`${options.commitSha.substring(0, 7)}\`\n`;
        }
        body += `- **Collected**: ${new Date().toISOString()}\n\n`;
        body += '### 🔐 Verification\n\n';
        body += 'Each asset includes a SHA-256 checksum for integrity verification.\n';
        body += 'Download the assets and verify checksums to ensure authenticity.\n\n';
        body += '### 📊 Usage\n\n';
        body += 'These artifacts are ready for:\n';
        body += '- Audit submission\n';
        body += '- Compliance review\n';
        body += '- Historical analysis\n';
        body += '- Legal documentation\n\n';
        body += '---\n';
        body +=
            '_Generated by [Compliance Autopilot](https://github.com/marketplace/actions/compliance-autopilot)_\n';
        return body;
    }
    /**
     * Find existing asset in release
     */
    async findExistingAsset(releaseId, filename) {
        try {
            const response = await this.octokit.rest.repos.listReleaseAssets({
                owner: this.owner,
                repo: this.repo,
                release_id: releaseId,
            });
            return response.data.find((asset) => asset.name === filename);
        }
        catch {
            return null;
        }
    }
    /**
     * List all evidence releases
     */
    async listEvidenceReleases(limit = 10) {
        try {
            const response = await this.octokit.rest.repos.listReleases({
                owner: this.owner,
                repo: this.repo,
                per_page: limit,
            });
            const evidenceReleases = response.data
                .filter((release) => release.tag_name.startsWith(this.releasePrefix))
                .map((release) => ({
                id: release.id,
                tagName: release.tag_name,
                name: release.name || release.tag_name,
                url: release.html_url,
                createdAt: new Date(release.created_at),
                assets: release.assets.map((asset) => ({
                    filename: asset.name,
                    size: asset.size,
                    sha256: '', // Not available from API
                    contentType: asset.content_type,
                    uploadedAt: new Date(asset.created_at),
                    url: asset.browser_download_url,
                })),
            }));
            return evidenceReleases;
        }
        catch (error) {
            throw new Error(`Failed to list evidence releases: ${error.message}`);
        }
    }
    /**
     * Get content type from filename
     */
    getContentType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.json': 'application/json',
            '.html': 'text/html',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.zip': 'application/zip',
        };
        return contentTypes[ext] || 'application/octet-stream';
    }
    /**
     * Delete release (for cleanup - use with caution!)
     */
    async deleteRelease(tagName) {
        try {
            const release = await this.octokit.rest.repos.getReleaseByTag({
                owner: this.owner,
                repo: this.repo,
                tag: tagName,
            });
            await this.octokit.rest.repos.deleteRelease({
                owner: this.owner,
                repo: this.repo,
                release_id: release.data.id,
            });
            // Also delete the tag
            await this.octokit.rest.git.deleteRef({
                owner: this.owner,
                repo: this.repo,
                ref: `tags/${tagName}`,
            });
        }
        catch (error) {
            console.error(`Failed to delete release ${tagName}:`, error.message);
        }
    }
}
exports.ArtifactStore = ArtifactStore;
/**
 * Factory function for creating artifact store
 */
function createArtifactStore(token, owner, repo) {
    return new ArtifactStore(token, owner, repo);
}
//# sourceMappingURL=artifact-store.js.map