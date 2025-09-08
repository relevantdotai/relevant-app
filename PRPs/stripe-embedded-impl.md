# Stripe Embedded Checkout Implementation Guide

This document provides a comprehensive guide for implementing Stripe Embedded Checkout in your Next.js 15 application, replacing the current Buy Button approach with a fully embedded checkout experience.

## Table of Contents

1. [Overview](#overview)
2. [Benefits](#benefits)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Implementation Steps](#implementation-steps)
6. [Code Changes](#code-changes)
7. [Testing](#testing)
8. [Migration Checklist](#migration-checklist)

## Overview

Stripe Embedded Checkout allows you to embed a complete checkout experience directly on your website. Unlike the Buy Button approach that redirects users to Stripe, Embedded Checkout keeps users on your site while maintaining PCI compliance.

### Current Flow (Buy Button)
1. User clicks Buy Button
2. Redirected to Stripe-hosted checkout
3. Completes payment on Stripe
4. Redirected back to your site

### New Flow (Embedded Checkout)
1. User selects a plan
2. Checkout form loads in an iframe on your page
3. Completes payment without leaving your site
4. Seamless redirect to success page

## Benefits

- **Better UX**: Users stay on your website
- **Full control**: Customize the checkout experience
- **Dynamic pricing**: Support multiple plans without multiple button IDs
- **PCI Compliance**: Payment details go directly to Stripe
- **Conversion optimization**: Reduce drop-offs from redirects

## Prerequisites

- Next.js 15 with App Router
- Stripe account with products/prices configured
- Environment variables set up

## Installation

Install the required packages:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

## Implementation Steps

### Step 1: Create Checkout Session API Route

Create a new API route to generate checkout sessions dynamically:

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get price ID from request
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSub) {
      return NextResponse.json({ 
        error: 'You already have an active subscription' 
      }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let customerId: string;
    const { data: customerData } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (customerData?.stripe_customer_id) {
      customerId = customerData.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: 'subscription',
      ui_mode: 'embedded',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return NextResponse.json({ 
      clientSecret: session.client_secret 
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
```

### Step 2: Create Stripe Provider Component

Create a provider to initialize Stripe:

```typescript
// components/StripeProvider.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

### Step 3: Create Embedded Checkout Component

Create the main checkout component:

```tsx
// components/EmbeddedCheckout.tsx
'use client';

import { useCallback, useState } from 'react';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface EmbeddedCheckoutFormProps {
  priceId: string;
}

export function EmbeddedCheckoutForm({ priceId }: EmbeddedCheckoutFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      setLoading(false);
      return data.clientSecret;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [priceId]);

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Please log in to continue with your purchase.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
```

### Step 4: Update Pricing Section

Update your pricing component to use embedded checkout:

```tsx
// components/PricingSection.tsx
'use client';

import { useState } from 'react';
import { EmbeddedCheckoutForm } from './EmbeddedCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    priceId: 'price_basic123', // Replace with your actual price ID
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: 'price_pro456', // Replace with your actual price ID
    features: ['All Basic features', 'Feature 4', 'Feature 5', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceId: 'price_enterprise789', // Replace with your actual price ID
    features: ['All Pro features', 'Feature 6', 'Feature 7', 'Dedicated support'],
  },
];

export function PricingSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      router.push('/login?redirect=/pay');
      return;
    }
    
    setSelectedPlan(planId);
    setShowCheckout(true);
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  if (showCheckout && selectedPlanData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setShowCheckout(false)}
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          ← Back to plans
        </button>
        
        <h2 className="text-2xl font-bold mb-6">
          Complete your {selectedPlanData.name} subscription
        </h2>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <EmbeddedCheckoutForm priceId={selectedPlanData.priceId} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-lg shadow-lg p-6 flex flex-col"
          >
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <p className="text-3xl font-bold mb-6">
              ${plan.price}<span className="text-lg font-normal">/month</span>
            </p>
            
            <ul className="mb-8 flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSelectPlan(plan.id)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Select {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 5: Update Pay Page

Replace the current pay page:

```tsx
// app/pay/page.tsx
import { PricingSection } from '@/components/PricingSection';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';

export default function PayPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12">
        <SubscriptionStatus />
        <PricingSection />
      </div>
    </div>
  );
}
```

### Step 6: Add Checkout Session Retrieval

Add an API route to retrieve checkout session status:

```typescript
// app/api/stripe/checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { withCors } from '@/utils/cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const GET = withCors(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customer_email: session.customer_email,
      payment_status: session.payment_status,
    });
  } catch (error) {
    console.error('Session retrieval failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
});
```

### Step 7: Update Dashboard for Success Handling

Update the dashboard to handle checkout success:

```tsx
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
// ... other imports

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (sessionId) {
      // Check checkout session status
      fetch(`/api/stripe/checkout-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setCheckoutStatus(data.status);
          if (data.status === 'complete') {
            // Show success message
            // Optionally refresh subscription status
          }
        })
        .catch(err => console.error('Failed to check session:', err));
    }
  }, [sessionId]);

  // ... rest of your dashboard code
  
  return (
    <div>
      {checkoutStatus === 'complete' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Payment successful! Your subscription is now active.
        </div>
      )}
      {/* Rest of your dashboard content */}
    </div>
  );
}
```

## Testing

### Test Cards

Use these test cards during development:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Succeeds without authentication |
| 4000 0025 0000 3155 | Requires 3D Secure authentication |
| 4000 0000 0000 9995 | Declines with insufficient funds |

### Testing Steps

1. **Test successful payment flow**:
   - Select a plan
   - Fill in test card details
   - Complete checkout
   - Verify redirect to dashboard with success message

2. **Test authentication flow**:
   - Use 3D Secure test card
   - Complete authentication
   - Verify successful payment

3. **Test error handling**:
   - Try purchasing with existing subscription
   - Use declining test card
   - Verify error messages display correctly

4. **Test webhook handling**:
   - Use Stripe CLI to forward webhooks locally
   - Verify subscription creation in database

## Migration Checklist

- [ ] Install required npm packages
- [ ] Create `/api/stripe/create-checkout-session` route
- [ ] Create `/api/stripe/checkout-session` route for status checks
- [ ] Update webhook handler to support embedded checkout
- [ ] Create `EmbeddedCheckout` component
- [ ] Update `PricingSection` to use embedded checkout
- [ ] Update `app/pay/page.tsx`
- [ ] Update dashboard to handle success redirects
- [ ] Test all payment flows
- [ ] Update environment variables (remove `NEXT_PUBLIC_STRIPE_BUTTON_ID`)
- [ ] Deploy and test in production

## Environment Variable Changes

Remove:
```env
NEXT_PUBLIC_STRIPE_BUTTON_ID=buy_btn_xxx
```

Keep:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Benefits of This Implementation

1. **Better User Experience**: Users never leave your site
2. **Dynamic Pricing**: Easy to add/remove plans without code changes
3. **Full Customization**: Control the entire checkout flow
4. **Better Analytics**: Track user behavior throughout checkout
5. **Reduced Drop-off**: No redirect means fewer abandoned carts
6. **Mobile Optimized**: Responsive design works on all devices

## Security Considerations

1. **Authentication**: All API routes check for authenticated users
2. **Duplicate Prevention**: Checks for existing subscriptions before checkout
3. **CORS Protection**: Proper CORS headers on all endpoints
4. **Webhook Verification**: Stripe signature validation on webhooks
5. **PCI Compliance**: Payment details never touch your server

## Next Steps

After implementing embedded checkout, consider:

1. Adding customer portal for subscription management
2. Implementing usage-based billing
3. Adding discount/coupon support
4. Creating admin dashboard for subscription analytics
5. Setting up automated email notifications