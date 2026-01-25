import { LLMService, GEMINI_MODELS, OPENROUTER_MODELS, LLMProvider } from "./llm.service";
import { IngestService } from "./ingest.service";
import { SmartFilterService, FilteredCodebase, FileInfo } from "./smartfilter.service";

export interface Abstraction {
    name: string;
    description: string;
    files: string[];
    keyCode?: string; // Extrait de code cle
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

export interface TutorialEngineOptions {
    provider?: LLMProvider;
    model?: string;
}

export interface TutorialResult {
    projectName: string;
    framework: string | null;
    abstractions: Abstraction[];
    relationships: any;
    chapters: Chapter[];
    stats: {
        totalFiles: number;
        analyzedFiles: number;
        languages: Record<string, number>;
    };
    provider: string;
    model: string;
}

export class TutorialEngine {
    private llm: LLMService;
    private ingester: IngestService;
    private smartFilter: SmartFilterService;
    private provider: LLMProvider;
    private model: string;

    constructor(options: TutorialEngineOptions = {}) {
        this.provider = options.provider || "gemini";

        if (options.model) {
            this.model = options.model;
        } else {
            this.model = this.provider === "openrouter"
                ? OPENROUTER_MODELS.DEEPSEEK_R1_FREE
                : GEMINI_MODELS.GEMINI_2_0_FLASH_EXP;
        }

        this.llm = new LLMService(this.model, this.provider);
        this.ingester = new IngestService();
        this.smartFilter = new SmartFilterService();

        console.log(`[TutorialEngine] Provider: ${this.provider}, Model: ${this.model}`);
    }

    async generateTutorial(source: string, projectName: string, language: string = "english"): Promise<TutorialResult> {
        // 1. Ingest from GitHub
        console.log("[1/5] Fetching repository...");
        const githubToken = process.env.GITHUB_TOKEN?.replace(/['"]/g, "");
        const rawFiles = await this.ingester.ingestRaw(source, githubToken);

        // 2. Smart Filter
        console.log("[2/5] Analyzing codebase structure...");
        const codebase = this.smartFilter.filter(rawFiles);
        const digest = this.smartFilter.generateDigest(codebase);

        console.log(`[SmartFilter] Framework: ${codebase.stats.framework}, Files: ${codebase.stats.filteredFiles}/${codebase.stats.totalFiles}`);

        // 3. Identify Abstractions with real code
        console.log("[3/5] Identifying core abstractions...");
        const abstractions = await this.identifyAbstractions(codebase, projectName, language);

        // 4. Analyze Relationships
        console.log("[4/5] Mapping relationships...");
        const relationships = await this.analyzeRelationships(codebase, abstractions, projectName, language);

        // 5. Generate Chapters with real code
        console.log("[5/5] Generating tutorial chapters...");
        const chapters = await this.generateAllChapters(codebase, abstractions, relationships, projectName, language);

        return {
            projectName,
            framework: codebase.stats.framework,
            abstractions,
            relationships,
            chapters,
            stats: {
                totalFiles: codebase.stats.totalFiles,
                analyzedFiles: codebase.stats.filteredFiles,
                languages: codebase.stats.languages,
            },
            provider: this.provider,
            model: this.model,
        };
    }

    private async identifyAbstractions(codebase: FilteredCodebase, projectName: string, language: string): Promise<Abstraction[]> {
        // Preparer le contexte avec le vrai code
        const coreFilesContext = [...codebase.entryPoints, ...codebase.coreFiles]
            .slice(0, 15)
            .map(f => `### ${f.path}\n\`\`\`${f.language}\n${f.content.slice(0, 2000)}\n\`\`\``)
            .join("\n\n");

        const prompt = `You are analyzing the codebase of "${projectName}".
Framework detected: ${codebase.stats.framework || "Unknown"}
Languages: ${Object.keys(codebase.stats.languages).join(", ")}

## Core Source Files:
${coreFilesContext}

## Task:
Identify the 5-8 most important abstractions/concepts in this codebase.

For each abstraction:
1. **name**: Clear, concise name (in ${language})
2. **description**: Simple explanation with a real-world analogy (~80 words, in ${language})
3. **files**: Array of relevant file paths from the codebase
4. **keyCode**: The most important code snippet (1-10 lines) that defines this abstraction

## Rules:
- Focus on ACTUAL code patterns found in the files
- Use the REAL file paths from the codebase
- Extract REAL code snippets, not invented examples
- Prioritize: Entry points, Services, Components, Models, APIs

Output as JSON array:
[{
  "name": "...",
  "description": "...",
  "files": ["src/...", "..."],
  "keyCode": "const example = ..."
}]`;

        return this.llm.generateStructuredContent<Abstraction[]>(prompt, []);
    }

    private async analyzeRelationships(codebase: FilteredCodebase, abstractions: Abstraction[], projectName: string, language: string) {
        const abstractionList = abstractions.map((a, i) => `${i + 1}. ${a.name}: ${a.description.slice(0, 100)}...`).join("\n");

        const prompt = `Analyze the relationships between these abstractions in "${projectName}":

## Abstractions:
${abstractionList}

## Task:
1. Write a brief summary of the overall architecture (3-5 sentences, in ${language})
2. Identify the key relationships/data flows between abstractions

## Rules:
- Use Mermaid-compatible labels (no special characters)
- Focus on actual code dependencies (imports, calls, data flow)
- Keep relationship labels short (2-4 words)

Output as JSON:
{
  "summary": "...",
  "relationships": [
    { "from": "Abstraction1", "to": "Abstraction2", "label": "calls" },
    ...
  ]
}`;

        return this.llm.generateStructuredContent<any>(prompt, { summary: "", relationships: [] });
    }

    private async generateAllChapters(
        codebase: FilteredCodebase,
        abstractions: Abstraction[],
        relationships: any,
        projectName: string,
        language: string
    ): Promise<Chapter[]> {
        // Generate chapters sequentially to avoid rate limits
        const chapters: Chapter[] = [];

        for (let i = 0; i < abstractions.length; i++) {
            const chapter = await this.generateChapter(
                codebase,
                abstractions[i],
                i + 1,
                abstractions,
                relationships,
                projectName,
                language
            );
            chapters.push(chapter);
        }

        return chapters;
    }

    private async generateChapter(
        codebase: FilteredCodebase,
        abstraction: Abstraction,
        chapterNum: number,
        allAbstractions: Abstraction[],
        relationships: any,
        projectName: string,
        language: string
    ): Promise<Chapter> {
        // Trouver les fichiers reels pour cette abstraction
        const relevantFiles = this.findRelevantFiles(codebase, abstraction.files);
        const codeContext = relevantFiles
            .slice(0, 5)
            .map(f => `### ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``)
            .join("\n\n");

        const otherAbstractions = allAbstractions
            .filter(a => a.name !== abstraction.name)
            .map(a => a.name)
            .join(", ");

        const prompt = `Write Chapter ${chapterNum} of a tutorial for "${projectName}".

## Topic: ${abstraction.name}
${abstraction.description}

## Real Source Code:
${codeContext || "No specific files found."}

## Related Concepts: ${otherAbstractions}

## Writing Guidelines:
1. **Language**: Write entirely in ${language}
2. **Structure**:
   - Start with a clear introduction explaining WHAT this is and WHY it matters
   - Show the REAL code from the repository (not invented examples)
   - Explain the code step by step
   - End with how it connects to other parts

3. **Code Blocks**:
   - Use proper syntax highlighting (\`\`\`typescript, \`\`\`python, etc.)
   - Include file paths as comments: \`// src/services/example.ts\`
   - Only show REAL code from the repository

4. **Diagrams** (use Mermaid):
   - Add ONE diagram if it helps understanding
   - Use simple flowchart or sequence diagram
   - Keep it clean, no ASCII art

5. **Style**:
   - Be concise and practical
   - Use analogies for complex concepts
   - NO emojis, NO excessive formatting
   - Professional technical writing

## Output:
Write the complete chapter in Markdown format.`;

        const content = await this.llm.generateContent(prompt);

        // Clean up the content
        const cleanContent = this.cleanChapterContent(content);

        const safeName = abstraction.name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
        return {
            title: abstraction.name,
            content: cleanContent,
            filename: `${chapterNum.toString().padStart(2, "0")}_${safeName}.md`,
        };
    }

    private findRelevantFiles(codebase: FilteredCodebase, filePaths: string[]): FileInfo[] {
        const allFiles = [
            ...codebase.entryPoints,
            ...codebase.coreFiles,
            ...codebase.secondaryFiles,
        ];

        const found: FileInfo[] = [];

        for (const searchPath of filePaths) {
            // Exact match
            let file = allFiles.find(f => f.path === searchPath);

            // Partial match
            if (!file) {
                file = allFiles.find(f => f.path.includes(searchPath) || searchPath.includes(f.path));
            }

            // Filename match
            if (!file) {
                const filename = searchPath.split("/").pop();
                if (filename) {
                    file = allFiles.find(f => f.path.endsWith(filename));
                }
            }

            if (file && !found.includes(file)) {
                found.push(file);
            }
        }

        // If no files found, return some core files as context
        if (found.length === 0) {
            return allFiles.slice(0, 3);
        }

        return found;
    }

    private cleanChapterContent(content: string): string {
        let cleaned = content;

        // Remove <think> tags from reasoning models
        cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "");

        // Remove excessive newlines
        cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");

        // Remove ASCII art boxes
        cleaned = cleaned.replace(/[┌┐└┘│─┬┴├┤┼═║╔╗╚╝╠╣╦╩╬]+/g, "");

        // Remove excessive === or --- decorators
        cleaned = cleaned.replace(/^[=\-]{10,}$/gm, "---");

        // Clean up code block language hints
        cleaned = cleaned.replace(/```(javascript|js)\n/g, "```javascript\n");
        cleaned = cleaned.replace(/```(typescript|ts)\n/g, "```typescript\n");

        return cleaned.trim();
    }
}
