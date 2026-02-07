/**
 * GitHub Artifact Store
 *
 * Stores compliance evidence in GitHub Releases as immutable artifacts.
 * Provides secure, tamper-proof storage for audit trails.
 */
export interface ArtifactMetadata {
    filename: string;
    size: number;
    sha256: string;
    contentType: string;
    uploadedAt: Date;
    url?: string;
}
export interface ReleaseInfo {
    id: number;
    tagName: string;
    name: string;
    url: string;
    createdAt: Date;
    assets: ArtifactMetadata[];
}
export interface UploadResult {
    success: boolean;
    artifact: ArtifactMetadata;
    releaseUrl: string;
    downloadUrl: string;
}
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
export declare class ArtifactStore {
    private octokit;
    private owner;
    private repo;
    private releasePrefix;
    constructor(token: string, owner: string, repo: string);
    /**
     * Upload compliance report as release asset
     */
    uploadEvidence(filePath: string, options?: {
        tagName?: string;
        commitSha?: string;
        prNumber?: number;
        framework?: string;
    }): Promise<UploadResult>;
    /**
     * Upload multiple evidence files
     */
    uploadBulkEvidence(filePaths: string[], options?: {
        tagName?: string;
        commitSha?: string;
        prNumber?: number;
        framework?: string;
    }): Promise<UploadResult[]>;
    /**
     * Get or create release for evidence storage
     */
    private getOrCreateRelease;
    /**
     * Generate unique tag name for evidence
     */
    private generateTagName;
    /**
     * Generate release name
     */
    private generateReleaseName;
    /**
     * Generate release description
     */
    private generateReleaseBody;
    /**
     * Find existing asset in release
     */
    private findExistingAsset;
    /**
     * List all evidence releases
     */
    listEvidenceReleases(limit?: number): Promise<ReleaseInfo[]>;
    /**
     * Get content type from filename
     */
    private getContentType;
    /**
     * Delete release (for cleanup - use with caution!)
     */
    deleteRelease(tagName: string): Promise<void>;
}
/**
 * Factory function for creating artifact store
 */
export declare function createArtifactStore(token: string, owner: string, repo: string): ArtifactStore;
//# sourceMappingURL=artifact-store.d.ts.map