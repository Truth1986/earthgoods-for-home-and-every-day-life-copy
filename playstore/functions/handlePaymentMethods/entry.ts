import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

interface PaymentMethodConfig {
  type: 'card' | 'applepay' | 'googlepay' | 'paypal' | 'klarna';
  enabled: boolean;
  description: string;
}

const paymentMethods: PaymentMethodConfig[] = [
  {
    type: 'card',
    enabled: true,
    description: 'Credit/Debit Card (Visa, Mastercard, Amex)',
  },
  {
    type: 'applepay',
    enabled: true,
    description: 'Apple Pay',
  },
  {
    type: 'googlepay',
    enabled: true,
    description: 'Google Pay',
  },
  {
    type: 'paypal',
    enabled: true,
    description: 'PayPal',
  },
  {
    type: 'klarna',
    enabled: true,
    description: 'Klarna - Buy Now, Pay Later',
  },
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { pathname } = new URL(req.url);

  // GET /payment-methods - List available payment methods
  if (pathname === '/payment-methods' && req.method === 'GET') {
    return Response.json({
      methods: paymentMethods.filter(m => m.enabled),
    });
  }

  // POST /create-payment-intent - Create payment intent for any method
  if (pathname === '/create-payment-intent' && req.method === 'POST') {
    try {
      const { amount, currency, payment_method_type, customer_email } = await req.json();

      if (!amount || amount <= 0) {
        return Response.json({ error: 'Invalid amount' }, { status: 400 });
      }

      if (!payment_method_type) {
        return Response.json({ error: 'payment_method_type is required' }, { status: 400 });
      }

      // Map payment method types to Stripe payment method types
      const stripePaymentMethods: Record<string, string[]> = {
        card: ['card'],
        applepay: ['apple_pay'],
        googlepay: ['google_pay'],
        paypal: ['paypal'],
        klarna: ['klarna'],
      };

      const stripeTypes = stripePaymentMethods[payment_method_type];
      if (!stripeTypes) {
        return Response.json({ error: 'Unsupported payment method' }, { status: 400 });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || 'usd',
        payment_method_types: stripeTypes as any,
        receipt_email: customer_email,
        metadata: {
          payment_method_type,
        },
      });

      return Response.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      });
    } catch (error) {
      console.error('Payment intent creation error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // POST /confirm-payment - Confirm payment
  if (pathname === '/confirm-payment' && req.method === 'POST') {
    try {
      const { paymentIntentId, paymentMethodId } = await req.json();

      if (!paymentIntentId || !paymentMethodId) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Confirm the payment intent
      const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      if (intent.status === 'succeeded') {
        return Response.json({
          success: true,
          paymentIntentId: intent.id,
          status: intent.status,
        });
      } else if (intent.status === 'requires_action') {
        return Response.json({
          success: false,
          paymentIntentId: intent.id,
          status: intent.status,
          clientSecret: intent.client_secret,
          message: '3D Secure verification required',
        });
      } else {
        return Response.json({
          success: false,
          status: intent.status,
          error: 'Payment failed',
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Payment confirmation error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // POST /validate-payment - Validate saved payment method
  if (pathname === '/validate-payment' && req.method === 'POST') {
    try {
      const { paymentMethodId, amount } = await req.json();

      if (!paymentMethodId) {
        return Response.json({ error: 'paymentMethodId is required' }, { status: 400 });
      }

      // Retrieve payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      return Response.json({
        valid: true,
        paymentMethodId,
        type: paymentMethod.type,
        details: {
          card: paymentMethod.card,
          billing_details: paymentMethod.billing_details,
        },
      });
    } catch (error) {
      console.error('Payment validation error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
});
