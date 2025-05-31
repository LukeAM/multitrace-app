import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Clerk } from '@clerk/backend';

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

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

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

    // Handle user.created
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

      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        email,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
      });

      if (userError) {
        console.error('User insert failed:', userError);
        return new Response('Failed to create user', { status: 500 });
      }

      try {
        const org = await clerk.organizations.createOrganization({
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'My Team',
          createdBy: userId,
        });
        console.log(`Created org ${org.id} for user ${userId}`);

        await clerk.organizations.updateOrganizationMembership({
          organizationId: org.id,
          userId,
          role: 'org:admin',
        });
      } catch (err) {
        console.error('Failed to create Clerk organization:', err);
        return new Response('Failed to create organization', { status: 500 });
      }
    }

    // Handle organization.created
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

    // Handle organizationMembership.created
    if (type === 'organizationMembership.created') {
      const { organization, public_user_data, role } = data;
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
          role: role === 'org:admin' ? 'owner' : 'member',
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