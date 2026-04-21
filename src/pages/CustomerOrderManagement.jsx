import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function CustomerOrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnForm, setReturnForm] = useState({ reason: '', type: 'return' });
  const [showReturnForm, setShowReturnForm] = useState(false);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch customer orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['customer-orders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.asServiceRole.entities.Order.filter({ customer_email: user.email }) || [];
    },
    enabled: !!user?.email,
  });

  // Fetch return requests
  const { data: returnRequests = [] } = useQuery({
    queryKey: ['customer-returns', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.asServiceRole.entities.ReturnExchange?.filter?.({ customer_email: user.email }) || [];
    },
    enabled: !!user?.email,
  });

  // Mutation for submitting return
  const submitReturn = useMutation({
    mutationFn: async (data: any) => {
      return base44.functions.invoke('processReturnExchange', {
        order_id: selectedOrder.id,
        reason: data.reason,
        type: data.type,
        items: selectedOrder.items,
      });
    },
    onSuccess: () => {
      toast.success('Return request submitted successfully');
      setShowReturnForm(false);
      setReturnForm({ reason: '', type: 'return' });
      setSelectedOrder(null);
    },
    onError: () => {
      toast.error('Failed to submit return request');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'delivered':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'refunded':
        return <RefreshCw className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      case 'payment_failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          <p className="text-gray-600 mt-2">Track, manage, and return your orders</p>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">You haven't placed any orders yet</p>
              <Button className="mt-4">Continue Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-2 space-y-4">
              {orders.map((order: any) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <h3 className="font-semibold text-lg">Order #{order.id.slice(-8).toUpperCase()}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_date || order.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Items:</span> {order.items?.length || 0} items
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Shipping:</span> {order.customer_address}
                          </p>
                          {order.tracking_number && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Tracking:</span> {order.tracking_number}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold">${order.total?.toFixed(2)}</p>
                        <Badge className={`mt-3 ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {order.items?.slice(0, 2).map((item: any, idx: number) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {item.quantity}x {item.title} — ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      ))}
                      {order.items?.length > 2 && (
                        <p className="text-sm text-gray-500">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Details Sidebar */}
            {selectedOrder && (
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status Timeline */}
                    <div>
                      <h4 className="font-semibold mb-3">Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm">Order Confirmed</span>
                        </div>
                        {selectedOrder.status !== 'pending' && (
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm">Payment Received</span>
                          </div>
                        )}
                        {['shipped', 'delivered'].includes(selectedOrder.status) && (
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm">Shipped</span>
                          </div>
                        )}
                        {selectedOrder.status === 'delivered' && (
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm">Delivered</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-4 border-t">
                      {['paid', 'shipped'].includes(selectedOrder.status) && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => setShowReturnForm(true)}
                        >
                          Return/Exchange
                        </Button>
                      )}
                      {selectedOrder.tracking_number && (
                        <Button className="w-full" variant="outline">
                          Track Shipment
                        </Button>
                      )}
                      <Button className="w-full" variant="outline">
                        Contact Support
                      </Button>
                    </div>

                    {/* Return Form */}
                    {showReturnForm && (
                      <div className="pt-4 border-t space-y-4">
                        <h4 className="font-semibold">Return/Exchange Request</h4>
                        
                        <Select value={returnForm.type} onValueChange={(value) => setReturnForm({ ...returnForm, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="return">Return</SelectItem>
                            <SelectItem value="exchange">Exchange</SelectItem>
                          </SelectContent>
                        </Select>

                        <Textarea
                          placeholder="Please tell us why you want to return..."
                          value={returnForm.reason}
                          onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                          rows={3}
                        />

                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => submitReturn.mutate(returnForm)}
                            disabled={submitReturn.isPending || !returnForm.reason}
                          >
                            {submitReturn.isPending ? 'Submitting...' : 'Submit'}
                          </Button>
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => {
                              setShowReturnForm(false);
                              setReturnForm({ reason: '', type: 'return' });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
