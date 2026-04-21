export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  customer_email?: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id?: string;
}

export interface OrderMetrics {
  order_id: string;
  customer_email: string;
  total_amount: number;
  items_count: number;
  shipping_method?: string;
  discount_applied?: number;
  payment_method?: string;
  timestamp: string;
}

export const analyticsTracker = {
  trackCheckoutInitiated: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'checkout_initiated',
      customer_email: data.customer_email,
      event_data: {
        items_count: data.items?.length || 0,
        subtotal: data.items?.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) || 0,
        shipping: data.shipping,
        has_discount: !!data.appliedCode,
      },
      timestamp: new Date().toISOString(),
    };
    return trackEvent(base44, event);
  },

  trackCheckoutCompleted: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'checkout_completed',
      customer_email: data.customer_email,
      event_data: {
        order_id: data.order_id,
        total: data.total,
        items_count: data.items?.length || 0,
        shipping: data.shipping,
        discount_applied: data.discount_applied,
      },
      timestamp: new Date().toISOString(),
    };
    return trackEvent(base44, event);
  },

  trackPaymentProcessed: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'payment_processed',
      customer_email: data.customer_email,
      event_data: {
        order_id: data.order_id,
        amount: data.amount,
        payment_method: data.payment_method || 'stripe',
        status: data.status,
      },
      timestamp: new Date().toISOString(),
    };
    return trackEvent(base44, event);
  },

  trackOrderShipped: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'order_shipped',
      customer_email: data.customer_email,
      event_data: {
        order_id: data.order_id,
        tracking_number: data.tracking_number,
        carrier: data.carrier,
      },
      timestamp: new Date().toISOString(),
    };
    return trackEvent(base44, event);
  },

  trackRefund: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'refund_processed',
      customer_email: data.customer_email,
      event_data: {
        order_id: data.order_id,
        refund_amount: data.refund_amount,
        reason: data.reason,
      },
      timestamp: new Date().toISOString(),
    };
    return trackEvent(base44, event);
  },

  trackLowStockAlert: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'low_stock_alert',
      event_data: {
        product_id: data.product_id,
        product_name: data.product_name,
        current_stock: data.current_stock,
        reorder_level: data.reorder_level,
      },
      timestamp: new Date().toISOString(),
    };
    return trackEvent(base44, event);
  },

  trackPageView: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'page_view',
      user_id: data.user_id,
      event_data: {
        page: data.page,
        referrer: data.referrer,
      },
      timestamp: new Date().toISOString(),
      session_id: data.session_id,
    };
    return trackEvent(base44, event);
  },

  trackAddToCart: (base44: any, data: any) => {
    const event: AnalyticsEvent = {
      event_name: 'add_to_cart',
      user_id: data.user_id,
      event_data: {
        product_id: data.product_id,
        product_name: data.product_name,
        price: data.price,
        quantity: data.quantity,
      },
      timestamp: new Date().toISOString(),
      session_id: data.session_id,
    };
    return trackEvent(base44, event);
  },
};

const trackEvent = async (base44: any, event: AnalyticsEvent): Promise<void> => {
  try {
    // Store analytics event in Analytics entity
    await base44.asServiceRole.entities.Analytics?.create?.(event);
    console.log(`Analytics tracked: ${event.event_name}`);
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't throw - analytics shouldn't break the main flow
  }
};

export const getConversionMetrics = async (base44: any, options?: any) => {
  try {
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options?.endDate || new Date();

    const checkouts = await base44.asServiceRole.entities.Analytics?.filter?.({
      event_name: 'checkout_completed',
      timestamp: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
    }) || [];

    const payments = await base44.asServiceRole.entities.Analytics?.filter?.({
      event_name: 'payment_processed',
      timestamp: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
    }) || [];

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.event_data?.amount || 0), 0);
    const conversionRate = payments.length / (checkouts.length || 1) * 100;

    return {
      total_checkouts: checkouts.length,
      successful_payments: payments.length,
      total_revenue: totalRevenue,
      conversion_rate: conversionRate.toFixed(2) + '%',
      average_order_value: (totalRevenue / (payments.length || 1)).toFixed(2),
    };
  } catch (error) {
    console.error('Error getting conversion metrics:', error);
    return null;
  }
};
