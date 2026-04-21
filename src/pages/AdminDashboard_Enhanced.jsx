import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, DollarSign, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.asServiceRole.entities.Order.list?.() || [],
  });

  // Fetch analytics
  const { data: analytics = {} } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async () => {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[dateRange] || 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      return base44.functions.invoke('getAnalyticsConversions', {
        startDate,
        endDate: new Date(),
      });
    },
  });

  // Fetch low stock products
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const products = await base44.asServiceRole.entities.Product.list?.() || [];
      return products.filter((p: any) => (p.stock || 0) <= (p.reorder_level || 10));
    },
  });

  // Fetch pending return requests
  const { data: returnRequests = [] } = useQuery({
    queryKey: ['return-requests'],
    queryFn: () => base44.asServiceRole.entities.ReturnExchange?.filter?.({ status: 'pending' }) || [],
  });

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${(analytics.total_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      trend: '+12.5%',
    },
    {
      title: 'Orders',
      value: analytics.successful_payments || 0,
      icon: Package,
      trend: '+8.2%',
    },
    {
      title: 'Conversion Rate',
      value: analytics.conversion_rate || '0%',
      icon: TrendingUp,
      trend: '+2.1%',
    },
    {
      title: 'Avg Order Value',
      value: `$${(analytics.average_order_value || 0).toFixed(2)}`,
      icon: DollarSign,
      trend: '+5.3%',
    },
  ];

  const handleRefundOrder = async (orderId: string, ordTotal: number) => {
    try {
      const response = await base44.functions.invoke('processRefund', {
        order_id: orderId,
        reason: 'admin_request',
        amount: ordTotal,
      });
      toast.success('Refund processed successfully');
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };

  const handleApproveReturn = async (returnId: string) => {
    try {
      await base44.asServiceRole.entities.ReturnExchange?.update?.(returnId, {
        status: 'approved',
      });
      toast.success('Return request approved');
    } catch (error) {
      toast.error('Failed to approve return');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage orders, inventory, and analytics</p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
              size="sm"
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </Button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <IconComponent className="w-4 h-4 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-green-600 mt-2">{stat.trend} from last period</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            {['overview', 'orders', 'inventory', 'returns'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Tab */}
        {selectedTab === 'orders' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 10).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">{order.customer_email}</p>
                      <p className="text-xs text-gray-500">Order: {order.id.slice(-8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total?.toFixed(2)}</p>
                      <Badge
                        className={`mt-2 ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Tab */}
        {selectedTab === 'inventory' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Low Stock Products ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length === 0 ? (
                  <p className="text-gray-600">All products have sufficient stock</p>
                ) : (
                  lowStockProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-gray-600">Stock: {product.stock || 0}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Restock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Returns Tab */}
        {selectedTab === 'returns' && (
          <Card>
            <CardHeader>
              <CardTitle>Return Requests ({returnRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returnRequests.length === 0 ? (
                  <p className="text-gray-600">No pending return requests</p>
                ) : (
                  returnRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{request.customer_name}</p>
                        <p className="text-sm text-gray-600">Reason: {request.reason}</p>
                        <Badge className="mt-2 bg-orange-100 text-orange-800">
                          {request.type}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveReturn(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
