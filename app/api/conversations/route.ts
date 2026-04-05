import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || match.userId !== userId) {
      return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, content, role, chosen } = await req.json();

    if (!matchId || !content || !role) {
      return NextResponse.json({ error: 'matchId, content, and role are required' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || match.userId !== userId) {
      return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        content,
        role,
        chosen: chosen || false,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
