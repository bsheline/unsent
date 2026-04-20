import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { canGenerate } from "@/lib/subscription";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (!canGenerate(user)) {
      return new NextResponse("Free tier limit reached", { status: 403 });
    }

    const body = await req.json();
    const { bio } = body;

    if (!bio) {
      return new NextResponse("Bio is required", { status: 400 });
    }

    if (bio.length > MAX_TEXT_LENGTH) {
      return new NextResponse("Bio too long", { status: 400 });
    }

    // Increment generation count
    await prisma.user.update({
      where: { id: userId },
      data: { generationsCount: { increment: 1 } },
    });

    const systemPrompt = `You are an expert dating profile reviewer.
Analyze the provided dating app bio. Be constructive but direct.
Provide feedback in three sections:
1. Strengths: What works well.
2. Weaknesses/Red Flags: What might turn people away.
3. Suggested Rewrite: A polished version of the bio.

Do not use markdown. Just plain text with clear spacing.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: bio }
      ],
    });

    let feedback = "";
    if (msg.content[0].type === "text") {
      feedback = msg.content[0].text;
    }

    return NextResponse.json({ feedback });

  } catch (error) {
    console.error("[PROFILE_REVIEW_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
