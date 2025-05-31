import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { ensureUserExists } from '@/lib/userSync';
import crypto from 'crypto';

// Initialize Supabase client with service role for webhook usage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Simple webhook verification without svix package
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Verify the webhook signature
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(svix_id + svix_timestamp + body)
      .digest('base64');
    
    const signatures = svix_signature.split(' ');
    const versionedSignature = signatures.find(sig => sig.startsWith('v1,'));
    
    if (!versionedSignature) {
      throw new Error('No v1 signature found');
    }
    
    const signature = versionedSignature.replace('v1,', '');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const evt = payload as WebhookEvent;
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook ${id} received for event: ${eventType}`);

  if (eventType === 'user.created') {
    try {
      const { id: userId, email_addresses, first_name, last_name } = evt.data;
      
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      const emailAddress = primaryEmail?.email_address || '';
      
      const result = await ensureUserExists(supabase, {
        id: userId,
        email: emailAddress,
        firstName: first_name || '',
        lastName: last_name || ''
      });

      if (!result.success) {
        console.error('Failed to create user:', result.error);
        return new Response('Error creating user', { status: 500 });
      }

      console.log('Successfully processed user.created webhook for:', userId);

    } catch (error) {
      console.error('Error in user.created webhook:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
} 