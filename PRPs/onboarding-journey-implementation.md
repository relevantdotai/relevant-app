# PRP: Post-Signup User Onboarding Journey with Plan Selection

## Goal

**Feature Goal**: Create a seamless post-signup onboarding journey that immediately guides new users through plan selection in a visually appealing two-column layout

**Deliverable**: Complete onboarding flow with:
- `/onboarding` route with 35%/65% two-column layout  
- Left column: Welcome content and progress indicators
- Right column: Interactive pricing table for plan selection
- Integration with existing authentication and Stripe payment flow
- Database state management for onboarding completion

**Success Definition**: 
- New users automatically redirected to onboarding after signup verification
- Users can select and purchase a plan within the onboarding flow
- Onboarding completion tracked in database
- Users redirected to dashboard after completing onboarding
- 95%+ compatibility with existing codebase patterns

## Context

### Documentation References

```yaml
external_research:
  - url: "https://nextjs.org/docs/app/building-your-application/routing/middleware"
    why: "Authentication redirect patterns for new users"
    critical: "middleware.ts patterns for route protection and redirection"
  
  - url: "https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts" 
    why: "App Router page creation and layout patterns"
    critical: "page.tsx structure and layout integration"

  - url: "https://www.framer.com/motion/animate-presence/"
    why: "Page transition animations for onboarding steps"
    critical: "AnimatePresence with mode='wait' for smooth transitions"

codebase_patterns:
  - file: "app/auth/callback/route.ts"
    pattern: "Post-authentication redirect logic (lines 22-32)"
    gotcha: "Currently redirects to /dashboard - needs modification for new users"
  
  - file: "components/PricingSection.tsx" 
    pattern: "Pricing tier structure and animations"
    gotcha: "Uses hardcoded tiers - extract for reuse in onboarding"
  
  - file: "app/dashboard/page.tsx"
    pattern: "Onboarding completion check (lines 163-176)"
    gotcha: "Checks user_preferences.has_completed_onboarding field"
  
  - file: "components/PricingSection.tsx"
    pattern: "Stripe Payment Links will be used for each tier"
    gotcha: "Each pricing tier will have its own Stripe Payment Link URL"
```

### Current Project Structure
```
app/
├── auth/
│   └── callback/route.ts        # Authentication callback handler  
├── dashboard/page.tsx           # Main dashboard with onboarding check
├── login/page.tsx              # Login flow patterns
└── verify-email/page.tsx       # Email verification flow

components/
├── OnboardingTour.tsx          # Existing modal-based onboarding
└── PricingSection.tsx          # Reusable pricing component

contexts/
└── AuthContext.tsx             # User authentication state

hooks/
└── useSubscription.ts          # Subscription status management
```

### Desired Project Structure After Implementation
```
app/
├── onboarding/
│   ├── page.tsx                # NEW: Main onboarding journey page
│   └── success/
│       └── page.tsx            # NEW: Payment success handler
└── auth/
    └── callback/route.ts       # MODIFIED: Add new user redirect

components/
└── onboarding/
    ├── OnboardingLayout.tsx    # NEW: Two-column layout wrapper
    ├── WelcomeContent.tsx      # NEW: Left column content
    └── OnboardingPricing.tsx   # NEW: Right column pricing with Payment Links

hooks/
└── useOnboarding.ts            # NEW: Onboarding state management

.env.local                      # MODIFIED: Add Stripe Payment Link URLs
```

### Critical Implementation Notes

```bash
# PATTERN: Authentication redirect in callback
# FILE: app/auth/callback/route.ts:22-32
if (user && !error) {
  # CURRENT: redirectTo = `${origin}/dashboard`
  # MODIFY: Check if new user → redirect to /onboarding
}

# PATTERN: Onboarding completion tracking  
# FILE: app/dashboard/page.tsx:163-176
await supabase
  .from('user_preferences')
  .select('has_completed_onboarding')
  .eq('user_id', user.id)
  .single();

# STRIPE PAYMENT LINKS: Environment Variables
# Add to .env.local:
NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PAYMENT_LINK=https://buy.stripe.com/...

# Payment Link Configuration in Stripe Dashboard:
# - Enable "Allow promotion codes"
# - Set success URL to: {APP_URL}/onboarding/success
# - Set cancel URL to: {APP_URL}/onboarding
# - Enable "Collect customer details"
# - Pass client_reference_id for user tracking

# PATTERN: Pricing tier structure with Stripe Payment Links
# FILE: components/PricingSection.tsx:15-45
const pricingTiers = [
  { 
    id: "pro", 
    name: "Pro", 
    price: "$19", 
    popular: false,
    stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK
  },
  { 
    id: "enterprise", 
    name: "Enterprise", 
    price: "$49", 
    popular: true,
    stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PAYMENT_LINK
  },
  { 
    id: "custom", 
    name: "Custom", 
    price: "Contact Sales", 
    popular: false,
    stripePaymentLink: null // Handle differently
  }
];

# DESIGN SYSTEM: Two-column responsive layout
# Use: grid grid-cols-1 lg:grid-cols-12 gap-8
# Left: lg:col-span-4 xl:col-span-3 (≈35%)
# Right: lg:col-span-8 xl:col-span-9 (≈65%)
```

## Implementation

### Database Schema Updates

```sql
-- EXISTING table: user_preferences  
-- MODIFY: Add onboarding tracking fields
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS
  onboarding_step INTEGER DEFAULT 1,
  selected_plan_id TEXT,
  onboarding_started_at TIMESTAMP DEFAULT NOW(),
  onboarding_completed_at TIMESTAMP;

-- INDEX for efficient onboarding queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding 
ON user_preferences(user_id, has_completed_onboarding);
```

### Task Sequence

```yaml
Task_1: "MODIFY app/auth/callback/route.ts"
  implement: "Add new user detection and onboarding redirect"
  follow: "Existing redirect pattern (lines 22-32)"
  naming: "Keep existing variable names (origin, redirectTo)"
  placement: "After user validation, before dashboard redirect"

Task_2: "CREATE app/onboarding/page.tsx"
  implement: "Main onboarding page with two-column layout"
  follow: "app/dashboard/page.tsx structure for auth patterns"
  naming: "OnboardingPage component export"
  placement: "app/onboarding/ directory"

Task_3: "CREATE app/onboarding/success/page.tsx"
  implement: "Success page after Stripe Payment Link completion"
  follow: "app/dashboard/page.tsx patterns for protected routes"
  naming: "OnboardingSuccessPage component"
  placement: "app/onboarding/success/ directory"

Task_4: "CREATE components/onboarding/OnboardingLayout.tsx"
  implement: "Responsive two-column layout wrapper (35%/65%)"
  follow: "Tailwind grid patterns from existing components"
  naming: "OnboardingLayout component with children props"
  placement: "components/onboarding/ directory"

Task_5: "CREATE components/onboarding/WelcomeContent.tsx"
  implement: "Left column welcome content and progress indicators"
  follow: "components/OnboardingTour.tsx for content patterns"
  naming: "WelcomeContent component"
  placement: "components/onboarding/ directory"

Task_6: "CREATE components/onboarding/OnboardingPricing.tsx"
  implement: "Right column pricing section with Stripe Payment Links"
  follow: "components/PricingSection.tsx structure and animations"
  naming: "OnboardingPricing component with Payment Link integration"
  placement: "components/onboarding/ directory"

Task_7: "CREATE hooks/useOnboarding.ts"
  implement: "Onboarding state management and progress tracking"
  follow: "hooks/useSubscription.ts patterns for data fetching"
  naming: "useOnboarding hook with state and actions"
  placement: "hooks/ directory"

Task_8: "CREATE .env.local updates for Payment Links"
  implement: "Add Stripe Payment Link URLs for each tier"
  follow: "Existing environment variable patterns"
  naming: "NEXT_PUBLIC_STRIPE_[TIER]_PAYMENT_LINK"
  placement: ".env.local file"

Task_9: "CREATE middleware.ts (if not exists) or MODIFY existing"
  implement: "Route protection for onboarding flow"
  follow: "Next.js 15 middleware patterns"
  naming: "Standard middleware function export"
  placement: "Root directory"
```

### Code Patterns & Examples

```typescript
// PATTERN: Authentication callback modification
// FILE: app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  // ... existing code ...
  if (user && !error) {
    // NEW: Check if user needs onboarding
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('has_completed_onboarding')
      .eq('user_id', user.id)
      .single();
    
    const needsOnboarding = !preferences?.has_completed_onboarding;
    const redirectTo = needsOnboarding 
      ? `${origin}/onboarding`
      : `${origin}/dashboard`;
      
    return NextResponse.redirect(redirectTo);
  }
}

// PATTERN: Two-column responsive layout
// FILE: components/onboarding/OnboardingLayout.tsx
export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - 35% */}
          <div className="lg:col-span-4 xl:col-span-3">
            <WelcomeContent />
          </div>
          
          {/* Right Column - 65% */}
          <div className="lg:col-span-8 xl:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// PATTERN: Onboarding state management
// FILE: hooks/useOnboarding.ts
export function useOnboarding() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const completeOnboarding = async () => {
    if (!user || !selectedPlan) return;
    
    setIsCompleting(true);
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        has_completed_onboarding: true,
        selected_plan_id: selectedPlan,
        onboarding_completed_at: new Date().toISOString()
      });
    
    // Redirect to dashboard after completion
    router.replace('/dashboard');
  };
  
  return { selectedPlan, setSelectedPlan, completeOnboarding, isCompleting };
}

// PATTERN: Pricing integration with Stripe Payment Links
// FILE: components/onboarding/OnboardingPricing.tsx  
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
}

export function OnboardingPricing({ userId, userEmail }: OnboardingPricingProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // Pricing tiers with Stripe Payment Links
  const pricingTiers: PricingTier[] = [
    {
      id: "pro",
      name: "Pro",
      price: "$19",
      interval: "/month",
      description: "Perfect for small teams and startups",
      features: ["All template features", "Priority support"],
      popular: false,
      stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK!
    },
    {
      id: "enterprise", 
      name: "Enterprise",
      price: "$49",
      interval: "/month",
      description: "For growing businesses",
      features: ["Everything in Pro", "Advanced features"],
      popular: true,
      stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PAYMENT_LINK!
    },
    {
      id: "custom",
      name: "Custom",
      price: "Contact Sales",
      description: "For large organizations",
      features: ["Custom solutions", "Dedicated support"],
      popular: false,
      stripePaymentLink: null
    }
  ];

  const handlePlanSelect = async (tier: PricingTier) => {
    if (!tier.stripePaymentLink) {
      // Handle custom plan - redirect to contact form
      router.push('/contact-sales');
      return;
    }

    setIsLoading(tier.id);
    
    // Track selection in database
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        selected_plan_id: tier.id,
        onboarding_step: 2
      });

    // Redirect to Stripe Payment Link with prefilled data
    const paymentUrl = new URL(tier.stripePaymentLink);
    paymentUrl.searchParams.set('prefilled_email', userEmail);
    paymentUrl.searchParams.set('client_reference_id', userId);
    
    window.location.href = paymentUrl.toString();
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select the perfect plan to get started
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-lg p-6 border-2 ${
              tier.popular 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 dark:border-gray-700'
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
            
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {tier.price}
              </span>
              {tier.interval && (
                <span className="text-gray-600 dark:text-gray-400">
                  {tier.interval}
                </span>
              )}
            </div>
            
            <ul className="mt-6 space-y-3">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handlePlanSelect(tier)}
              disabled={isLoading === tier.id}
              className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                tier.popular
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading === tier.id ? 'Redirecting...' : 'Get Started'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// PATTERN: Onboarding success page
// FILE: app/onboarding/success/page.tsx
export default async function OnboardingSuccessPage() {
  const { user } = await getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Mark onboarding as complete
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      has_completed_onboarding: true,
      onboarding_completed_at: new Date().toISOString()
    });
  
  // Sync subscription status from Stripe
  await fetch('/api/stripe/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id })
  });
  
  // Redirect to dashboard
  redirect('/dashboard');
}

// PATTERN: Environment variables for Payment Links
// FILE: .env.local
NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK=https://buy.stripe.com/test_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PAYMENT_LINK=https://buy.stripe.com/test_...
```

## Validation

### Level 1: Syntax & Type Checking
```bash
# TypeScript compilation
npx tsc --noEmit

# ESLint validation  
npm run lint

# Format check
npm run format:check
```

### Level 2: Component & Integration Testing  
```bash
# Component rendering tests
npm test -- --testNamePattern="Onboarding"

# Database integration tests
npm test -- hooks/useOnboarding.test.ts

# Authentication flow tests
npm test -- app/auth/callback
```

### Level 3: End-to-End Flow Testing
```bash
# Start development server
npm run dev

# Test authentication callback redirect
curl -f "http://localhost:3000/auth/callback"

# Test onboarding page access
curl -f "http://localhost:3000/onboarding"

# Test pricing component rendering
curl -f "http://localhost:3000/onboarding" | grep "Choose Your Plan"
```

### Level 4: User Journey Validation
```bash  
# MCP Playwright testing (if available)
# Test complete signup → onboarding → plan selection → dashboard flow

# Manual testing checklist:
# ✅ New user signup redirects to /onboarding
# ✅ Onboarding displays two-column layout properly
# ✅ Pricing selection works and tracks state
# ✅ Stripe payment integration functions
# ✅ Completion redirects to /dashboard
# ✅ Returning users bypass onboarding
```

### Validation Checklist

```yaml
technical:
  - "All TypeScript types compile without errors"
  - "ESLint passes with no warnings"  
  - "Components render without console errors"
  - "Database queries execute successfully"
  - "Authentication redirects work correctly"

feature:
  - "New users auto-redirect to onboarding"
  - "Two-column layout displays properly on all devices"
  - "Pricing selection state persists correctly"
  - "Stripe integration handles payment flow"
  - "Onboarding completion updates database"
  - "Users redirect to dashboard after completion"

quality:
  - "Follows existing component patterns and naming conventions"
  - "Implements proper TypeScript typing"
  - "Uses established Tailwind CSS classes"
  - "Maintains Framer Motion animation consistency"
  - "Integrates with existing authentication context"
  - "Preserves dark/light theme compatibility"
```

## Anti-Patterns to Avoid

- **Don't create new authentication patterns** - Use existing AuthContext and Supabase integration
- **Don't hardcode URLs** - Use environment variables and Next.js routing patterns  
- **Don't skip mobile responsiveness** - Two-column layout must work on all screen sizes
- **Don't ignore existing design system** - Follow established Tailwind classes and color scheme
- **Don't bypass subscription status checking** - Integrate with existing useSubscription hook
- **Don't create separate pricing data** - Reuse existing pricing tiers from PricingSection.tsx
- **Don't skip onboarding state persistence** - Track progress in user_preferences table
- **Don't break existing flows** - Ensure existing users continue to work normally
- **Don't hardcode Payment Link URLs** - Use environment variables for all Stripe links
- **Don't forget success page handling** - Create proper success route for payment completion
- **Don't skip prefilling user data** - Pass email and user ID to Payment Links

---

**Implementation Priority**: High - Blocking new user conversion
**Estimated Complexity**: Moderate (6-8 hours)  
**Dependencies**: Existing authentication, Stripe integration, Supabase database
**Validation Requirements**: All 4 levels must pass before deployment