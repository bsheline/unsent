import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, platform } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        name,
        platform,
        userId,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("[MATCHES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
