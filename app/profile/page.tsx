'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { AccountManagement } from '@/components/AccountManagement';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { StripeBuyButton } from '@/components/StripeBuyButton';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { UpgradePlans } from '@/components/UpgradePlans';
// import { PricingSection } from '@/components/PricingSection';

function ProfileContent() {
  const { user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, syncWithStripe, fetchSubscription } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { isInTrial, trialEndTime } = useTrialStatus();

  // Show payment success message if redirected from successful payment
  useEffect(() => {
    if (paymentStatus === 'success') {
      // Could add a toast notification here
    }
  }, [paymentStatus]);

  // Add error handling for subscription sync
  useEffect(() => {
    if (subscription?.stripe_subscription_id) {
      try {
        syncWithStripe(subscription.stripe_subscription_id);
      } catch (err: unknown) {
        console.error('Error syncing with Stripe:', err);
        setError('Unable to load subscription details');
      }
    }
  }, [syncWithStripe, subscription?.stripe_subscription_id]);

  // Add loading timeout with auto-refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let refreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 3;
    const REFRESH_INTERVAL = 3000; // 3 seconds
    
    const attemptRefresh = async () => {
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        refreshAttempts++;
        await fetchSubscription();
        
        // If still loading, schedule next attempt
        if (isLoadingSubscription) {
          timeoutId = setTimeout(attemptRefresh, REFRESH_INTERVAL);
        }
      } else {
        setError('Loading subscription is taking longer than expected. Please refresh the page.');
      }
    };

    if (isLoadingSubscription) {
      timeoutId = setTimeout(attemptRefresh, REFRESH_INTERVAL);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoadingSubscription, fetchSubscription]);

  // Add useEffect for auth check
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Add refresh effect
  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id, fetchSubscription]);

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription.stripe_subscription_id 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      setIsCancelModalOpen(false);
      // Force fresh fetch to bypass cache and update the UI
      await fetchSubscription(true);
      // Stop spinning after data is refreshed
      setIsCancelling(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;
    
    setIsReactivating(true);
    try {
      const response = await fetch('/api/stripe/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription.stripe_subscription_id 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to reactivate subscription');
      
      // Force fresh fetch to bypass cache and update the UI
      await fetchSubscription(true);
      // Stop spinning after data is refreshed
      setIsReactivating(false);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setIsReactivating(false);
    }
  };

  const handleUpgrade = async (newPriceId: string, planName: string) => {
    if (!subscription?.stripe_subscription_id) return;
    
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription.stripe_subscription_id,
          newPriceId,
          prorate: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade subscription');
      }
      
      const result = await response.json();
      
      // Show success message
      const action = planName.toLowerCase().includes('enterprise') && 
                    getCurrentPlanId() === 'pro' ? 'upgraded' : 'changed';
      
      if (result.prorationAmount > 0) {
        setSuccessMessage(
          `Successfully ${action} to ${planName}! Prorated charge: $${(result.prorationAmount / 100).toFixed(2)}`
        );
      } else if (result.prorationAmount < 0) {
        setSuccessMessage(
          `Successfully ${action} to ${planName}! Credit applied: $${Math.abs(result.prorationAmount / 100).toFixed(2)}`
        );
      } else {
        setSuccessMessage(`Successfully ${action} to ${planName}!`);
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Force fresh fetch to update the UI
      await fetchSubscription(true);
      setShowUpgradePlans(false);
    } catch (error) {
      console.error('Error changing subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to change subscription plan');
      
      // Auto-hide error after 8 seconds
      setTimeout(() => setError(null), 8000);
    } finally {
      setIsUpgrading(false);
    }
  };

  const getCurrentPlanId = () => {
    // Map your product names to plan IDs - be more flexible with matching
    if (!subscription?.product_name) return null;
    
    const productName = subscription.product_name.toLowerCase();
    
    // Handle different variations of plan names
    if (productName.includes('pro')) return 'pro';
    if (productName.includes('enterprise')) return 'enterprise';
    
    // Default fallback - if we don't recognize it, assume it's the lowest tier
    return 'pro';
  };


  const canChangePlan = () => {
    // Show change plan options if user has an active subscription
    // This includes both upgrades and downgrades
    return subscription && 
           subscription.status === 'active' && 
           getCurrentPlanId();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4 mx-auto"></div>
          <p className="text-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-red-500">
          Failed to load subscription details. Please try refreshing.
        </div>
      }
    >
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-8 max-w-4xl mx-auto">
        {paymentStatus === 'success' && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p className="text-green-600 dark:text-green-400">
              🎉 Thank you for your subscription! Your payment was successful.
            </p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p className="text-green-600 dark:text-green-400">
              🎉 {successMessage}
            </p>
          </div>
        )}
        
        {error && !isLoadingSubscription && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <p className="text-red-600 dark:text-red-400">
              ❌ {error}
            </p>
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <AccountManagement />

        {/* Subscription Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
          {isLoadingSubscription ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading subscription details...</span>
            </div>
          ) : subscription ? (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`${subscription.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </p>
              <p><span className="font-medium">Started:</span> {new Date(subscription.created_at).toLocaleDateString()}</p>
              
              {subscription.status === 'canceled' ? (
                <div className="mt-4">
                  <Link
                    href="/pay"
                    className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full shadow-subtle hover:shadow-hover transition-all"
                  >
                    Resubscribe
                  </Link>
                </div>
              ) : subscription.cancel_at_period_end ? (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                    Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                  <button
                    onClick={handleReactivateSubscription}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={isReactivating}
                  >
                    {isReactivating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Reactivating...
                      </>
                    ) : (
                      'Resume Subscription'
                    )}
                  </button>
                </div>
              ) : (subscription.status === 'active' || subscription.status === 'trialing') ? (
                <div className="mt-4 flex gap-4">
                  {canChangePlan() && (
                    <button
                      onClick={() => setShowUpgradePlans(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Change Plan
                    </button>
                  )}
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel Subscription
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {isInTrial ? (
                <>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    You are currently in your 48-hour trial period. Your trial will end on {' '}
                    {trialEndTime ? new Date(trialEndTime).toLocaleDateString() : 'soon'}.
                  </p>
                  <p>Subscribe now to continue using the app after the trial ends.</p>
                </>
              ) : trialEndTime ? (
                <>
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg mb-4">
                    <p className="text-red-600 dark:text-red-400">
                      Your trial period ended on {new Date(trialEndTime).toLocaleDateString()}.
                    </p>
                    <p className="mt-2">Subscribe now to regain access to the cooking experience.</p>
                  </div>
                </>
              ) : (
                <p>Subscribe to unlock the amazing cooking experience.</p>
              )}
              
              <StripeBuyButton
                buyButtonId={process.env.NEXT_PUBLIC_STRIPE_BUTTON_ID || ''}
                publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
              />
            </div>
          )}
        </div>

        {/* Change Plans Modal */}
        {showUpgradePlans && canChangePlan() && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Change Your Plan</h3>
                <button
                  onClick={() => setShowUpgradePlans(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isUpgrading}
                >
                  ✕
                </button>
              </div>
              
              <UpgradePlans
                currentPlan={getCurrentPlanId() || ''}
                onUpgrade={handleUpgrade}
                isUpgrading={isUpgrading}
              />
            </div>
          </div>
        )}

        {/* Show pricing section if user doesn't have an active subscription */}
        {/* {(!subscription || subscription.status === 'canceled') && (
          <PricingSection showFullDetails={true} />
        )} */}

        {/* Cancel Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Cancel Subscription?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You&apos;ll continue to have access until the end of your billing period on {new Date(subscription?.current_period_end || '').toLocaleDateString()}. No refunds are provided for cancellations.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  disabled={isCancelling}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};


export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileContent />
    </Suspense>
  );
}
