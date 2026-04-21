import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { emailTemplates, sendEmail } from './utils/emailTemplates.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, reason, items, replacement_items, type } = body; // type: 'return' or 'exchange'

    // Validate input
    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    if (!reason) {
      return Response.json({ error: 'reason is required' }, { status: 400 });
    }

    if (!['return', 'exchange'].includes(type)) {
      return Response.json({ error: 'type must be "return" or "exchange"' }, { status: 400 });
    }

    // Get order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    if (!orders.length) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Check if order is eligible (must be paid and recent)
    if (order.status !== 'paid' && order.status !== 'shipped') {
      return Response.json({ error: 'Only paid or shipped orders can be returned' }, { status: 400 });
    }

    const orderDate = new Date(order.created_date || order.timestamp);
    const daysOld = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysOld > 30) {
      return Response.json({ error: 'Return window has expired (30 days)' }, { status: 400 });
    }

    // Create return/exchange request
    const requestData: any = {
      order_id,
      type,
      reason,
      status: 'pending',
      items: items || order.items,
      requested_date: new Date().toISOString(),
      customer_email: order.customer_email,
      customer_name: order.customer_name,
    };

    if (type === 'exchange' && replacement_items) {
      requestData.replacement_items = replacement_items;
    }

    const returnRequest = await base44.asServiceRole.entities.ReturnExchange?.create?.(requestData);

    // Send confirmation email to customer
    const subject = type === 'return' 
      ? `📦 Return Initiated — EarthGoods Order #${order_id.slice(-6).toUpperCase()}`
      : `🔄 Exchange Initiated — EarthGoods Order #${order_id.slice(-6).toUpperCase()}`;

    const emailBody = type === 'return'
      ? `Hi ${order.customer_name},

We've received your return request for order #${order_id.slice(-6).toUpperCase()}.

Return Details:
- Reason: ${reason}
- Items: ${items?.length || order.items?.length || 0}

Next Steps:
1. We'll send you a prepaid shipping label within 24 hours
2. Pack and ship your return within 14 days
3. Once received and inspected, we'll process your refund within 5-7 business days

Questions? Contact us at support@earthgoods.app

Thank you,
The EarthGoods Team 🌿`
      : `Hi ${order.customer_name},

We've received your exchange request for order #${order_id.slice(-6).toUpperCase()}.

Exchange Details:
- Reason: ${reason}
- Original Items: ${items?.length || order.items?.length || 0}
- Replacement Items: ${replacement_items?.length || 0}

Next Steps:
1. We'll send you a prepaid shipping label within 24 hours
2. Pack and ship back your items within 14 days
3. Once received, we'll inspect and ship your replacement within 5-7 business days

Questions? Contact us at support@earthgoods.app

Thank you,
The EarthGoods Team 🌿`;

    await sendEmail(base44, order.customer_email, {
      subject,
      body: emailBody,
    });

    // Notify admin
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const admin of admins) {
      await sendEmail(base44, admin.email, {
        subject: `⚠️ New ${type.toUpperCase()} Request: Order #${order_id.slice(-6).toUpperCase()}`,
        body: `New ${type} request:\n\nOrder: ${order_id}\nCustomer: ${order.customer_name}\nReason: ${reason}\n\nReview and process in admin dashboard.`,
      });
    }

    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} request created: ${returnRequest?.id}`);
    
    return Response.json({
      success: true,
      return_id: returnRequest?.id,
      type,
      status: 'pending',
    });
  } catch (error) {
    console.error('Return/Exchange error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
