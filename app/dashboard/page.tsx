"use client";

// import { useWebSocket } from '@/contexts/WebSocketContext';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
// import { OnboardingTour } from '@/components/OnboardingTour';
import { useNavigation } from '@/hooks/useNavigation';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Settings,
  PlusCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';


// Dashboard metrics data
const dashboardMetrics = [
  {
    title: "Total Users",
    value: "1,234",
    change: "+12.3%",
    icon: <Users className="h-6 w-6 text-primary" />,
    trend: "up"
  },
  {
    title: "Revenue",
    value: "$12.4k",
    change: "+8.2%",
    icon: <CreditCard className="h-6 w-6 text-primary" />,
    trend: "up"
  },
  {
    title: "Active Sessions",
    value: "432",
    change: "-3.1%",
    icon: <Activity className="h-6 w-6 text-primary" />,
    trend: "down"
  },
  {
    title: "Growth Rate",
    value: "18.2%",
    change: "+2.4%",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    trend: "up"
  }
];

// Recent activity data
const recentActivity = [
  {
    id: 1,
    action: "New user signup",
    timestamp: "2 minutes ago",
    icon: <PlusCircle className="h-4 w-4" />
  },
  {
    id: 2,
    action: "Payment processed",
    timestamp: "15 minutes ago",
    icon: <CreditCard className="h-4 w-4" />
  },
  {
    id: 3,
    action: "Settings updated",
    timestamp: "1 hour ago",
    icon: <Settings className="h-4 w-4" />
  },
  {
    id: 4,
    action: "Session completed",
    timestamp: "2 hours ago",
    icon: <Clock className="h-4 w-4" />
  }
];

export default function Dashboard() {
  const { user, isSubscriber } = useAuth();
  const { subscription, fetchSubscription } = useSubscription();
  const { redirectIfNeeded, shouldShowPage, isLoading } = useNavigation();

  // Add new states for dashboard functionality
  // const [repositories, setRepositories] = useState([]);
  // const [feedbackSources, setFeedbackSources] = useState([]);
  // const [recentFeedback, setRecentFeedback] = useState([]);
  // const [pendingPRs, setPendingPRs] = useState([]);

  // Centralized navigation logic
  useEffect(() => {
    redirectIfNeeded('/dashboard');
  }, [redirectIfNeeded]);

  // Refresh subscription data when user changes
  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id, fetchSubscription]);

  // Check for payment success
  const isPaymentSuccess = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('payment_success');
  }, []);

  // Clean up URL after detecting payment success
  useEffect(() => {
    if (isPaymentSuccess && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_success');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [isPaymentSuccess]);



  // If user shouldn't be on dashboard, show loading or redirect
  if (!shouldShowPage('/dashboard')) {
    if (isLoading) {
      // User has no subscription but we're still loading - redirect to onboarding
      if (user && !isSubscriber) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4 mx-auto"></div>
              <p className="text-foreground">Redirecting to setup...</p>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4 mx-auto"></div>
            <p className="text-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    return null; // Will redirect via useEffect
  }


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      {/* Payment Success Banner */}
      {isPaymentSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Payment successful! Your subscription is being activated...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-neutral-dark border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Dashboard Overview
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {subscription?.product_name ? (
                  <>
                    {subscription.product_name}
                    {subscription.status === "trialing" && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        (Trial)
                      </span>
                    )}
                  </>
                ) : (
                  "Free Plan"
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/10 dark:bg-primary-light/10 rounded-lg">
                  {metric.icon}
                </div>
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                {metric.value}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {metric.title}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Analytics Overview
              </h3>
              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <p className="text-slate-400 dark:text-slate-500">
                Chart Placeholder
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div className="p-2 bg-primary/10 dark:bg-primary-light/10 rounded-lg">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {activity.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}