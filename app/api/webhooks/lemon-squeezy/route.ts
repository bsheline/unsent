import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const clonedReq = req.clone();
    const payloadString = await clonedReq.text();
    const signature = req.headers.get('x-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(payloadString).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(payloadString);
    const eventName = payload.meta.event_name;
    const obj = payload.data.attributes;

    // We assume the user's Clerk ID is passed in the custom_data during checkout
    const userId = payload.meta.custom_data?.user_id;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id in custom_data' }, { status: 400 });
    }

    switch (eventName) {
      case 'subscription_created':
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'PRO',
            subscriptionId: payload.data.id,
          },
        });
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'FREE',
            // optionally clear subscriptionId, but might be useful to keep for history
          },
        });
        break;

      default:
        // Unhandled event
        break;
    }

    return new NextResponse('Webhook received', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
