import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const body = await req.text();

    let event;
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log('Stripe webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;
      const amountTotal = session.amount_total / 100;

      console.log(`Payment completed for ${customerEmail}, amount: $${amountTotal}`);

      // Find the most recent pending order for this customer with matching amount
      const orders = await base44.asServiceRole.entities.Order.filter({
        customer_email: customerEmail,
        status: 'pending',
      });

      if (orders.length > 0) {
        // Find the closest matching order by total
        const matchingOrder = orders.reduce((closest, order) => {
          const diff = Math.abs((order.total || 0) - amountTotal);
          const closestDiff = Math.abs((closest.total || 0) - amountTotal);
          return diff < closestDiff ? order : closest;
        });

        await base44.asServiceRole.entities.Order.update(matchingOrder.id, {
          status: 'paid',
          notes: (matchingOrder.notes ? matchingOrder.notes + '\n' : '') +
            `Stripe payment confirmed: ${session.id} | $${amountTotal}`,
        });

        // Update inventory
        for (const item of matchingOrder.items || []) {
          const product = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
          if (product.length > 0) {
            const currentStock = product[0].stock || 0;
            await base44.asServiceRole.entities.Product.update(item.product_id, {
              stock: Math.max(0, currentStock - item.quantity),
            });
          }
        }

        console.log(`Order ${matchingOrder.id} marked as paid`);

        // Send confirmation email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customerEmail,
          subject: '✅ Payment Confirmed — Your EarthGoods Order',
          body: `Hi ${matchingOrder.customer_name || 'there'},\n\nGreat news — your payment of $${amountTotal.toFixed(2)} has been confirmed!\n\nOrder ID: ${matchingOrder.id}\n\nItems:\n${matchingOrder.items?.map(i => `- ${i.quantity}x ${i.title} ($${(i.price * i.quantity).toFixed(2)})`).join('\n') || 'See order details'}\n\nWe'll notify you once your order ships.\n\nThank you for shopping at EarthGoods! 🌿\n\n— The EarthGoods Team`,
        });

        console.log('Confirmation email sent to', customerEmail);
      } else {
        console.warn('No pending order found for email:', customerEmail);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      console.log('Payment failed for:', pi.receipt_email);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});