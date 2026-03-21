import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, Clock, MapPin, ChevronDown, ChevronUp, Calendar, DollarSign } from "lucide-react";
import moment from 'moment';

const statusConfig = {
  pending: {
    label: 'Order Placed',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    step: 0,
  },
  paid: {
    label: 'Payment Confirmed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    step: 1,
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
    step: 2,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
    step: 3,
  },
};

const STEPS = ['pending', 'paid', 'shipped', 'delivered'];

// Mock shipping events based on order status and dates
function getMockShippingEvents(order) {
  const events = [];
  const created = moment(order.created_date);

  events.push({
    date: created.format('MMM D, YYYY h:mm A'),
    label: 'Order received',
    detail: 'Your order has been placed and is awaiting payment.',
    done: true,
  });

  if (['paid', 'shipped', 'delivered'].includes(order.status)) {
    events.push({
      date: created.add(1, 'hours').format('MMM D, YYYY h:mm A'),
      label: 'Payment confirmed',
      detail: 'Payment processed successfully. Order is being prepared.',
      done: true,
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    events.push({
      date: created.add(1, 'days').format('MMM D, YYYY h:mm A'),
      label: 'Shipped — In Transit',
      detail: `Package picked up by carrier. Tracking #EG${order.id.slice(0, 8).toUpperCase()}`,
      done: true,
    });
    events.push({
      date: created.add(2, 'days').format('MMM D, YYYY h:mm A'),
      label: 'Out for delivery',
      detail: 'Package is out for delivery in your area.',
      done: order.status === 'delivered',
    });
  }

  if (order.status === 'delivered') {
    events.push({
      date: created.add(3, 'days').format('MMM D, YYYY h:mm A'),
      label: 'Delivered',
      detail: 'Package delivered successfully.',
      done: true,
    });
  }

  return events;
}

function OrderTrackingCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const currentStep = statusConfig[order.status]?.step ?? 0;
  const events = getMockShippingEvents(order);

  return (
    <Card className="bg-white border-stone-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {moment(order.created_date).format('MMM DD, YYYY')}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ${order.total?.toFixed(2)}
              </div>
            </div>
          </div>
          <Badge className={`${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'} border-0`}>
            {statusConfig[order.status]?.label || order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, idx) => {
            const cfg = statusConfig[step];
            const Icon = cfg.icon;
            const done = idx <= currentStep;
            const active = idx === currentStep;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-stone-300 text-stone-300'
                  } ${active ? 'ring-2 ring-emerald-300' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs mt-1 text-center w-16 leading-tight ${done ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>
                    {cfg.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-5 mx-1 ${idx < currentStep ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Items summary */}
        <div className="pt-2 border-t border-stone-100">
          {order.items?.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1">
              <span className="text-stone-600">{item.quantity}× {item.title}</span>
              <span className="text-stone-700 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items?.length > 2 && (
            <p className="text-xs text-stone-400 mt-1">+{order.items.length - 2} more items</p>
          )}
        </div>

        {/* Shipping address */}
        {order.customer_address && (
          <div className="flex items-start gap-2 text-sm text-stone-600 bg-stone-50 rounded-lg p-3">
            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>{order.customer_address}</span>
          </div>
        )}

        {/* Expand for timeline */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-stone-500 hover:text-emerald-700"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {expanded ? 'Hide' : 'Show'} Shipping Timeline
        </Button>

        {expanded && (
          <div className="space-y-3 pt-1">
            {events.map((ev, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 ${ev.done ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-stone-200 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className={`text-sm font-medium ${ev.done ? 'text-stone-800' : 'text-stone-400'}`}>{ev.label}</p>
                  <p className="text-xs text-stone-500">{ev.detail}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrderTracking() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders-tracking', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: 60000, // auto-refresh every 60s
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse"><CardContent className="p-6 h-48" /></Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-white border-stone-200">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
          <h3 className="text-xl font-semibold text-stone-700 mb-2">No orders to track</h3>
          <p className="text-stone-500">Once you place an order, you can track it here in real time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 flex items-center gap-1">
        <Truck className="w-4 h-4" /> Status updates automatically every minute. Email notifications sent on status changes.
      </p>
      {orders.map(order => (
        <OrderTrackingCard key={order.id} order={order} />
      ))}
    </div>
  );
}