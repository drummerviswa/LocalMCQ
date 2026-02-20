import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { teamid } = await req.json();

        if (!teamid) {
            return NextResponse.json(
                { success: false, message: "Team ID required" },
                { status: 400 }
            );
        }

        const team = await prisma.team.findUnique({
            where: { id: teamid },
            select: { startTime: true },
        });

        if (!team) {
            return NextResponse.json(
                { success: false, message: "Team not found" },
                { status: 404 }
            );
        }

        let startTime = team.startTime;

        if (!startTime) {
            startTime = BigInt(Date.now());
            await prisma.team.update({
                where: { id: teamid },
                data: { startTime },
            });
        }

        return NextResponse.json({
            success: true,
            startTime: Number(startTime),
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message },
            { status: 500 }
        );
    }
}
