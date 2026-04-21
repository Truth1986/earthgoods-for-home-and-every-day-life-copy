import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { restock_order_id, notes } = await req.json();

    if (!restock_order_id) {
      return Response.json({ error: 'restock_order_id is required' }, { status: 400 });
    }

    const orders = await base44.asServiceRole.entities.RestockOrder.filter({
      id: restock_order_id,
    });

    if (!orders.length) {
      return Response.json({ error: 'Restock order not found' }, { status: 404 });
    }

    const order = orders[0];
    if (order.status !== 'draft') {
      return Response.json({ error: 'Only draft orders can be sent' }, { status: 400 });
    }

    // Build email body
    const productsHtml = order.products
      .map((p) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.product_title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.supplier_sku || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.current_stock}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.suggested_quantity}</td>
        </tr>
      `)
      .join('');

    const emailBody = `
      <h2>Restock Order Request</h2>
      <p>Hello ${order.supplier_name},</p>
      <p>We would like to place a restock order for the following products:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db;">Product</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db;">SKU</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #d1d5db;">Current Stock</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #d1d5db;">Suggested Qty</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
      
      ${notes ? `<p><strong>Additional Notes:</strong></p><p>${notes}</p>` : ''}
      
      <p>Please confirm receipt and provide an estimated delivery date.</p>
      <p>Thank you!</p>
    `;

    // Send email
    await base44.integrations.Core.SendEmail({
      to: order.supplier_email,
      subject: `Restock Order Request - ${order.supplier_name}`,
      body: emailBody,
      from_name: 'EarthGoods',
    });

    // Update order status
    await base44.asServiceRole.entities.RestockOrder.update(restock_order_id, {
      status: 'sent',
      sent_date: new Date().toISOString(),
      notes: notes || order.notes,
    });

    return Response.json({
      success: true,
      message: `Restock order sent to ${order.supplier_email}`,
    });
  } catch (error) {
    console.error('Send restock order error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});