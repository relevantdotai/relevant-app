'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface OnboardingData {
  user_id: string;
  has_completed_onboarding: boolean;
  onboarding_step?: number;
  selected_plan_id?: string;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
}

export function useOnboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onboardingCache = new Map<string, {data: OnboardingData | null, timestamp: number}>();
  const CACHE_DURATION = 30000; // 30 seconds

  const fetchOnboardingStatus = useCallback(async () => {
    if (!user?.id) {
      setOnboardingData(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = onboardingCache.get(user.id);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      setOnboardingData(cached.data);
      setSelectedPlan(cached.data?.selected_plan_id || null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select(`
          user_id,
          has_completed_onboarding,
          onboarding_step,
          selected_plan_id,
          onboarding_started_at,
          onboarding_completed_at
        `)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      const result: OnboardingData | null = data || {
        user_id: user.id,
        has_completed_onboarding: false,
        onboarding_step: 1
      };
      
      // Update cache
      onboardingCache.set(user.id, {
        data: result,
        timestamp: now
      });
      
      setOnboardingData(result);
      setSelectedPlan(result?.selected_plan_id || null);
    } catch (err) {
      setError('Failed to load onboarding status');
      setOnboardingData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateOnboardingStep = useCallback(async (step: number, planId?: string) => {
    if (!user?.id) return;

    try {
      const updateData: Partial<OnboardingData> = {
        user_id: user.id,
        onboarding_step: step
      };

      if (planId) {
        updateData.selected_plan_id = planId;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert(updateData);

      if (error) throw error;

      // Update local state
      setOnboardingData(prev => prev ? { ...prev, ...updateData } : null);
      if (planId) {
        setSelectedPlan(planId);
      }

    } catch (err) {
      console.error('Error updating onboarding step:', err);
      setError('Failed to update onboarding progress');
    }
  }, [user?.id]);

  const completeOnboarding = useCallback(async () => {
    if (!user?.id || !selectedPlan) return;
    
    setIsCompleting(true);
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          has_completed_onboarding: true,
          selected_plan_id: selectedPlan,
          onboarding_completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setOnboardingData(prev => prev ? {
        ...prev,
        has_completed_onboarding: true,
        onboarding_completed_at: new Date().toISOString()
      } : null);

      // Redirect to dashboard after completion
      router.replace('/dashboard');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete onboarding');
    } finally {
      setIsCompleting(false);
    }
  }, [user?.id, selectedPlan, router]);

  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          has_completed_onboarding: false,
          onboarding_step: 1,
          selected_plan_id: null,
          onboarding_started_at: new Date().toISOString(),
          onboarding_completed_at: null
        });

      if (error) throw error;

      // Clear cache and refetch
      onboardingCache.delete(user.id);
      await fetchOnboardingStatus();
    } catch (err) {
      console.error('Error resetting onboarding:', err);
      setError('Failed to reset onboarding');
    }
  }, [user?.id, fetchOnboardingStatus]);

  // Fetch onboarding status on mount and when user changes
  useEffect(() => {
    fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  // Listen for real-time updates to user_preferences
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('onboarding_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as OnboardingData;
          setOnboardingData(newData);
          setSelectedPlan(newData.selected_plan_id || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    onboardingData,
    selectedPlan,
    setSelectedPlan,
    isLoading,
    isCompleting,
    error,
    updateOnboardingStep,
    completeOnboarding,
    resetOnboarding,
    fetchOnboardingStatus, // Expose for manual refresh
    hasCompletedOnboarding: onboardingData?.has_completed_onboarding || false,
    currentStep: onboardingData?.onboarding_step || 1
  };
}