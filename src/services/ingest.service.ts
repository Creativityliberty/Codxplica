/**
 * Ingest Service - Fetches code from GitHub repositories
 */

export interface RawFile {
    path: string;
    content: string;
}

export interface IngestResult {
    summary: string;
    tree: string;
    content: string;
}

export class IngestService {
    /**
     * Fetches raw files from a GitHub repository
     * Returns array of {path, content} for SmartFilter processing
     */
    async ingestRaw(source: string, token?: string): Promise<RawFile[]> {
        console.log(`[Ingest] Fetching: ${source}`);

        // Parse GitHub URL
        const match = source.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            throw new Error("Invalid GitHub URL. Must be https://github.com/owner/repo");
        }
        const [, owner, repo] = match;

        const headers: Record<string, string> = {
            "Accept": "application/vnd.github.v3+json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Fetch repo info
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (!repoRes.ok) {
            const error = await repoRes.text();
            throw new Error(`GitHub API Error: ${repoRes.status} - ${error}`);
        }
        const repoData = await repoRes.json();
        const branch = repoData.default_branch || "main";

        // Fetch file tree
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
            { headers }
        );
        if (!treeRes.ok) {
            throw new Error(`Failed to fetch file tree: ${treeRes.statusText}`);
        }

        const treeData = await treeRes.json();

        // Filter to only blobs (files), limit size
        const files = (treeData.tree as any[])
            .filter(f => f.type === "blob" && f.size < 500000) // Max 500KB per file
            .slice(0, 100); // Max 100 files

        console.log(`[Ingest] Found ${files.length} files to fetch`);

        // Fetch content in parallel (with concurrency limit)
        const rawFiles: RawFile[] = [];
        const batchSize = 10;

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (file) => {
                    try {
                        const res = await fetch(file.url, {
                            headers: {
                                ...headers,
                                "Accept": "application/vnd.github.v3.raw",
                            },
                        });

                        if (!res.ok) return null;

                        const content = await res.text();

                        // Skip binary/non-text content
                        if (content.includes("\0")) return null;

                        return {
                            path: file.path,
                            content,
                        };
                    } catch (err) {
                        console.warn(`[Ingest] Failed: ${file.path}`);
                        return null;
                    }
                })
            );

            rawFiles.push(...results.filter((f): f is RawFile => f !== null));
        }

        console.log(`[Ingest] Successfully fetched ${rawFiles.length} files`);
        return rawFiles;
    }

    /**
     * Legacy method - returns concatenated digest string
     * @deprecated Use ingestRaw + SmartFilter instead
     */
    async ingest(source: string, token?: string): Promise<string> {
        const files = await this.ingestRaw(source, token);
        return files.map(f => `\n--- ${f.path} ---\n${f.content}`).join("\n");
    }

    /**
     * Parse digest (legacy compatibility)
     */
    parseDigest(digest: string): IngestResult {
        return {
            summary: "Full codebase digest",
            tree: "Extracted from digest",
            content: digest,
        };
    }
}
