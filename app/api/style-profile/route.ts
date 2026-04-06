import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { text } = await req.json();

    if (!text) {
      return new NextResponse("Missing text", { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const currentProfile = user.styleProfile || "{}";

    const systemPrompt = `You are a style analyzer. Extract style signals from the user's chosen text and merge them into the current style profile JSON.

Current Style Profile:
${currentProfile}

Return ONLY valid JSON. No preamble, no markdown. The JSON should be an object representing the user's updated communication style (e.g. tone, length, emoji usage, directness, typical structures).`;

    const userPrompt = `Chosen text: "${text}"

Update the style profile to reflect this choice.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
    });

    let newProfile = currentProfile;
    const completionText = msg.content[0].type === 'text' ? msg.content[0].text : '';

    try {
        // Validate it's valid JSON
        JSON.parse(completionText);
        newProfile = completionText;
    } catch {
        console.error("Failed to parse JSON from Claude style extraction");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { styleProfile: newProfile },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[STYLE_PROFILE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
