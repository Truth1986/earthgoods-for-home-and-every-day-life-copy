import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, TrendingUp, Users, Package, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
};

export default function SalesOverview() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(orders.map(o => o.customer_email)).size;

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Last 7 days daily revenue
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const day = startOfDay(subDays(new Date(), 6 - i));
      const dayStr = format(day, 'MMM d');
      const dayOrders = orders.filter(o => {
        const d = startOfDay(new Date(o.created_date));
        return d.getTime() === day.getTime();
      });
      return {
        date: dayStr,
        revenue: parseFloat(dayOrders.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)),
        orders: dayOrders.length,
      };
    });

    // Top products
    const productMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productMap[item.title]) productMap[item.title] = { title: item.title, qty: 0, revenue: 0 };
        productMap[item.title].qty += item.quantity || 0;
        productMap[item.title].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { totalRevenue, totalOrders, avgOrderValue, uniqueCustomers, statusCounts, last7, topProducts };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-stone-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Sales Overview</h1>
            <p className="text-stone-500 text-sm mt-1">All-time performance at a glance</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-stone-800">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Total Orders</p>
                      <p className="text-2xl font-bold text-stone-800">{stats.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Avg Order Value</p>
                      <p className="text-2xl font-bold text-stone-800">${stats.avgOrderValue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Unique Customers</p>
                      <p className="text-2xl font-bold text-stone-800">{stats.uniqueCustomers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-stone-700">Revenue — Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.last7}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `$${v}`} />
                      <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-stone-700">Orders — Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.last7}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown + Top Products */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-stone-700">Orders by Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['pending', 'paid', 'shipped', 'delivered'].map(status => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge className={`capitalize ${statusColors[status]}`}>{status}</Badge>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className="flex-1 bg-stone-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: stats.totalOrders ? `${((stats.statusCounts[status] || 0) / stats.totalOrders) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      <span className="text-stone-700 font-semibold w-6 text-right">{stats.statusCounts[status] || 0}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base text-stone-700 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Top Products by Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.topProducts.length === 0 ? (
                    <p className="text-stone-400 text-sm">No product data yet.</p>
                  ) : stats.topProducts.map((p, i) => (
                    <div key={p.title} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-stone-400 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{p.title}</p>
                        <p className="text-xs text-stone-500">{p.qty} units sold</p>
                      </div>
                      <span className="text-emerald-700 font-semibold text-sm">${p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base text-stone-700">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="text-left py-2 text-stone-500 font-medium">Customer</th>
                        <th className="text-left py-2 text-stone-500 font-medium">Date</th>
                        <th className="text-left py-2 text-stone-500 font-medium">Status</th>
                        <th className="text-right py-2 text-stone-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 10).map(order => (
                        <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                          <td className="py-3">
                            <p className="font-medium text-stone-800">{order.customer_name}</p>
                            <p className="text-xs text-stone-400">{order.customer_email}</p>
                          </td>
                          <td className="py-3 text-stone-500">{format(new Date(order.created_date), 'MMM d, yyyy')}</td>
                          <td className="py-3">
                            <Badge className={`capitalize text-xs ${statusColors[order.status]}`}>{order.status}</Badge>
                          </td>
                          <td className="py-3 text-right font-semibold text-stone-800">${(order.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <p className="text-center text-stone-400 py-8">No orders yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}