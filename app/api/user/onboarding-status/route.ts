import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check onboarding status
    const preferencesResult = await supabase
      .from('user_preferences')
      .select('has_completed_onboarding')
      .eq('user_id', user.id)
      .single();

    let preferences = preferencesResult.data;
    const error = preferencesResult.error;

    // If no preferences record exists, create one
    if (error && error.code === 'PGRST116') {
      console.log('API: Creating initial user preferences for user:', user.id);
      const { data: newPreferences, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          has_completed_onboarding: false
        })
        .select('has_completed_onboarding')
        .single();
      
      if (insertError) {
        console.error('API: Error creating preferences:', insertError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      preferences = newPreferences;
    } else if (error) {
      console.error('API: Error fetching preferences:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        has_completed_onboarding: preferences?.has_completed_onboarding || false
      }
    });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}