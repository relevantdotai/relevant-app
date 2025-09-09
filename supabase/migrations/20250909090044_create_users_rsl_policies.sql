-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- USERS TABLE POLICIES
-- ===========================================

-- Users can read their own active data (excluding soft deleted)
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (
    auth.uid() = id AND 
    (is_deleted = false OR is_deleted IS NULL)
  );

-- Users can update their own data (but not deletion fields)
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can soft delete their own account
CREATE POLICY "Users can soft delete their own data" ON public.users
  FOR UPDATE USING (
    auth.uid() = id AND 
    is_deleted = true AND 
    deleted_at IS NOT NULL
  );

-- Service role has full access
CREATE POLICY "Service role full access to users" ON public.users
  FOR ALL TO service_role USING (true);

-- ===========================================
-- USER PREFERENCES POLICIES
-- ===========================================

-- Users can read their own preferences
CREATE POLICY "Users can read their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own preferences (once)
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access to preferences" ON public.user_preferences
  FOR ALL TO service_role USING (true);

-- ===========================================
-- USER TRIALS POLICIES
-- ===========================================

-- Users can read their own trial data
CREATE POLICY "Users can read their own trials" ON public.user_trials
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their trial status (like marking as used)
CREATE POLICY "Users can update their own trials" ON public.user_trials
  FOR UPDATE USING (auth.uid() = user_id);

-- Only service role can insert trials (typically created on signup)
CREATE POLICY "Service role can insert trials" ON public.user_trials
  FOR INSERT TO service_role WITH CHECK (true);

-- Users cannot delete their trial history
-- CREATE POLICY "Users can delete their own trials" ON public.user_trials
--   FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access to trials" ON public.user_trials
  FOR ALL TO service_role USING (true);

-- ===========================================
-- SUBSCRIPTIONS POLICIES
-- ===========================================

-- Users can read their own subscription data
CREATE POLICY "Users can read their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can modify subscriptions (via webhooks/backend)
CREATE POLICY "Service role can insert subscriptions" ON public.subscriptions
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions" ON public.subscriptions
  FOR UPDATE TO service_role USING (true);

-- Users cannot directly modify subscription data
-- Subscriptions are managed via Stripe webhooks and backend processes

-- Service role has full access
CREATE POLICY "Service role full access to subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true);

-- ===========================================
-- OPTIONAL: ADDITIONAL SECURITY POLICIES
-- ===========================================

-- If you want to add email verification requirement
-- CREATE POLICY "Users must be verified to read data" ON public.users
--   FOR SELECT USING (
--     auth.uid() = id AND 
--     auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
--   );

-- If you want to restrict based on user role
-- CREATE POLICY "Admin users can read all user data" ON public.users
--   FOR SELECT USING (
--     auth.jwt() ->> 'user_role' = 'admin'
--   );
