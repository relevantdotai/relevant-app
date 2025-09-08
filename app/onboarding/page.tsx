'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingPricing } from '@/components/onboarding/OnboardingPricing';
import { useOnboarding } from '@/hooks/useOnboarding';
import { motion } from 'framer-motion';
import { supabase } from '@/utils/supabase';

const AUTH_TIMEOUT = 15000; // 15 seconds

export default function OnboardingPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [authTimeout, setAuthTimeout] = useState(false);
  const { isLoading: isOnboardingLoading } = useOnboarding();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log('OnboardingPage: No user, redirecting to login');
      router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (user?.id) {
      const checkOnboarding = async () => {
        try {
          const { data } = await supabase
            .from('user_preferences')
            .select('has_completed_onboarding')
            .eq('user_id', user.id)
            .single();

          if (data?.has_completed_onboarding) {
            console.log('OnboardingPage: User has completed onboarding, redirecting to dashboard');
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error('OnboardingPage: Error checking onboarding status:', error);
        }
      };

      checkOnboarding();
    }
  }, [user?.id, router]);

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
  if (!user && (isAuthLoading || isOnboardingLoading)) {
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