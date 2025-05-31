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
  console.log('=== Clerk Webhook Called ===');
  
  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    console.log('Webhook headers:', {
      svix_id: svix_id ? 'present' : 'missing',
      svix_timestamp: svix_timestamp ? 'present' : 'missing',
      svix_signature: svix_signature ? 'present' : 'missing'
    });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing svix headers');
      return new Response('Error occured -- no svix headers', {
        status: 400
      });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);
    console.log('Webhook payload type:', payload.type);

    // Simple webhook verification without svix package
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
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
      
      console.log('Webhook signature verified successfully');
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
        
        console.log('Processing user.created webhook:', {
          userId,
          email_addresses: email_addresses?.map(e => e.email_address),
          first_name,
          last_name
        });
        
        const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
        const emailAddress = primaryEmail?.email_address || '';
        
        if (!emailAddress) {
          console.error('No email address found for user:', userId);
          return new Response('No email address found', { status: 400 });
        }
        
        // Test Supabase connection first
        console.log('Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
          
        if (testError) {
          console.error('Supabase connection test failed:', testError);
          return new Response('Supabase connection failed: ' + testError.message, { status: 500 });
        }
        
        console.log('Supabase connection successful, creating user...');
        
        const result = await ensureUserExists(supabase, {
          id: userId,
          email: emailAddress,
          firstName: first_name || '',
          lastName: last_name || ''
        });

        if (!result.success) {
          console.error('Failed to create user:', result.error);
          
          // Try to get more details about the error
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
            
          if (existingUser) {
            console.log('User actually exists after "failed" creation:', existingUser);
            // User exists, consider this a success
          } else {
            console.error('User creation genuinely failed. Check error:', result.error);
            console.error('Additional check error:', checkError);
            return new Response('Error creating user: ' + result.error, { status: 500 });
          }
        }

        console.log('Successfully processed user.created webhook for:', userId);
        
        // Verify the user was actually created
        const { data: verifyUser, error: verifyError } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', userId)
          .single();
          
        if (verifyUser) {
          console.log('User creation verified:', verifyUser);
        } else {
          console.error('User verification failed:', verifyError);
        }

      } catch (error) {
        console.error('Error in user.created webhook:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        return new Response('Error creating user: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
      }
    } else {
      console.log('Ignoring webhook event type:', eventType);
    }

    return new Response('', { status: 200 });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return new Response('Internal server error', { status: 500 });
  }
} 