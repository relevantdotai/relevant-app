import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
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
      const preferencesResult = await supabase
        .from('user_preferences')
        .select('has_completed_onboarding')
        .eq('user_id', user.id)
        .single();
      
      let preferences = preferencesResult.data;
      const error = preferencesResult.error;
      
      // If no preferences record exists, create one
      if (error && error.code === 'PGRST116') {
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

      // Redirect to the next page if provided, otherwise check onboarding status
      if (next) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      const redirectTo = needsOnboarding 
        ? `${requestUrl.origin}/onboarding`
        : `${requestUrl.origin}/dashboard`;
        
      return NextResponse.redirect(redirectTo);
    }

    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 