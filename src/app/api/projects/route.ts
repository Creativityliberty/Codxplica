import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                projects: {
                    include: { chapters: true },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!user) return NextResponse.json([]);

        return NextResponse.json(user.projects);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
