'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface OnboardingPricingProps {
  userId: string;
  userEmail: string;
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  interval?: string;
  description: string;
  features: string[];
  popular: boolean;
  stripePaymentLink: string | null;
  cta: string;
}

export function OnboardingPricing({ userId, userEmail }: OnboardingPricingProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Pricing tiers with Stripe Payment Links
  const pricingTiers: PricingTier[] = [
    {
      id: 'pro',
      name: 'Pro',
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
      popular: false,
      stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK!,
      cta: 'Get Started'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
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
      stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PAYMENT_LINK!,
      cta: 'Start Trial'
    },
    {
      id: 'custom',
      name: 'Custom',
      price: 'Custom',
      interval: '',
      description: 'Tailored to your needs',
      features: [
        'Custom development',
        'Dedicated support',
        'Custom SLA',
        'On-premise options',
        'Training sessions'
      ],
      popular: false,
      stripePaymentLink: null,
      cta: 'Contact Sales'
    }
  ];

  const handlePlanSelect = async (tier: PricingTier) => {
    if (!tier.stripePaymentLink) {
      // Handle custom plan - redirect to contact form
      router.push('/contact-sales');
      return;
    }

    setIsLoading(tier.id);
    
    try {
      // Track selection in database
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          selected_plan_id: tier.id,
          onboarding_step: 2,
          onboarding_started_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking plan selection:', error);
      }

      // Redirect to Stripe Payment Link with prefilled data
      const paymentUrl = new URL(tier.stripePaymentLink);
      paymentUrl.searchParams.set('prefilled_email', userEmail);
      paymentUrl.searchParams.set('client_reference_id', userId);
      
      console.log('Redirecting to Stripe Payment Link:', paymentUrl.toString());
      window.location.href = paymentUrl.toString();
    } catch (error) {
      console.error('Error processing plan selection:', error);
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          Choose Your Plan
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 dark:text-gray-400 mt-2"
        >
          Select the perfect plan to get started
        </motion.p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-lg p-6 border-2 transition-all duration-300 ${
              tier.popular 
                ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-105' 
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-sm px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {tier.name}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {tier.description}
            </p>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {tier.price}
              </span>
              {tier.interval && (
                <span className="ml-1 text-gray-600 dark:text-gray-400">
                  {tier.interval}
                </span>
              )}
            </div>
            
            <ul className="mt-6 space-y-3">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlanSelect(tier)}
              disabled={isLoading === tier.id}
              className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                tier.popular
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
              }`}
            >
              {isLoading === tier.id ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Redirecting...
                </div>
              ) : (
                tier.cta
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Trust indicators */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          🔒 Secure payment powered by Stripe • Cancel anytime • 30-day money-back guarantee
        </p>
      </motion.div>
    </div>
  );
}