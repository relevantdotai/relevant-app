'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowUp, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceId: string; // Stripe Price ID
  price: string;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface UpgradePlansProps {
  currentPlan: string;
  onUpgrade: (priceId: string, planName: string) => Promise<void>;
  isUpgrading: boolean;
}

export function UpgradePlans({ currentPlan, onUpgrade, isUpgrading }: UpgradePlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmationPlan, setConfirmationPlan] = useState<Plan | null>(null);

  // Define your available plans with their Stripe Price IDs
  const plans: Plan[] = [
    {
      id: 'pro',
      name: 'Pro',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!, // Your Stripe Price ID
      price: '$19',
      interval: '/month',
      description: 'Perfect for small teams and startups',
      features: [
        'All template features',
        'Priority support',
        'Custom branding',
        'Analytics dashboard',
        'Team collaboration'
      ],
      current: currentPlan === 'pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID!, // Your Stripe Price ID
      price: '$49',
      interval: '/month',
      description: 'For larger organizations',
      features: [
        'Everything in Pro',
        'Advanced security',
        'Custom integrations',
        '24/7 support',
        'SLA guarantee'
      ],
      popular: true,
      current: currentPlan === 'enterprise'
    }
  ];

  const handlePlanClick = (plan: Plan) => {
    if (plan.current || isUpgrading) return;
    setConfirmationPlan(plan);
  };

  const handleConfirmChange = async () => {
    if (!confirmationPlan || isUpgrading) return;
    
    setSelectedPlan(confirmationPlan.id);
    try {
      await onUpgrade(confirmationPlan.priceId, confirmationPlan.name);
      setConfirmationPlan(null);
    } finally {
      setSelectedPlan(null);
    }
  };

  const handleCancelConfirmation = () => {
    if (!isUpgrading) {
      setConfirmationPlan(null);
    }
  };

  const isCurrentPlanUpgradable = (planId: string) => {
    const currentIndex = plans.findIndex(p => p.current);
    const targetIndex = plans.findIndex(p => p.id === planId);
    return targetIndex > currentIndex;
  };

  const isCurrentPlanDowngradable = (planId: string) => {
    const currentIndex = plans.findIndex(p => p.current);
    const targetIndex = plans.findIndex(p => p.id === planId);
    return targetIndex < currentIndex;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Change Your Plan</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Upgrade or downgrade to a plan that fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const canUpgrade = isCurrentPlanUpgradable(plan.id);
          const canDowngrade = isCurrentPlanDowngradable(plan.id);
          const canChange = canUpgrade || canDowngrade;
          const isCurrentlyUpgrading = selectedPlan === plan.id && isUpgrading;
          
          return (
            <motion.div
              key={plan.id}
              className={`relative border rounded-lg p-6 ${
                plan.popular 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
              whileHover={{ scale: canChange ? 1.02 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 text-sm rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 text-sm rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-500">
                    {plan.interval}
                  </span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                {plan.current ? (
                  <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg">
                    Your Current Plan
                  </div>
                ) : canUpgrade ? (
                  <button
                    onClick={() => handlePlanClick(plan)}
                    disabled={isUpgrading}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isCurrentlyUpgrading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      <>
                        <ArrowUp size={16} />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </button>
                ) : canDowngrade ? (
                  <button
                    onClick={() => handlePlanClick(plan)}
                    disabled={isUpgrading}
                    className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isCurrentlyUpgrading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Downgrading...
                      </>
                    ) : (
                      <>
                        <ArrowUp size={16} className="rotate-180" />
                        Downgrade to {plan.name}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg">
                    Lower Tier
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          * Plan changes are prorated. For upgrades, you&apos;ll pay the difference. For downgrades, you&apos;ll receive credit.
        </p>
        <p className="mt-1">
          Your next billing date will remain the same.
        </p>
      </div>

      {/* Confirmation Modal */}
      {confirmationPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold mb-2">
                {isCurrentPlanUpgradable(confirmationPlan.id) ? 'Confirm Upgrade' : 'Confirm Downgrade'}
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                {isCurrentPlanUpgradable(confirmationPlan.id) 
                  ? `Upgrade to ${confirmationPlan.name} for ${confirmationPlan.price}${confirmationPlan.interval}?`
                  : `Downgrade to ${confirmationPlan.name} for ${confirmationPlan.price}${confirmationPlan.interval}?`
                }
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <h5 className="font-medium mb-2">What happens next:</h5>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {isCurrentPlanUpgradable(confirmationPlan.id) ? (
                  <>
                    <li>• You&apos;ll be charged the prorated difference</li>
                    <li>• Your billing date stays the same</li>
                    <li>• New features activate immediately</li>
                  </>
                ) : (
                  <>
                    <li>• You&apos;ll receive prorated credit</li>
                    <li>• Your billing date stays the same</li>
                    <li>• Changes take effect immediately</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelConfirmation}
                disabled={isUpgrading}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                disabled={isUpgrading}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 ${
                  isCurrentPlanUpgradable(confirmationPlan.id)
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {selectedPlan === confirmationPlan.id && isUpgrading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isCurrentPlanUpgradable(confirmationPlan.id) ? 'Upgrading...' : 'Downgrading...'}
                  </>
                ) : (
                  <>
                    {isCurrentPlanUpgradable(confirmationPlan.id) ? 'Confirm Upgrade' : 'Confirm Downgrade'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}