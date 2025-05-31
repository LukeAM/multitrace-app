# OAuth User Sync Setup Guide

This guide fixes the OAuth user creation loop by implementing automatic user synchronization between Clerk and Supabase.

## Problem
When users sign up via OAuth (Google, GitHub, etc.), they get created in Clerk but not in your Supabase `users` table, causing authentication loops and app failures.

## Solution
We've implemented:
1. **Clerk Webhook Handler** - Automatically syncs users when they sign up
2. **User Sync Utility** - Ensures users exist in Supabase  
3. **Frontend Protection** - Prevents authentication loops

## Setup Steps

### 1. Environment Variables
Add these to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Create Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** section
3. Click **Add Endpoint**
4. Set URL to: `https://your-domain.com/api/webhooks/clerk`
5. Subscribe to these events:
   - `user.created`
6. Copy the webhook secret to `CLERK_WEBHOOK_SECRET`

### 3. Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not anon key!)
4. Add to `SUPABASE_SERVICE_ROLE_KEY`

### 4. Test the Setup

1. Deploy your app with the new webhook endpoint
2. Try signing up with OAuth (Google, GitHub, etc.)
3. Check your Supabase `users` table - user should be created automatically
4. Check your app logs for webhook processing

## What Got Fixed

### Before
- User signs up via OAuth → Clerk creates user
- App tries to fetch user data from Supabase → User doesn't exist
- App gets stuck in authentication loop

### After  
- User signs up via OAuth → Clerk creates user
- Webhook automatically creates user in Supabase
- App loads successfully with proper user data

## Files Changed

- `app/api/webhooks/clerk/route.ts` - Webhook handler
- `lib/userSync.ts` - User synchronization utility
- `lib/supabaseClient.ts` - Improved auth hook with sync
- `app/client-page.tsx` - Cleaned up redundant user creation
- `middleware.ts` - Added webhook to public routes

## Troubleshooting

### Webhook Not Triggering
- Check webhook URL is publicly accessible
- Verify webhook secret matches Clerk dashboard
- Check Vercel/deployment logs for errors

### User Still Not Created
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase table permissions
- Look for errors in webhook logs

### App Still Looping
- Clear browser cache/localStorage
- Check console for user sync errors
- Verify user exists in both Clerk and Supabase

## Testing Locally

For local development with webhooks:
1. Use [ngrok](https://ngrok.com) to expose localhost
2. Set webhook URL to: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
3. Test OAuth signup flow 