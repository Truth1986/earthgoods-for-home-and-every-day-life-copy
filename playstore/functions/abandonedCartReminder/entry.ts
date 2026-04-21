import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        // Find active carts not yet reminded, last updated more than 2 hours ago
        const abandonedCarts = await base44.asServiceRole.entities.AbandonedCart.filter({
            status: 'active',
            reminder_sent: false
        });

        const eligible = abandonedCarts.filter(cart =>
            cart.last_updated && cart.last_updated < twoHoursAgo && cart.items?.length > 0
        );

        let notified = 0;

        for (const cart of eligible) {
            const itemsList = cart.items
                .map(i => `  • ${i.quantity}x ${i.title} — $${(i.price * i.quantity).toFixed(2)}`)
                .join('\n');

            const cartTotal = cart.cart_total?.toFixed(2) || '0.00';
            const shopUrl = 'https://earthgoods.app/Shop';

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: cart.customer_email,
                from_name: 'EarthGoods',
                subject: `🌿 You left something behind, ${cart.customer_name?.split(' ')[0] || 'friend'}!`,
                body: `Hi ${cart.customer_name || 'there'},

It looks like you left some great items in your cart — we've been holding them for you! 🌱

━━━━━━━━━━━━━━━━━━━━━━
YOUR CART
━━━━━━━━━━━━━━━━━━━━━━
${itemsList}

Cart Total: $${cartTotal}
━━━━━━━━━━━━━━━━━━━━━━

Ready to complete your order? Head back to finish your purchase:
👉 ${shopUrl}

Your cart items are still waiting, but stock is limited — so don't wait too long!

As a reminder, we charge only a 3% platform fee so more of your money goes toward sustainable goods.

Questions? Just reply to this email.

With gratitude,
The EarthGoods Team 🌿

---
You're receiving this because you added items to your cart at EarthGoods.
`
            });

            await base44.asServiceRole.entities.AbandonedCart.update(cart.id, {
                reminder_sent: true,
                reminder_sent_at: new Date().toISOString()
            });

            notified++;
        }

        return Response.json({ success: true, carts_checked: abandonedCarts.length, reminders_sent: notified });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});