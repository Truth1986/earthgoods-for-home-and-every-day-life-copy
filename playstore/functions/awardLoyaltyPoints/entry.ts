import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only award points when order is paid
    if (!data || data.status !== 'paid') {
      return Response.json({ success: true, message: 'Order not paid, skipping points award' });
    }

    const orderId = data.id;
    const customerEmail = data.customer_email;
    const orderTotal = data.total || 0;

    if (!customerEmail) {
      return Response.json({ error: 'No customer email in order' }, { status: 400 });
    }

    // Calculate points: 1 point per dollar spent
    const pointsToAward = Math.floor(orderTotal);

    // Check if customer has loyalty record
    const existing = await base44.asServiceRole.entities.LoyaltyPoints.filter({ customer_email: customerEmail });
    
    if (existing.length > 0) {
      // Update existing record
      const loyaltyRecord = existing[0];
      const newTotal = (loyaltyRecord.total_points || 0) + pointsToAward;
      const newAvailable = (loyaltyRecord.available_points || 0) + pointsToAward;

      const newHistory = [...(loyaltyRecord.points_history || []), {
        type: 'earned',
        points: pointsToAward,
        description: `Purchase Order #${orderId}`,
        date: new Date().toISOString(),
        order_id: orderId
      }];

      // Determine tier
      let tier = 'bronze';
      if (newTotal >= 5000) tier = 'platinum';
      else if (newTotal >= 2000) tier = 'gold';
      else if (newTotal >= 500) tier = 'silver';

      await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyRecord.id, {
        total_points: newTotal,
        available_points: newAvailable,
        points_history: newHistory,
        tier
      });
    } else {
      // Create new record
      await base44.asServiceRole.entities.LoyaltyPoints.create({
        customer_email: customerEmail,
        total_points: pointsToAward,
        available_points: pointsToAward,
        redeemed_points: 0,
        points_history: [{
          type: 'earned',
          points: pointsToAward,
          description: `Purchase Order #${orderId}`,
          date: new Date().toISOString(),
          order_id: orderId
        }],
        tier: 'bronze'
      });
    }

    return Response.json({
      success: true,
      message: `Awarded ${pointsToAward} points to ${customerEmail}`,
      points_awarded: pointsToAward
    });
  } catch (error) {
    console.error('Loyalty points error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});