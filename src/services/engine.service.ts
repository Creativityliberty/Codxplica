import path from "path";
import fs from "fs";
import { LLMService } from "./llm.service";
import { IngestService } from "./ingest.service";

export interface Abstraction {
    name: string;
    description: string;
    files: string[];
}

export interface Relationship {
    from: string;
    to: string;
    label: string;
}

export interface Chapter {
    title: string;
    content: string;
    filename: string;
}

export class TutorialEngine {
    private llm: LLMService;
    private ingester: IngestService;

    constructor() {
        this.llm = new LLMService();
        this.ingester = new IngestService();
    }

    async generateTutorial(source: string, projectName: string, language: string = "english") {
        // 0. Prepare output directory
        const outputDir = path.join(process.cwd(), "tutorials", projectName.replace(/\s+/g, "_").toLowerCase());
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 1. Ingest
        const fullDigest = await this.ingester.ingest(source);

        // 2. Identify Abstractions
        console.log("Identifying abstractions...");
        const abstractions = await this.identifyAbstractions(fullDigest, projectName, language);

        // 3. Analyze Relationships
        console.log("Analyzing relationships...");
        const relationships = await this.analyzeRelationships(fullDigest, abstractions, projectName, language);

        // 4. Order Chapters
        console.log("Ordering chapters...");
        const chapterOrder = await this.orderChapters(abstractions, relationships, language);

        // 5. Generate Chapters (in parallel)
        console.log("Generating chapters...");
        const chapters = await Promise.all(
            chapterOrder.map((abs, index) =>
                this.generateChapter(fullDigest, abs, index + 1, abstractions, language)
            )
        );

        // Save chapters to disk
        for (const chapter of chapters) {
            fs.writeFileSync(path.join(outputDir, chapter.filename), chapter.content);
        }

        // Save metadata
        fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify({
            projectName,
            abstractions,
            relationships,
            generatedAt: new Date().toISOString()
        }, null, 2));

        return {
            projectName,
            abstractions,
            relationships,
            chapters,
            outputPath: outputDir
        };
    }

    private async identifyAbstractions(digest: string, projectName: string, language: string): Promise<Abstraction[]> {
        const prompt = `
For the project \`${projectName}\`:
Codebase Context (Digest):
${digest.substring(0, 30000)}... (truncated for context limit if necessary)

Analyze the codebase and identify the top 5-10 core important abstractions.
For each, provide:
1. name (in ${language})
2. description (simple analogy, ~100 words, in ${language})
3. Relevant file paths.

Output as JSON array:
[{ "name": "...", "description": "...", "files": ["path/to/file1", ...] }]
    `;
        return this.llm.generateStructuredContent<Abstraction[]>(prompt, []);
    }

    private async analyzeRelationships(digest: string, abstractions: Abstraction[], projectName: string, language: string) {
        // Ported from AR node
        const abstractionContext = abstractions.map((a, i) => `${i}: ${a.name}`).join("\n");
        const prompt = `
Based on these abstractions:
${abstractionContext}

And the codebase:
${digest.substring(0, 20000)}...

Provide a high-level summary (in ${language}) and a list of relationships.
Output as JSON:
{
  "summary": "...",
  "relationships": [{ "from": "Name1", "to": "Name2", "label": "interaction label" }]
}
    `;
        return this.llm.generateStructuredContent<any>(prompt, {});
    }

    private async orderChapters(abstractions: Abstraction[], relationships: any, language: string): Promise<Abstraction[]> {
        // Simply return the abstractions for now, or use LLM to reorder based on "foundational" logic
        return abstractions;
    }

    private async generateChapter(digest: string, abstraction: Abstraction, num: number, allAbstractions: Abstraction[], language: string): Promise<Chapter> {
        const prompt = `
Write Chapter ${num} of a tutorial for "${abstraction.name}".
Context: ${abstraction.description}
Files: ${abstraction.files.join(", ")}

Instructions:
- Use ${language}.
- Use Markdown.
- Add Mermaid diagrams if helpful.
- Keep it simple.
    `;
        const content = await this.llm.generateContent(prompt);
        const safeName = abstraction.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        return {
            title: abstraction.name,
            content,
            filename: `${num.toString().padStart(2, '0')}_${safeName}.md`
        };
    }
}
