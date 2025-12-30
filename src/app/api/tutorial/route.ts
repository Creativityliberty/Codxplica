import { NextRequest, NextResponse } from "next/server";
import { TutorialEngine } from "@/services/engine.service";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { source, projectName, language } = await req.json();

        if (!source) {
            return NextResponse.json({ error: "Source is required" }, { status: 400 });
        }

        // Ensure User exists in our DB (Sync with Clerk)
        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: `${userId}@clerk.user`, // Temporary until we get real email from Clerk if needed
                }
            });
        }

        const engine = new TutorialEngine();
        const result = await engine.generateTutorial(source, projectName || "Project", language || "english");

        // Save Project to DB
        const project = await prisma.project.create({
            data: {
                name: result.projectName,
                sourceUrl: source,
                userId: user.id,
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
