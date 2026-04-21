import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';
import { RateLimiter, checkRateLimit } from './utils/rateLimiter.js';
import { analyticsTracker } from './utils/analytics.js';
import { sendEmail } from './utils/emailTemplates.js';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// Initialize rate limiter for webhooks
const webhookLimiter = new RateLimiter(null, {
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 1000,
  keyPrefix: 'webhook',
});

interface WebhookError {
  type: string;
  message: string;
  code?: string;
}

const webhookErrors: WebhookError[] = [];

const logWebhookError = (error: WebhookError) => {
  webhookErrors.push({
    ...error,
  });
  console.error(`Webhook Error [${error.type}]: ${error.message}`);
};

Deno.serve(async (req) => {
  try {
    // Verify webhook origin/IP
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const sig = req.headers.get('stripe-signature');

    // Rate limiting check
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await checkRateLimit(webhookLimiter, ipAddress);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${ipAddress}`);
      return Response.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
          }
        }
      );
    }

    // Verify Stripe signature
    if (!webhookSecret || !sig) {
      logWebhookError({
        type: 'SIGNATURE_MISSING',
        message: 'Webhook secret or signature header missing',
        code: 'WEBHOOK_001',
      });
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      console.log(`✅ Webhook signature verified: ${event.type}`);
    } catch (error) {
      logWebhookError({
        type: 'SIGNATURE_VERIFICATION_FAILED',
        message: `Invalid signature: ${error.message}`,
        code: 'WEBHOOK_002',
      });
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Prevent duplicate processing by checking idempotency key
    const eventId = event.id;
    const processedEvents = Deno.env.get('PROCESSED_WEBHOOK_EVENTS')?.split(',') || [];
    
    if (processedEvents.includes(eventId)) {
      console.log(`⚠️ Duplicate webhook event: ${eventId} - skipping`);
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);

    // Handle specific event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const customerEmail = session.customer_email || session.customer_details?.email;

      console.log(`💳 Payment completed: ${session.id}`);

      // Find matching order
      const orders = await base44.asServiceRole.entities.Order.filter({
        customer_email: customerEmail,
        status: 'pending',
      });

      if (orders.length > 0) {
        const matchingOrder = orders.reduce((closest, order) => {
          const diff = Math.abs((order.total || 0) - (session.amount_total / 100));
          const closestDiff = Math.abs((closest.total || 0) - (session.amount_total / 100));
          return diff < closestDiff ? order : closest;
        });

        // Update order
        await base44.asServiceRole.entities.Order.update(matchingOrder.id, {
          status: 'paid',
          stripe_session_id: session.id,
          payment_intent: session.payment_intent,
          notes: (matchingOrder.notes ? matchingOrder.notes + '\n' : '') +
            `Stripe payment confirmed: ${session.id}`,
        });

        // Update inventory
        for (const item of matchingOrder.items || []) {
          const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
          if (products.length > 0) {
            const currentStock = products[0].stock || 0;
            await base44.asServiceRole.entities.Product.update(item.product_id, {
              stock: Math.max(0, currentStock - item.quantity),
            });
          }
        }

        // Track conversion
        await analyticsTracker.trackPaymentProcessed(base44, {
          customer_email: customerEmail,
          order_id: matchingOrder.id,
          amount: session.amount_total / 100,
          payment_method: 'stripe',
          status: 'completed',
        });

        console.log(`✅ Order ${matchingOrder.id} marked as paid`);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as any;
      const customerEmail = pi.receipt_email;

      console.log(`❌ Payment failed: ${pi.id}`);

      // Find order and update
      const orders = await base44.asServiceRole.entities.Order.filter({
        customer_email: customerEmail,
        status: 'pending',
      });

      if (orders.length > 0) {
        const order = orders[0];
        await base44.asServiceRole.entities.Order.update(order.id, {
          status: 'payment_failed',
          notes: (order.notes ? order.notes + '\n' : '') + `Payment failed: ${pi.id}`,
        });

        // Send failure notification
        await sendEmail(base44, customerEmail, {
          subject: '❌ Payment Failed — EarthGoods',
          body: `Your payment could not be processed. Please try again or contact support.`,
        });

        // Track failed payment
        await analyticsTracker.trackPaymentProcessed(base44, {
          customer_email: customerEmail,
          order_id: order.id,
          amount: (pi.amount || 0) / 100,
          payment_method: 'stripe',
          status: 'failed',
        });
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as any;
      console.log(`💚 Refund processed: ${charge.id}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: 'Webhook processing error' }, { status: 500 });
  }
});
