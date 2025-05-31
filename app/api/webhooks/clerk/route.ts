import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { ensureUserExists } from '@/lib/userSync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: NextRequest) {
  try {
    const h = await headers(); 
    const svixId = h.get('svix-id');
    const svixTimestamp = h.get('svix-timestamp');
    const svixSignature = h.get('svix-signature');
    const rawBody = await req.text();

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing svix headers', { status: 400 });
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(svixId + svixTimestamp + rawBody)
      .digest('base64');

    const providedSignature = svixSignature
      .split(' ')
      .find((s) => s.startsWith('v1,'))
      ?.replace('v1,', '');

    if (!providedSignature || providedSignature !== expectedSignature) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event: WebhookEvent = JSON.parse(rawBody);
    const { type, data } = event;

    if (type === 'user.created') {
      const {
        id: userId,
        email_addresses,
        primary_email_address_id,
        first_name,
        last_name,
      } = data;

      const emailObj = email_addresses.find((e) => e.id === primary_email_address_id);
      const email = emailObj?.email_address;

      if (!email) {
        return new Response('Email address missing', { status: 400 });
      }

      const result = await ensureUserExists(supabase, {
        id: userId,
        email,
        firstName: first_name || '',
        lastName: last_name || '',
      });

      if (!result.success) {
        console.error('User insert error:', result.error);
        return new Response('Failed to create user', { status: 500 });
      }
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}