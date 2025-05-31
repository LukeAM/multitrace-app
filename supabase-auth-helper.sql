-- Function to extract Clerk user ID from request headers
CREATE OR REPLACE FUNCTION auth.clerk_user_id() 
RETURNS text AS $$
BEGIN
  RETURN coalesce(
    current_setting('request.headers.x-clerk-user-id', true)::text,
    ''
  );
END;
$$ LANGUAGE plpgsql;

-- Function to modify auth.uid() to return the Clerk user ID if present
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid AS $$
DECLARE
  clerk_id text;
BEGIN
  -- Check for a Clerk user ID first
  clerk_id := auth.clerk_user_id();
  
  -- If we have a Clerk ID, use it; otherwise fall back to original auth.uid()
  IF clerk_id != '' THEN
    RETURN clerk_id::uuid; -- You might need to cast based on your user ID format
  ELSE
    -- Fall back to original auth.uid() behavior
    RETURN (SELECT id FROM auth.users WHERE id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT auth.clerk_user_id() AS clerk_user_id; 