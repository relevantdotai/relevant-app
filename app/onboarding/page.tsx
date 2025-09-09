'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingPricing } from '@/components/onboarding/OnboardingPricing';
import { useNavigation } from '@/hooks/useNavigation';
import { motion } from 'framer-motion';

const AUTH_TIMEOUT = 15000; // 15 seconds

export default function OnboardingPage() {
  const { user } = useAuth();
  const { redirectIfNeeded, isLoading } = useNavigation();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Centralized navigation logic
  useEffect(() => {
    redirectIfNeeded('/onboarding');
  }, [redirectIfNeeded]);

  // Set auth timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && isLoading) {
        setAuthTimeout(true);
      }
    }, AUTH_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [user, isLoading]);

  // Show loading state
  if (isLoading) {
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