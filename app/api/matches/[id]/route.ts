import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const match = await prisma.match.findUnique({
      where: {
        id: params.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!match || match.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
    });

    if (!match || match.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { name, platform, notes } = await req.json();

    const updatedMatch = await prisma.match.update({
      where: { id: params.id },
      data: {
        name,
        platform,
        notes,
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
    });

    if (!match || match.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.message.deleteMany({
      where: { matchId: params.id },
    });

    await prisma.match.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}
