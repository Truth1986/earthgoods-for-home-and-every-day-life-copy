import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { event, data, old_data } = body;

  // Only act on updates
  if (event?.type !== 'update') {
    return Response.json({ skipped: true });
  }

  const newStatus = data?.status;
  const oldStatus = old_data?.status;

  // Only notify on these transitions
  const notifyTransitions = [
    { from: 'paid', to: 'shipped' },
    { from: 'shipped', to: 'delivered' },
    { from: 'pending', to: 'paid' },
  ];

  const shouldNotify = notifyTransitions.some(t => t.from === oldStatus && t.to === newStatus);

  if (!shouldNotify) {
    console.log(`[INFO] No notification needed for ${oldStatus} → ${newStatus}`);
    return Response.json({ skipped: true });
  }

  const order = data;
  if (!order?.customer_email) {
    console.log('[WARN] Order missing customer email, skipping notification');
    return Response.json({ skipped: true });
  }

  const statusMessages = {
    paid: {
      subject: '✅ Your EarthGoods order is confirmed!',
      body: `Hi ${order.customer_name || 'there'},\n\nGreat news — your payment has been confirmed and your order is now being prepared!\n\nOrder #${order.id?.slice(0, 8).toUpperCase()}\nTotal: $${order.total?.toFixed(2)}\n\nItems:\n${order.items?.map(i => `  • ${i.quantity}x ${i.title}`).join('\n') || ''}\n\nShipping to:\n${order.customer_address || 'Address on file'}\n\nWe'll email you again when your order ships.\n\nThank you for supporting EarthGoods! 🌿\n— The EarthGoods Team`,
    },
    shipped: {
      subject: '📦 Your EarthGoods order is on its way!',
      body: `Hi ${order.customer_name || 'there'},\n\nExciting news — your order has been shipped and is on its way to you!\n\nOrder #${order.id?.slice(0, 8).toUpperCase()}\nTracking Reference: EG${order.id?.slice(0, 8).toUpperCase()}\n\nItems:\n${order.items?.map(i => `  • ${i.quantity}x ${i.title}`).join('\n') || ''}\n\nShipping to:\n${order.customer_address || 'Address on file'}\n\nEstimated delivery: 3–5 business days.\n\nYou can track your order anytime in your Customer Dashboard.\n\nThank you for your purchase! 🌿\n— The EarthGoods Team`,
    },
    delivered: {
      subject: '🎉 Your EarthGoods order has been delivered!',
      body: `Hi ${order.customer_name || 'there'},\n\nYour order has been delivered! We hope you love everything in it.\n\nOrder #${order.id?.slice(0, 8).toUpperCase()}\n\nItems:\n${order.items?.map(i => `  • ${i.quantity}x ${i.title}`).join('\n') || ''}\n\nIf you enjoy your purchase, we'd love it if you left a review — it helps other homesteaders find the right products!\n\nThank you for being part of the EarthGoods community 🌿\n— The EarthGoods Team`,
    },
  };

  const msg = statusMessages[newStatus];
  if (!msg) {
    return Response.json({ skipped: true });
  }

  console.log(`[INFO] Sending "${newStatus}" notification to ${order.customer_email}`);

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.customer_email,
    subject: msg.subject,
    body: msg.body,
  });

  console.log(`[INFO] Notification sent successfully`);
  return Response.json({ sent: true, to: order.customer_email, status: newStatus });
});