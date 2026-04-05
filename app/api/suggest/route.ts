import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { anthropic, systemPrompt } from "@/lib/anthropic";
import { canGenerate } from "@/lib/subscription";

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

    const { matchId, input, imageBase64 } = await req.json();

    if (!matchId || (!input && !imageBase64)) {
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

    if (input) {
      // Save the incoming message
      await prisma.message.create({
        data: {
          matchId,
          role: "THEM",
          content: input,
        }
      });
    }

    const styleProfile = user.styleProfile || "unknown, infer from conversation";
    const formattedPrompt = systemPrompt.replace('{STYLE_PROFILE}', styleProfile);

    const conversationHistory = match.messages.map(m => `${m.role === "USER" ? "ME" : "THEM"}: ${m.content}`).join("\n");

    const userPrompt = `Conversation so far:
${conversationHistory}

New message from them:
${input || "(Photo sent)"}

Suggest 3 replies ranked by likely engagement.`;

    let content: any[] = [];
    if (imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64,
        }
      });
    }
    content.push({
      type: 'text',
      text: userPrompt
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: formattedPrompt,
      messages: [
        { role: "user", content: content }
      ],
    });

    let suggestions = [];
    const completionText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    try {
        const parsed = JSON.parse(completionText);
        suggestions = parsed.suggestions || [];
    } catch (e) {
        console.error("Failed to parse JSON from Claude", e);
        suggestions = [
            { reply: "Failed to parse suggestions", rationale: "Error", tone: "error" }
        ];
    }

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("[SUGGEST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
