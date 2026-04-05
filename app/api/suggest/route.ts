import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { canGenerate } from "@/lib/subscription";

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
    const { matchId, input } = body;

    if (!matchId || !input) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify the match belongs to the user
    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 10,
        }
      }
    });

    if (!match) {
      return new NextResponse("Match not found", { status: 404 });
    }

    // Increment generation count
    await prisma.user.update({
      where: { id: userId },
      data: { generationsCount: { increment: 1 } },
    });

    // Save the incoming message
    await prisma.message.create({
      data: {
        matchId,
        role: "THEM",
        content: input,
      }
    });

    const styleProfile = user?.styleProfile || "unknown, infer from conversation";

    const systemPrompt = `You are a dating coach helping craft replies on dating apps.
Your suggestions should feel natural, not AI-generated.

User's communication style:
${styleProfile}

Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    { "reply": "string", "rationale": "string", "tone": "string" }
  ]
}
No preamble, no markdown, no explanation outside the JSON.`;

    const conversationHistory = match.messages.map(m => `${m.role === "USER" ? "ME" : "THEM"}: ${m.content}`).join("\n");

    const userPrompt = `Conversation so far:
${conversationHistory}

New message from them:
${input}

Suggest 3 replies ranked by likely engagement.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
    });

    let suggestions = [];
    if (msg.content[0].type === "text") {
        try {
            const parsed = JSON.parse(msg.content[0].text);
            suggestions = parsed.suggestions;
        } catch (e) {
            console.error("Failed to parse JSON from Claude", e);
            // fallback if it fails
            suggestions = [
                { reply: "Failed to parse suggestions", rationale: "Error", tone: "error" }
            ];
        }
    }

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("[SUGGEST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
