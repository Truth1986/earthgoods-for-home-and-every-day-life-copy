import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign, ChevronRight } from "lucide-react";
import moment from 'moment';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function OrderHistory() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-40" />
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-white border-stone-200">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
          <h3 className="text-xl font-semibold text-stone-700 mb-2">No orders yet</h3>
          <p className="text-stone-500">Start shopping to see your order history here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id} className="bg-white border-stone-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg mb-2">Order #{order.id.slice(0, 8)}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-stone-500">
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
              <Badge className={`${statusColors[order.status]} border-0`}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-t border-stone-100">
                  <div className="flex-1">
                    <p className="font-medium text-stone-700">{item.title}</p>
                    <p className="text-sm text-stone-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-emerald-700">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            {order.customer_address && (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <p className="text-sm text-stone-600">
                  <span className="font-medium">Shipping to:</span> {order.customer_address}
                </p>
              </div>
            )}
            {order.notes && (
              <div className="mt-2">
                <p className="text-sm text-stone-600">
                  <span className="font-medium">Notes:</span> {order.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}