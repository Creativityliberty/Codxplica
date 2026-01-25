/**
 * SmartFilter Service - Filtrage intelligent des fichiers de code
 * Inspiré par le concept Morssel: "manger un éléphant, une bouchée à la fois"
 */

export interface FileInfo {
    path: string;
    content: string;
    size: number;
    language: string;
    importance: "core" | "secondary" | "config" | "test" | "docs";
}

export interface FilteredCodebase {
    entryPoints: FileInfo[];
    coreFiles: FileInfo[];
    secondaryFiles: FileInfo[];
    testFiles: FileInfo[];
    configFiles: FileInfo[];
    stats: {
        totalFiles: number;
        filteredFiles: number;
        totalSize: number;
        languages: Record<string, number>;
        framework: string | null;
    };
}

// Fichiers à ignorer complètement
const IGNORE_PATTERNS = [
    // Lock files
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /bun\.lockb$/,
    /Gemfile\.lock$/,
    /poetry\.lock$/,
    /Cargo\.lock$/,

    // Build output
    /^dist\//,
    /^build\//,
    /^out\//,
    /^\.next\//,
    /^node_modules\//,
    /^vendor\//,
    /^__pycache__\//,
    /\.pyc$/,

    // IDE/Editor
    /^\.vscode\//,
    /^\.idea\//,
    /\.swp$/,
    /\.swo$/,

    // Assets (non-code)
    /\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|mp3|wav|pdf|woff|woff2|ttf|eot)$/i,

    // Minified files
    /\.min\.(js|css)$/,
    /\.bundle\.(js|css)$/,

    // Source maps
    /\.map$/,

    // Env files (security)
    /^\.env/,
    /\.env\.local$/,
    /\.env\.production$/,

    // Git
    /^\.git\//,
    /\.gitignore$/,
];

// Fichiers de config (garder mais basse priorité)
const CONFIG_PATTERNS = [
    /^package\.json$/,
    /^tsconfig.*\.json$/,
    /^next\.config\.(js|ts|mjs)$/,
    /^vite\.config\.(js|ts)$/,
    /^webpack\.config\.(js|ts)$/,
    /^tailwind\.config\.(js|ts)$/,
    /^postcss\.config\.(js|ts)$/,
    /^eslint.*\.(json|js|cjs)$/,
    /^prettier.*\.(json|js)$/,
    /^jest\.config\.(js|ts)$/,
    /^vitest\.config\.(js|ts)$/,
    /^\.babelrc$/,
    /^Dockerfile$/,
    /^docker-compose\.ya?ml$/,
    /^Makefile$/,
    /^CMakeLists\.txt$/,
    /requirements\.txt$/,
    /pyproject\.toml$/,
    /Cargo\.toml$/,
    /go\.mod$/,
    /go\.sum$/,
];

// Fichiers de test
const TEST_PATTERNS = [
    /\.test\.(js|ts|jsx|tsx)$/,
    /\.spec\.(js|ts|jsx|tsx)$/,
    /_test\.(go|py|rb)$/,
    /test_.*\.py$/,
    /^tests?\//,
    /^__tests__\//,
    /^spec\//,
];

// Fichiers de documentation
const DOCS_PATTERNS = [
    /^README/i,
    /^CHANGELOG/i,
    /^CONTRIBUTING/i,
    /^LICENSE/i,
    /^docs?\//,
    /\.md$/,
    /\.mdx$/,
    /\.rst$/,
];

// Points d'entrée typiques par framework
const ENTRY_POINTS: Record<string, RegExp[]> = {
    nextjs: [
        /^src\/app\/page\.(tsx|jsx|ts|js)$/,
        /^src\/app\/layout\.(tsx|jsx|ts|js)$/,
        /^pages\/index\.(tsx|jsx|ts|js)$/,
        /^pages\/_app\.(tsx|jsx|ts|js)$/,
    ],
    react: [
        /^src\/App\.(tsx|jsx|ts|js)$/,
        /^src\/index\.(tsx|jsx|ts|js)$/,
        /^src\/main\.(tsx|jsx|ts|js)$/,
    ],
    express: [
        /^(src\/)?index\.(ts|js)$/,
        /^(src\/)?app\.(ts|js)$/,
        /^(src\/)?server\.(ts|js)$/,
    ],
    python: [
        /^main\.py$/,
        /^app\.py$/,
        /^__main__\.py$/,
        /^manage\.py$/,
    ],
    go: [
        /^main\.go$/,
        /^cmd\/.*\/main\.go$/,
    ],
    rust: [
        /^src\/main\.rs$/,
        /^src\/lib\.rs$/,
    ],
};

// Extension -> Langage
const LANGUAGE_MAP: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".kt": "kotlin",
    ".swift": "swift",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".vue": "vue",
    ".svelte": "svelte",
    ".sql": "sql",
    ".sh": "bash",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".json": "json",
    ".toml": "toml",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".html": "html",
};

export class SmartFilterService {
    /**
     * Filtre et categorise les fichiers d'un codebase
     */
    filter(files: Array<{ path: string; content: string }>): FilteredCodebase {
        const result: FilteredCodebase = {
            entryPoints: [],
            coreFiles: [],
            secondaryFiles: [],
            testFiles: [],
            configFiles: [],
            stats: {
                totalFiles: files.length,
                filteredFiles: 0,
                totalSize: 0,
                languages: {},
                framework: null,
            },
        };

        // Detecter le framework
        result.stats.framework = this.detectFramework(files);

        for (const file of files) {
            // Ignorer les fichiers non pertinents
            if (this.shouldIgnore(file.path)) {
                continue;
            }

            const language = this.detectLanguage(file.path);
            const size = file.content.length;

            // Compter les langages
            if (language) {
                result.stats.languages[language] = (result.stats.languages[language] || 0) + 1;
            }

            result.stats.totalSize += size;
            result.stats.filteredFiles++;

            const fileInfo: FileInfo = {
                path: file.path,
                content: file.content,
                size,
                language: language || "unknown",
                importance: "secondary",
            };

            // Categoriser le fichier
            if (this.isEntryPoint(file.path, result.stats.framework)) {
                fileInfo.importance = "core";
                result.entryPoints.push(fileInfo);
            } else if (this.isTestFile(file.path)) {
                fileInfo.importance = "test";
                result.testFiles.push(fileInfo);
            } else if (this.isConfigFile(file.path)) {
                fileInfo.importance = "config";
                result.configFiles.push(fileInfo);
            } else if (this.isDocsFile(file.path)) {
                fileInfo.importance = "docs";
                // On garde les docs dans secondary pour reference
                result.secondaryFiles.push(fileInfo);
            } else if (this.isCoreFile(file.path, file.content)) {
                fileInfo.importance = "core";
                result.coreFiles.push(fileInfo);
            } else {
                result.secondaryFiles.push(fileInfo);
            }
        }

        // Trier par importance (taille et nom)
        result.coreFiles.sort((a, b) => b.size - a.size);
        result.secondaryFiles.sort((a, b) => b.size - a.size);

        return result;
    }

    private shouldIgnore(path: string): boolean {
        return IGNORE_PATTERNS.some(pattern => pattern.test(path));
    }

    private isTestFile(path: string): boolean {
        return TEST_PATTERNS.some(pattern => pattern.test(path));
    }

    private isConfigFile(path: string): boolean {
        return CONFIG_PATTERNS.some(pattern => pattern.test(path));
    }

    private isDocsFile(path: string): boolean {
        return DOCS_PATTERNS.some(pattern => pattern.test(path));
    }

    private isEntryPoint(path: string, framework: string | null): boolean {
        if (framework && ENTRY_POINTS[framework]) {
            return ENTRY_POINTS[framework].some(pattern => pattern.test(path));
        }
        // Fallback: verifier tous les entry points connus
        return Object.values(ENTRY_POINTS)
            .flat()
            .some(pattern => pattern.test(path));
    }

    private isCoreFile(path: string, content: string): boolean {
        // Fichiers dans src/ ou lib/ sont generalement importants
        if (/^(src|lib|app|packages)\//.test(path)) {
            // Exclure les fichiers utilitaires generiques
            if (/\/(utils?|helpers?|constants?|types?|interfaces?)\./.test(path)) {
                return false;
            }
            return true;
        }

        // Fichiers avec beaucoup de code sont probablement importants
        if (content.length > 1000) {
            // Verifier s'il y a des exports ou des classes
            if (/export\s+(default\s+)?(class|function|const)/.test(content)) {
                return true;
            }
            if (/^class\s+\w+/m.test(content)) {
                return true;
            }
        }

        return false;
    }

    private detectLanguage(path: string): string | null {
        const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
        return LANGUAGE_MAP[ext] || null;
    }

    private detectFramework(files: Array<{ path: string; content: string }>): string | null {
        const paths = files.map(f => f.path);
        const packageJson = files.find(f => f.path === "package.json");

        if (packageJson) {
            try {
                const pkg = JSON.parse(packageJson.content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };

                if (deps["next"]) return "nextjs";
                if (deps["express"]) return "express";
                if (deps["react"] && !deps["next"]) return "react";
                if (deps["vue"]) return "vue";
                if (deps["svelte"]) return "svelte";
                if (deps["@angular/core"]) return "angular";
                if (deps["fastify"]) return "fastify";
                if (deps["koa"]) return "koa";
            } catch {
                // Ignore JSON parse errors
            }
        }

        // Detection par fichiers
        if (paths.some(p => /^src\/app\//.test(p) || p === "next.config.js" || p === "next.config.ts")) {
            return "nextjs";
        }
        if (paths.some(p => p === "manage.py" || p === "wsgi.py")) {
            return "django";
        }
        if (paths.some(p => p === "app.py" || p === "flask_app.py")) {
            return "flask";
        }
        if (paths.some(p => p === "main.go" || p.startsWith("cmd/"))) {
            return "go";
        }
        if (paths.some(p => p === "Cargo.toml")) {
            return "rust";
        }

        return null;
    }

    /**
     * Genere un digest optimise pour le LLM
     * Limite la taille totale et priorise les fichiers importants
     */
    generateDigest(codebase: FilteredCodebase, maxTokens: number = 100000): string {
        const parts: string[] = [];
        let currentTokens = 0;
        const CHARS_PER_TOKEN = 4; // Approximation

        // Header avec stats
        parts.push(`# Codebase Analysis\n`);
        parts.push(`Framework: ${codebase.stats.framework || "Unknown"}`);
        parts.push(`Total Files: ${codebase.stats.filteredFiles}`);
        parts.push(`Languages: ${Object.entries(codebase.stats.languages).map(([l, c]) => `${l}(${c})`).join(", ")}`);
        parts.push(`\n---\n`);

        // Fonction helper pour ajouter un fichier
        const addFile = (file: FileInfo, section: string): boolean => {
            const fileContent = `\n## [${section}] ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`;
            const tokens = fileContent.length / CHARS_PER_TOKEN;

            if (currentTokens + tokens > maxTokens) {
                return false;
            }

            parts.push(fileContent);
            currentTokens += tokens;
            return true;
        };

        // 1. Entry points (priorite maximale)
        parts.push(`\n# Entry Points\n`);
        for (const file of codebase.entryPoints) {
            if (!addFile(file, "ENTRY")) break;
        }

        // 2. Core files (haute priorite)
        parts.push(`\n# Core Files\n`);
        for (const file of codebase.coreFiles.slice(0, 20)) {
            if (!addFile(file, "CORE")) break;
        }

        // 3. Secondary files (si espace restant)
        if (currentTokens < maxTokens * 0.8) {
            parts.push(`\n# Secondary Files\n`);
            for (const file of codebase.secondaryFiles.slice(0, 10)) {
                if (!addFile(file, "SECONDARY")) break;
            }
        }

        // 4. Config (juste package.json si present)
        const packageJson = codebase.configFiles.find(f => f.path === "package.json");
        if (packageJson && currentTokens < maxTokens * 0.95) {
            parts.push(`\n# Configuration\n`);
            addFile(packageJson, "CONFIG");
        }

        return parts.join("\n");
    }
}
