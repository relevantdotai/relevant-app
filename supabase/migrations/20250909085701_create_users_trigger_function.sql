CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at, is_deleted)
    VALUES (NEW.id, NEW.email, NOW(), NOW(), FALSE);
    
    INSERT INTO public.user_preferences (user_id, has_completed_onboarding)
    VALUES (NEW.id, FALSE);
    
    INSERT INTO public.user_trials (user_id, trial_start_time, trial_end_time)
    VALUES (NEW.id, NOW(), NOW() + INTERVAL '48 hours');
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();