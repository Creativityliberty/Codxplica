import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Simulated Auth
        const userId = "local-admin";

        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                projects: {
                    include: { chapters: true },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: `admin@codxplica.local`,
                },
                include: { projects: { include: { chapters: true } } }
            });
        }

        return NextResponse.json(user.projects);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
