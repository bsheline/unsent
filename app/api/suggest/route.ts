import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { anthropic, systemPrompt } from '@/lib/anthropic';
import { canGenerate } from '@/lib/subscription';

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, input, imageBase64 } = await req.json();

    if (!matchId || (!input && !imageBase64)) {
      return NextResponse.json({ error: 'matchId and either input or imageBase64 are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10, // last 10 messages
        },
      },
    });

    if (!match || match.userId !== userId) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Subscription check logic - checking Free tier usage vs Pro
    // Logic as per DESIGN.md: "Free tier: dashboard access, 3 lifetime suggestions... Pro tier: unlimited."
    // Implementing simple count check for FREE users
    if (!canGenerate(user)) {
      const suggestionsCount = await prisma.message.count({
        where: {
          match: {
            userId: user.id
          },
          role: 'USER', // We'll count 'USER' messages that were generated
          chosen: true
        }
      });

      if (suggestionsCount >= 3) {
         return NextResponse.json({ error: 'Free tier limit reached. Please upgrade to Pro.' }, { status: 403 });
      }
    }

    const styleProfile = user.styleProfile || "unknown, infer from conversation";
    const formattedPrompt = systemPrompt.replace('{STYLE_PROFILE}', styleProfile);

    // Format the conversation so far
    let conversationContext = match.messages.reverse().map(msg => {
      return `${msg.role === 'THEM' ? 'THEM' : 'ME'}: ${msg.content}`;
    }).join('\n');

    let userTurnText = `Conversation so far:\n${conversationContext}\n\nNew message from them:\n${input}\n\nSuggest 3 replies ranked by likely engagement.`;

    let content: any[] = [];
    if (imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg', // Assume jpeg for now, could be passed from client
          data: imageBase64,
        }
      });
    }
    content.push({
      type: 'text',
      text: userTurnText
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: formattedPrompt,
      messages: [
        {
          role: 'user',
          content: content,
        }
      ],
    });

    const completionText = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsedSuggestions = { suggestions: [] };
    try {
        parsedSuggestions = JSON.parse(completionText);
    } catch(e) {
        console.error("Error parsing JSON from Anthropic:", completionText);
        return NextResponse.json({ error: 'Failed to generate valid suggestions' }, { status: 500 });
    }

    return NextResponse.json(parsedSuggestions);

  } catch (error) {
    console.error('Error in suggest route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
