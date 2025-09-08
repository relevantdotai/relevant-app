import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function OnboardingSuccessPage() {
  console.log('OnboardingSuccess: Processing payment completion');
  
  // Get the authenticated user
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('OnboardingSuccess: No user found, redirecting to login');
    redirect('/login');
  }

  try {
    console.log('OnboardingSuccess: Marking onboarding as complete for user:', user.id);
    
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
      console.log('OnboardingSuccess: Syncing subscription status with Stripe');
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
  console.log('OnboardingSuccess: Redirecting to dashboard');
  redirect('/dashboard');
}