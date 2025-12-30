

export interface IngestResult {
    summary: string;
    tree: string;
    content: string;
}

export class IngestService {
    /**
     * Uses Gitingest CLI to analyze a repository or directory.
     * @param source URL or local path
     * @param token Optional GitHub token
     */
    async ingest(source: string, token: string = process.env.GITHUB_TOKEN || ""): Promise<string> {
        console.log(`Ingesting source: ${source}...`);

        // 1. Parse URL (e.g. https://github.com/owner/repo)
        const match = source.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            throw new Error("Invalid GitHub URL. Must be https://github.com/owner/repo");
        }
        const [, owner, repo] = match;

        // 2. Fetch Repo Details to get default branch
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!repoRes.ok) {
            throw new Error(`Failed to fetch repo info: ${repoRes.statusText}`);
        }
        const repoData = await repoRes.json();
        const branch = repoData.default_branch || "main";

        // 3. Fetch File Tree (Recursive)
        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!treeRes.ok) {
            throw new Error(`Failed to fetch file tree: ${treeRes.statusText}`);
        }

        const treeData = await treeRes.json();
        const files = (treeData.tree as any[]).filter(f =>
            f.type === "blob" &&
            !f.path.includes(".png") &&
            !f.path.includes(".jpg") &&
            !f.path.includes(".ico") &&
            !f.path.includes("lock") &&
            !f.path.startsWith(".")
        ).slice(0, 50); // Limit to 50 files for safety/speed in V0

        // 4. Fetch Content (Parallel)
        const contents = await Promise.all(files.map(async (file) => {
            try {
                // Use raw.githubusercontent for content or blob API
                // Blob API is safer with token for private repos
                const blobRes = await fetch(file.url, { // Note: file.url is the git blob API url
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/vnd.github.v3.raw" // Asking for raw gets the content directly
                    }
                });

                if (!blobRes.ok) return "";
                const text = await blobRes.text();
                return `\n\n--- ${file.path} ---\n\n${text}`;
            } catch (err) {
                console.warn(`Failed to fetch ${file.path}`, err);
                return "";
            }
        }));

        const digest = `Repository: ${owner}/${repo}\nBranch: ${branch}\n\n` + contents.join("");
        return digest;
    }

    /**
     * Simplified parser for Gitingest output if needed.
     * Gitingest usually returns a combined format.
     */
    parseDigest(digest: string): IngestResult {
        // Basic splitting logic if gitingest output structure is predictable
        // For prompt ingestion, the raw digest is often enough.
        return {
            summary: "Full codebase digest",
            tree: "Extracted from digest",
            content: digest
        };
    }
}
