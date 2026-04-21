import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';
import { validateCheckout } from '../utils/validation.js';
import { RateLimiter, checkRateLimit } from '../utils/rateLimiter.js';
import { analyticsTracker } from '../utils/analytics.js';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const checkoutLimiter = new RateLimiter(null, {
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'checkout',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(checkoutLimiter, user.id);
    if (!rateLimitResult.allowed) {
      return Response.json(
        { error: 'Too many checkout attempts. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) }
        }
      );
    }

    const { items, customer_email, shipping, appliedCode, discountPercent, successUrl, cancelUrl } = await req.json();

    // Validate input
    const validation = validateCheckout({
      items,
      customer_email,
      customer_name: '',
      customer_address: '',
      appliedCode,
      discountPercent,
    });

    if (!validation.valid) {
      return Response.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items provided' }, { status: 400 });
    }

    // Track checkout initiation
    await analyticsTracker.trackCheckoutInitiated(base44, {
      items,
      customer_email,
      shipping,
      appliedCode,
    });

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          ...(item.image_url ? { images: [item.image_url] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add overnight shipping as a line item if selected
    if (shipping === 'overnight') {
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discountedSubtotal = appliedCode ? subtotal * (1 - (discountPercent || 0) / 100) : subtotal;
      const shippingCost = Math.round(discountedSubtotal * 0.20 * 100);
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Overnight Shipping' },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    // Add platform fee (3%) as a line item
    const subtotalCents = items.reduce((sum, i) => sum + Math.round(i.price * i.quantity * 100), 0);
    const discountedSubtotalCents = appliedCode ? Math.round(subtotalCents * (1 - (discountPercent || 0) / 100)) : subtotalCents;
    const feeCents = Math.round(discountedSubtotalCents * 0.03);
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Platform Fee (3%)' },
        unit_amount: feeCents,
      },
      quantity: 1,
    });

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer_email || user.email,
      success_url: successUrl || `${req.headers.get('origin')}/Checkout?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/Checkout?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_id: user.id,
        referral_code: appliedCode || '',
      },
    };

    // Apply coupon discount if referral code used
    if (appliedCode && discountPercent) {
      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: 'once',
        name: `Referral: ${appliedCode}`,
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Checkout session created:', session.id);
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});