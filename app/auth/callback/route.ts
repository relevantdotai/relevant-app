import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('AuthCallback: Processing callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    console.log('AuthCallback: Exchanging code for session');
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('AuthCallback: Error:', error);
      return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
    }

    // Get the authenticated user
    const user = data.user;

    if (user) {
      // Check if user needs onboarding
      console.log('AuthCallback: Checking onboarding status for user:', user.id);
      const preferencesResult = await supabase
        .from('user_preferences')
        .select('has_completed_onboarding')
        .eq('user_id', user.id)
        .single();
      
      let preferences = preferencesResult.data;
      const error = preferencesResult.error;
      
      // If no preferences record exists, create one
      if (error && error.code === 'PGRST116') {
        console.log('AuthCallback: Creating initial user preferences for new user:', user.id);
        const { data: newPreferences } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            has_completed_onboarding: false
          })
          .select('has_completed_onboarding')
          .single();
        
        preferences = newPreferences;
      }
      
      const needsOnboarding = !preferences?.has_completed_onboarding;
      console.log('AuthCallback: User needs onboarding:', needsOnboarding);

      // Redirect to the next page if provided, otherwise check onboarding status
      if (next) {
        console.log('AuthCallback: Redirecting to:', next);
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      const redirectTo = needsOnboarding 
        ? `${requestUrl.origin}/onboarding`
        : `${requestUrl.origin}/dashboard`;
        
      console.log('AuthCallback: Success, redirecting to:', redirectTo);
      return NextResponse.redirect(redirectTo);
    }

    console.log('AuthCallback: Success, redirecting to dashboard (no user)');
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  console.log('AuthCallback: No code present, redirecting to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 