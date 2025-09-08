'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome',
    description: 'Set up your account',
    completed: true
  },
  {
    id: 2,
    title: 'Choose Plan',
    description: 'Select your subscription',
    completed: false
  },
  {
    id: 3,
    title: 'Complete',
    description: 'Start using the platform',
    completed: false
  }
];

const features = [
  {
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    title: 'Premium Features',
    description: 'Access to all advanced functionality'
  },
  {
    icon: <Shield className="h-5 w-5 text-primary" />,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security and uptime'
  },
  {
    icon: <Zap className="h-5 w-5 text-primary" />,
    title: 'Lightning Fast',
    description: 'Optimized performance and speed'
  }
];

export function WelcomeContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center lg:text-left"
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          You&apos;re just one step away from accessing all the premium features. Choose the perfect plan to get started.
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Setup Progress
        </h3>
        <div className="space-y-4">
          {onboardingSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                step.id === 2 ? 'bg-primary/5 border border-primary/20' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${
                step.completed 
                  ? 'text-green-500' 
                  : step.id === 2 
                    ? 'text-primary' 
                    : 'text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Circle className={`h-6 w-6 ${step.id === 2 ? 'fill-current' : ''}`} />
                )}
              </div>
              <div>
                <h4 className={`font-medium ${
                  step.id === 2 
                    ? 'text-primary dark:text-primary-light' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Preview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl p-6 border border-primary/20"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          What You&apos;ll Get
        </h3>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Support Note */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center lg:text-left"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Need help? <a href="#" className="text-primary hover:text-primary-dark underline">Contact our support team</a>
        </p>
      </motion.div>
    </div>
  );
}