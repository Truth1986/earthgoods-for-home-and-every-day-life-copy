import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, reason, amount } = body;

    // Validate input
    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    if (!reason) {
      return Response.json({ error: 'reason is required' }, { status: 400 });
    }

    // Get order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    if (!orders.length) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Check if order is paid
    if (order.status !== 'paid') {
      return Response.json({ error: 'Only paid orders can be refunded' }, { status: 400 });
    }

    // Check if already refunded
    if (order.status === 'refunded' || order.refund_id) {
      return Response.json({ error: 'Order already refunded' }, { status: 400 });
    }

    // Get Stripe session to retrieve payment intent
    if (!order.stripe_session_id) {
      return Response.json({ error: 'No Stripe session found for this order' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    if (!session.payment_intent) {
      return Response.json({ error: 'Cannot find payment intent' }, { status: 400 });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: session.payment_intent as string,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund support
      reason: reason as any,
      metadata: {
        order_id: order_id,
      },
    });

    // Update order status
    await base44.asServiceRole.entities.Order.update(order_id, {
      status: 'refunded',
      refund_id: refund.id,
      notes: (order.notes ? order.notes + '\n' : '') +
        `Refund processed: ${refund.id} | Reason: ${reason} | Amount: $${(refund.amount / 100).toFixed(2)}`,
    });

    // Restore inventory if full refund
    if (!amount || Math.abs((refund.amount / 100) - order.total) < 0.01) {
      for (const item of order.items || []) {
        const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
        if (products.length > 0) {
          const currentStock = products[0].stock || 0;
          await base44.asServiceRole.entities.Product.update(item.product_id, {
            stock: currentStock + item.quantity,
          });
        }
      }
    }

    // Send refund confirmation email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: '💚 Refund Confirmed — EarthGoods',
      body: `Hi ${order.customer_name},\n\nWe've processed a refund of $${(refund.amount / 100).toFixed(2)} for your order #${order_id.slice(-6).toUpperCase()}.\n\nReason: ${reason}\n\nThe refund should appear in your account within 3-5 business days.\n\nThank you for your understanding.\n\nBest,\nThe EarthGoods Team 🌿`,
    });

    console.log(`Refund ${refund.id} processed for order ${order_id}`);
    return Response.json({
      success: true,
      refund_id: refund.id,
      amount: refund.amount / 100,
    });
  } catch (error) {
    console.error('Refund error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
