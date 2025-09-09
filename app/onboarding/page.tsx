'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingPricing } from '@/components/onboarding/OnboardingPricing';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { motion } from 'framer-motion';
import { supabase } from '@/utils/supabase';

const AUTH_TIMEOUT = 15000; // 15 seconds

export default function OnboardingPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [authTimeout, setAuthTimeout] = useState(false);
  const { hasCompletedOnboarding, selectedPlan, isLoading: isOnboardingLoading } = useOnboarding();
  const { subscription, isLoading: isSubLoading } = useSubscription();
  const { hasSubscription, isInTrial, isLoading: isTrialLoading } = useTrialStatus();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log('OnboardingPage: No user, redirecting to login');
      router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  // Check if user has already completed onboarding or has valid subscription/trial
  useEffect(() => {
    if (user?.id && !isOnboardingLoading && !isSubLoading && !isTrialLoading) {
      console.log('OnboardingPage: Checking access', {
        hasCompletedOnboarding,
        selectedPlan,
        hasSubscription,
        isInTrial,
        subscriptionStatus: subscription?.status
      });

      // Redirect to dashboard if:
      // 1. User has completed onboarding AND has selected a plan
      // 2. OR user has an active subscription
      // 3. OR user is in trial period
      const hasValidAccess = hasSubscription || isInTrial;
      const hasCompletedOnboardingFlow = hasCompletedOnboarding && selectedPlan;

      if (hasValidAccess || hasCompletedOnboardingFlow) {
        console.log('OnboardingPage: User has valid access, redirecting to dashboard');
        router.replace('/dashboard');
      }
    }
  }, [
    user?.id, 
    hasCompletedOnboarding, 
    selectedPlan, 
    hasSubscription, 
    isInTrial, 
    subscription?.status,
    isOnboardingLoading, 
    isSubLoading, 
    isTrialLoading, 
    router
  ]);

  // Set auth timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && isAuthLoading) {
        setAuthTimeout(true);
      }
    }, AUTH_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [user, isAuthLoading]);

  // Show loading state
  if (!user && (isAuthLoading || isOnboardingLoading || isSubLoading || isTrialLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-foreground">
            {authTimeout ? 
              "Taking longer than usual? Try refreshing the page 😊." :
              "Loading onboarding..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      <OnboardingLayout>
        <OnboardingPricing 
          userId={user.id} 
          userEmail={user.email || ''} 
        />
      </OnboardingLayout>
    </motion.div>
  );
}