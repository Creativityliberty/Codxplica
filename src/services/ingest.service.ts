import { spawn } from "child_process";

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
    async ingest(source: string, token?: string): Promise<string> {
        console.log(`Ingesting source: ${source}...`);

        const args = [source, "--output", "-"]; // Output to STDOUT
        if (token) {
            args.push("--token", token);
        }

        return new Promise((resolve, reject) => {
            const child = spawn("gitingest", args);
            let stdout = "";
            let stderr = "";

            child.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            child.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            child.on("close", (code) => {
                if (code !== 0) {
                    console.error("Gitingest Error Details:", stderr);
                    reject(new Error(`Gitingest failed with code ${code}: ${stderr}`));
                    return;
                }

                if (!stdout) {
                    reject(new Error("Gitingest returned no output"));
                    return;
                }

                resolve(stdout);
            });

            child.on("error", (err) => {
                console.error("Spawn Error:", err);
                reject(err);
            });
        });
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
