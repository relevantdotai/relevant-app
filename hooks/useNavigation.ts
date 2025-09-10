'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrialStatus } from '@/hooks/useTrialStatus';

export function useNavigation() {
  const { user, isSubscriber, isLoading: isAuthLoading } = useAuth();
  const { hasCompletedOnboarding, selectedPlan, isLoading: isOnboardingLoading } = useOnboarding();
  const { subscription, isLoading: isSubLoading } = useSubscription();
  const { isLoading: isTrialLoading } = useTrialStatus();
  const router = useRouter();

  const isLoading = isAuthLoading || isOnboardingLoading || isSubLoading || isTrialLoading;

  // Single source of truth for where user should be
  const getDestination = () => {
    if (!user) {
      return '/login';
    }
    
    // Simple: If no subscription, go to onboarding (ignore trial)
    if (!isSubscriber) {
      return '/onboarding';
    }
    
    // If has subscription, go to dashboard
    return '/dashboard';
  };

  const redirectIfNeeded = (currentPath: string) => {
    if (isLoading) return;
    
    const destination = getDestination();
    
    if (currentPath !== destination) {
      router.replace(destination);
    }
  };

  const shouldShowPage = (currentPath: string) => {
    if (isLoading) {
      // During loading, don't show dashboard if user clearly has no subscription
      if (currentPath === '/dashboard' && user && !isSubscriber) {
        return false;
      }
      return true;
    }
    
    // After loading, show page only if user should be there
    return getDestination() === currentPath;
  };

  return {
    redirectIfNeeded,
    getDestination,
    shouldShowPage,
    isLoading
  };
}