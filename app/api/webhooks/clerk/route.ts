import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { ensureUserExists } from '@/lib/userSync';
// commends for change
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

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const headerPayload = headers();

    const svixId = headerPayload.get('svix-id')!;
    const svixTimestamp = headerPayload.get('svix-timestamp')!;
    const svixSignature = headerPayload.get('svix-signature')!;

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    let evt: WebhookEvent;
    try {
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    const { type, data } = evt;

    // 1. Handle user.created
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
        console.error('User insert failed:', result.error);
        return new Response('Failed to create user', { status: 500 });
      }
    }

    // 2. Handle organization.created
    if (type === 'organization.created') {
      const { id: orgId, name } = data;

      const { error } = await supabase.from('teams').insert([
        {
          id: orgId,
          name,
        },
      ]);

      if (error) {
        console.error('Failed to create team:', error);
        return new Response('Failed to create team', { status: 500 });
      }
    }

    // 3. Handle organizationMembership.created
    if (type === 'organizationMembership.created') {
      const { organization, public_user_data } = data;
      const userId = public_user_data?.user_id;
      const teamId = organization?.id;

      if (!userId || !teamId) {
        console.error('Missing userId or teamId');
        return new Response('Missing membership info', { status: 400 });
      }

      const { error } = await supabase.from('team_members').insert([
        {
          user_id: userId,
          team_id: teamId,
          role: 'member',
          joined_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Failed to create team member:', error);
        return new Response('Failed to create team member', { status: 500 });
      }
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
