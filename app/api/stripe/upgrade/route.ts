import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { subscriptionId, newPriceId, prorate = true } = await request.json();
    
    if (!subscriptionId || !newPriceId) {
      return NextResponse.json({ 
        error: 'Subscription ID and new price ID are required' 
      }, { status: 400 });
    }

    // Get the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json({ 
        error: 'Subscription not found' 
      }, { status: 404 });
    }

    // Get the current subscription item (assuming single item subscription)
    const currentItem = subscription.items.data[0];
    
    if (!currentItem) {
      return NextResponse.json({ 
        error: 'No subscription items found' 
      }, { status: 400 });
    }

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorate ? 'create_prorations' : 'none',
      // Optionally expand the latest invoice to get prorated amounts
      expand: ['latest_invoice'],
    });

    // Get the product details for the new price
    const price = await stripe.prices.retrieve(newPriceId, {
      expand: ['product'],
    });

    // Update the subscription in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        product_name: (price.product as Stripe.Product).name,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription in Supabase:', updateError);
      // Don't fail the request since Stripe was successful
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      prorationAmount: updatedSubscription.latest_invoice ? 
        (updatedSubscription.latest_invoice as Stripe.Invoice).amount_due : 0,
    });

  } catch (error) {
    console.error('Stripe upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
});