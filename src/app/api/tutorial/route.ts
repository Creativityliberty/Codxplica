import { NextRequest, NextResponse } from "next/server";
import { TutorialEngine } from "@/services/engine.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { LLMProvider } from "@/services/llm.service";

export async function POST(req: NextRequest) {
    try {
        // Simulated Auth for Local SaaS
        const userEmail = "admin@codxplica.local";

        const { source, projectName, language, provider, model } = await req.json();

        if (!source) {
            return NextResponse.json({ error: "Source is required" }, { status: 400 });
        }

        // Ensure User exists in our DB (Mock Sync)
        let user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                }
            });
        }

        // Créer le TutorialEngine avec le provider et modèle choisis
        const engine = new TutorialEngine({
            provider: (provider as LLMProvider) || "gemini",
            model: model || undefined,
        });
        const result = await engine.generateTutorial(source, projectName || "Project", language || "english");

        // Save Project to DB
        const project = await prisma.project.create({
            data: {
                name: result.projectName,
                sourceUrl: source,
                userId: user.id,
                abstractions: result.abstractions,
                relationships: result.relationships,
                chapters: {
                    create: result.chapters.map((c, i) => ({
                        title: c.title,
                        content: c.content,
                        order: i + 1,
                    }))
                }
            },
            include: { chapters: true }
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
