-- Step 1: Create a function to extract Clerk user ID from request headers
CREATE OR REPLACE FUNCTION public.clerk_user_id() 
RETURNS uuid AS $$
DECLARE
  clerk_id text;
BEGIN
  clerk_id := coalesce(
    current_setting('request.headers.x-clerk-user-id', true)::text,
    ''
  );
  
  IF clerk_id = '' THEN
    RETURN NULL;
  ELSE
    RETURN clerk_id::uuid;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT public.clerk_user_id() AS clerk_user_id;

-- Step 2: Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for projects
DROP POLICY IF EXISTS "Access own projects" ON public.projects;
CREATE POLICY "Access own projects" ON public.projects
  FOR SELECT USING (owner_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Insert own projects" ON public.projects;
CREATE POLICY "Insert own projects" ON public.projects
  FOR INSERT WITH CHECK (owner_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Update own projects" ON public.projects;
CREATE POLICY "Update own projects" ON public.projects
  FOR UPDATE USING (owner_id = public.clerk_user_id()) 
  WITH CHECK (owner_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Delete own projects" ON public.projects;
CREATE POLICY "Delete own projects" ON public.projects
  FOR DELETE USING (owner_id = public.clerk_user_id());

-- Step 4: Create policies for files
DROP POLICY IF EXISTS "Select own files" ON public.files;
CREATE POLICY "Select own files" ON public.files
  FOR SELECT USING (created_by = public.clerk_user_id());

DROP POLICY IF EXISTS "Insert own files" ON public.files;
CREATE POLICY "Insert own files" ON public.files
  FOR INSERT WITH CHECK (created_by = public.clerk_user_id());

DROP POLICY IF EXISTS "Update own files" ON public.files;
CREATE POLICY "Update own files" ON public.files
  FOR UPDATE USING (created_by = public.clerk_user_id())
  WITH CHECK (created_by = public.clerk_user_id());

DROP POLICY IF EXISTS "Delete own files" ON public.files;
CREATE POLICY "Delete own files" ON public.files
  FOR DELETE USING (created_by = public.clerk_user_id());

-- Step 5: Create policies for file_versions
DROP POLICY IF EXISTS "Select own file_versions" ON public.file_versions;
CREATE POLICY "Select own file_versions" ON public.file_versions
  FOR SELECT USING (created_by = public.clerk_user_id());

DROP POLICY IF EXISTS "Insert own file_versions" ON public.file_versions;
CREATE POLICY "Insert own file_versions" ON public.file_versions
  FOR INSERT WITH CHECK (created_by = public.clerk_user_id());

DROP POLICY IF EXISTS "Update own file_versions" ON public.file_versions;
CREATE POLICY "Update own file_versions" ON public.file_versions
  FOR UPDATE USING (created_by = public.clerk_user_id())
  WITH CHECK (created_by = public.clerk_user_id());

DROP POLICY IF EXISTS "Delete own file_versions" ON public.file_versions;
CREATE POLICY "Delete own file_versions" ON public.file_versions
  FOR DELETE USING (created_by = public.clerk_user_id());

-- Step 6: Create policies for agents
DROP POLICY IF EXISTS "Select own agents" ON public.agents;
CREATE POLICY "Select own agents" ON public.agents
  FOR SELECT USING (owner_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Insert own agents" ON public.agents;
CREATE POLICY "Insert own agents" ON public.agents
  FOR INSERT WITH CHECK (owner_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Update own agents" ON public.agents;
CREATE POLICY "Update own agents" ON public.agents
  FOR UPDATE USING (owner_id = public.clerk_user_id())
  WITH CHECK (owner_id = public.clerk_user_id());

-- Step 7: Create policies for copilot_sessions
DROP POLICY IF EXISTS "Select own copilot sessions" ON public.copilot_sessions;
CREATE POLICY "Select own copilot sessions" ON public.copilot_sessions
  FOR SELECT USING (user_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Insert own copilot sessions" ON public.copilot_sessions;
CREATE POLICY "Insert own copilot sessions" ON public.copilot_sessions
  FOR INSERT WITH CHECK (user_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Update own copilot sessions" ON public.copilot_sessions;
CREATE POLICY "Update own copilot sessions" ON public.copilot_sessions
  FOR UPDATE USING (user_id = public.clerk_user_id())
  WITH CHECK (user_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Delete own copilot sessions" ON public.copilot_sessions;
CREATE POLICY "Delete own copilot sessions" ON public.copilot_sessions
  FOR DELETE USING (user_id = public.clerk_user_id());

-- Step 8: Create policies for copilot_messages
DROP POLICY IF EXISTS "Access copilot messages from own sessions" ON public.copilot_messages;
CREATE POLICY "Access copilot messages from own sessions" ON public.copilot_messages
  FOR SELECT USING (session_id IN (
    SELECT id FROM public.copilot_sessions WHERE user_id = public.clerk_user_id()
  ));

DROP POLICY IF EXISTS "Insert copilot messages for own sessions" ON public.copilot_messages;
CREATE POLICY "Insert copilot messages for own sessions" ON public.copilot_messages
  FOR INSERT WITH CHECK (session_id IN (
    SELECT id FROM public.copilot_sessions WHERE user_id = public.clerk_user_id()
  ));

DROP POLICY IF EXISTS "Update copilot messages from own sessions" ON public.copilot_messages;
CREATE POLICY "Update copilot messages from own sessions" ON public.copilot_messages
  FOR UPDATE USING (session_id IN (
    SELECT id FROM public.copilot_sessions WHERE user_id = public.clerk_user_id()
  ))
  WITH CHECK (session_id IN (
    SELECT id FROM public.copilot_sessions WHERE user_id = public.clerk_user_id()
  ));

DROP POLICY IF EXISTS "Delete copilot messages from own sessions" ON public.copilot_messages;
CREATE POLICY "Delete copilot messages from own sessions" ON public.copilot_messages
  FOR DELETE USING (session_id IN (
    SELECT id FROM public.copilot_sessions WHERE user_id = public.clerk_user_id()
  ));

-- Step 9: Create policies for accounts and team_members
DROP POLICY IF EXISTS "Allow select for all users" ON public.accounts;
CREATE POLICY "Allow select for all users" ON public.accounts
  FOR SELECT USING (public.clerk_user_id() IS NOT NULL);

DROP POLICY IF EXISTS "Select team members" ON public.team_members;
CREATE POLICY "Select team members" ON public.team_members
  FOR SELECT USING (user_id = public.clerk_user_id()); 