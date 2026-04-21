import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process paid orders
    if (data?.status !== 'paid') {
      return Response.json({ message: 'Skipped - order not marked as paid' });
    }

    const orderId = data.id;
    const order = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    
    if (!order.length) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = order[0];
    const products = await base44.asServiceRole.entities.Product.list();
    const suppliers = await base44.asServiceRole.entities.Supplier.list();

    // Map suppliers by ID
    const supplierMap = suppliers.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});

    // Map products by ID
    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    // Group items by supplier
    const supplierOrders = {};
    orderData.items?.forEach((item) => {
      const product = productMap[item.product_id];
      if (!product?.supplier_id) return;

      if (!supplierOrders[product.supplier_id]) {
        supplierOrders[product.supplier_id] = [];
      }
      supplierOrders[product.supplier_id].push(item);
    });

    // Send emails to each supplier
    const emailsSent = [];
    for (const [supplierId, items] of Object.entries(supplierOrders)) {
      const supplier = supplierMap[supplierId];
      if (!supplier?.email) continue;

      const itemsHtml = items
        .map((item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `)
        .join('');

      const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const emailBody = `
        <h2>New Order for Fulfillment</h2>
        <p>You have received a new order that needs to be fulfilled. Order details are below:</p>
        
        <h3>Order Information</h3>
        <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
        <p><strong>Order Date:</strong> ${new Date(orderData.created_date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> Paid</p>
        
        <h3>Customer Shipping Information</h3>
        <p><strong>Name:</strong> ${orderData.customer_name}</p>
        <p><strong>Email:</strong> ${orderData.customer_email}</p>
        <p><strong>Address:</strong> ${orderData.customer_address}</p>
        
        <h3>Items to Ship</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db;">Product</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #d1d5db;">Quantity</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <p style="margin-top: 16px; font-size: 16px; font-weight: bold;">
          Supplier Total: $${itemsTotal.toFixed(2)}
        </p>
        
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          Please confirm receipt of this order and provide a tracking number once shipped.
        </p>
      `;

      try {
        await base44.integrations.Core.SendEmail({
          to: supplier.email,
          subject: `New Order Fulfillment Request - Order ${orderId.slice(0, 8)}`,
          body: emailBody,
          from_name: 'EarthGoods',
        });
        emailsSent.push(supplier.email);
      } catch (emailError) {
        console.error(`Failed to send email to ${supplier.email}:`, emailError);
      }
    }

    return Response.json({
      success: true,
      orderId,
      suppliersNotified: emailsSent.length,
      emails: emailsSent,
    });
  } catch (error) {
    console.error('Supplier notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});