// Email templates for consistent messaging

export interface EmailTemplate {
  subject: string;
  body: string;
}

export const emailTemplates = {
  orderConfirmation: (orderData: any): EmailTemplate => ({
    subject: `🌿 Order Confirmed — EarthGoods #${orderData.id.slice(-6).toUpperCase()}`,
    body: `Hi ${orderData.customer_name},

Thank you for your order! We're so grateful for your support of sustainable living. 🌱

━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━
Order ID: ${orderData.id}
Order Total: $${orderData.total?.toFixed(2)}

Items Ordered:
${orderData.items?.map((i: any) => `  • ${i.quantity}x ${i.title} — $${(i.price * i.quantity).toFixed(2)}`).join('\n') || ''}

Shipping To:
${orderData.customer_address}
━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
1. Complete your payment via Stripe
2. Once payment is received, we'll process and ship your order within 1-2 business days
3. You'll receive a shipping confirmation when your order is on its way!

Track your order any time at: earthgoods.app/TrackOrder
(Use your email and order ID: ${orderData.id})

Questions? Reply to this email and we'll get back to you quickly.

With gratitude,
The EarthGoods Team 🌿`,
  }),

  paymentConfirmed: (orderData: any, amountTotal: number): EmailTemplate => ({
    subject: '✅ Payment Confirmed — Your EarthGoods Order',
    body: `Hi ${orderData.customer_name || 'there'},

Great news — your payment of $${amountTotal.toFixed(2)} has been confirmed!

Order ID: ${orderData.id}

Items:
${orderData.items?.map((i: any) => `- ${i.quantity}x ${i.title} ($${(i.price * i.quantity).toFixed(2)})`).join('\n') || 'See order details'}

We'll notify you once your order ships.

Thank you for shopping at EarthGoods! 🌿

— The EarthGoods Team`,
  }),

  shipmentNotification: (orderData: any, trackingNumber: string, carrier: string): EmailTemplate => ({
    subject: `📦 Your EarthGoods Order #${orderData.id.slice(-6).toUpperCase()} is on the way!`,
    body: `Hi ${orderData.customer_name},

Exciting news! Your order is on its way! 🚚

Order ID: ${orderData.id}
Tracking Number: ${trackingNumber}
Carrier: ${carrier}

Track your shipment: https://www.${carrier.toLowerCase()}.com/track?number=${trackingNumber}

Your order includes:
${orderData.items?.map((i: any) => `  • ${i.quantity}x ${i.title}`).join('\n') || ''}

Delivery to:
${orderData.customer_address}

Expected delivery in 3-7 business days.

Thank you for supporting sustainable living!

— The EarthGoods Team 🌿`,
  }),

  refundConfirmed: (orderData: any, refundAmount: number, reason: string): EmailTemplate => ({
    subject: '💚 Refund Confirmed — EarthGoods',
    body: `Hi ${orderData.customer_name},

We've processed a refund of $${refundAmount.toFixed(2)} for your order #${orderData.id.slice(-6).toUpperCase()}.

Reason: ${reason}

The refund should appear in your account within 3-5 business days.

Thank you for your understanding.

Best,
The EarthGoods Team 🌿`,
  }),

  restockOrderRequest: (supplierData: any, order: any): EmailTemplate => ({
    subject: `📦 Restock Order Request — EarthGoods #${order.id.slice(-6).toUpperCase()}`,
    body: `Hello ${supplierData.supplier_name},

We would like to place a restock order for the following products:

${order.products?.map((p: any) => `
Product: ${p.product_title}
SKU: ${p.supplier_sku || 'N/A'}
Current Stock: ${p.current_stock}
Requested Quantity: ${p.suggested_quantity}
`).join('\n') || ''}

Total Items: ${order.products?.reduce((sum: number, p: any) => sum + p.suggested_quantity, 0) || 0}

Please confirm receipt and provide an estimated delivery date.

Best regards,
EarthGoods Management`,
  }),

  lowStockAlert: (productName: string, currentStock: number, reorderLevel: number): EmailTemplate => ({
    subject: `⚠️ Low Stock Alert: ${productName}`,
    body: `Hi Admin,

The following product is running low on stock:

Product: ${productName}
Current Stock: ${currentStock}
Reorder Level: ${reorderLevel}

Please review and consider placing a restock order.

— EarthGoods System`,
  }),

  paymentFailed: (orderData: any, failureReason: string): EmailTemplate => ({
    subject: '❌ Payment Failed — EarthGoods Order #' + orderData.id.slice(-6).toUpperCase(),
    body: `Hi ${orderData.customer_name},

Unfortunately, your payment couldn't be processed.

Reason: ${failureReason}

Please try again or contact us for assistance:
Email: support@earthgoods.app

Order ID: ${orderData.id}

We look forward to helping you complete your purchase!

— The EarthGoods Team 🌿`,
  }),
};

export const sendEmail = async (base44: any, to: string, template: EmailTemplate) => {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: template.subject,
      body: template.body,
    });
    console.log(`Email sent to ${to}: ${template.subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};
