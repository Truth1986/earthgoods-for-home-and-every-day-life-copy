import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { data: order, event } = body;

        if (event?.type !== 'create' || !order) {
            return Response.json({ message: 'Not a create event' });
        }

        // Send confirmation to customer
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: order.customer_email,
            subject: `🌿 Order Confirmed — EarthGoods #${order.id.slice(-6).toUpperCase()}`,
            body: `Hi ${order.customer_name},

Thank you for your order! We're so grateful for your support of sustainable living. 🌱

━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━
Order ID: ${order.id}
Order Total: $${order.total?.toFixed(2)}

Items Ordered:
${order.items?.map(i => `  • ${i.quantity}x ${i.title} — $${(i.price * i.quantity).toFixed(2)}`).join('\n') || ''}

Shipping To:
${order.customer_address}
━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
1. Complete your payment via PayPal: paypal.me/tracieruth281/${order.total?.toFixed(2)}
2. Once payment is received, we'll process and ship your order within 1-2 business days
3. You'll receive a shipping confirmation when your order is on its way!

Track your order any time at: earthgoods.app/TrackOrder
(Use your email and order ID: ${order.id})

Questions? Reply to this email and we'll get back to you quickly.

With gratitude,
The EarthGoods Team 🌿`
        });

        // Notify admin of new order
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        for (const admin of admins) {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: admin.email,
                subject: `🛒 New Order — $${order.total?.toFixed(2)} from ${order.customer_name}`,
                body: `New order received!\n\nCustomer: ${order.customer_name} (${order.customer_email})\nTotal: $${order.total?.toFixed(2)}\nOrder ID: ${order.id}\n\nItems:\n${order.items?.map(i => `  - ${i.quantity}x ${i.title}`).join('\n') || ''}\n\nShip to:\n${order.customer_address}\n\nManage orders: earthgoods.app/AdminDashboard`
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});