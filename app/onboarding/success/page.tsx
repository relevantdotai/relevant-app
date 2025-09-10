import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function OnboardingSuccessPage() {
  // Get the authenticated user
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    // Mark onboarding as complete
    const { error: onboardingError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        has_completed_onboarding: true,
        onboarding_completed_at: new Date().toISOString()
      });

    if (onboardingError) {
      console.error('OnboardingSuccess: Error updating onboarding status:', onboardingError);
    }

    // Sync subscription status from Stripe
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        console.error('OnboardingSuccess: Failed to sync subscription:', response.status);
      }
    } catch (syncError) {
      console.error('OnboardingSuccess: Subscription sync error:', syncError);
      // Don't fail the onboarding completion if sync fails
    }

  } catch (error) {
    console.error('OnboardingSuccess: Error processing completion:', error);
  }

  // Always redirect to dashboard after processing
  redirect('/dashboard');
}