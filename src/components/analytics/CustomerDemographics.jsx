import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, ShoppingBag, DollarSign, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#84cc16'];

export default function CustomerDemographics({ orders }) {
  const customerData = useMemo(() => {
    const customers = {};
    
    orders.forEach(order => {
      const email = order.customer_email;
      if (!customers[email]) {
        customers[email] = {
          email,
          name: order.customer_name,
          orders: 0,
          totalSpent: 0,
          items: 0,
        };
      }
      customers[email].orders += 1;
      if (order.status !== 'pending') {
        customers[email].totalSpent += order.total || 0;
      }
      customers[email].items += order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    });

    return Object.values(customers);
  }, [orders]);

  const topCustomers = [...customerData]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const orderFrequencyDist = useMemo(() => {
    const dist = { '1': 0, '2-5': 0, '6-10': 0, '11+': 0 };
    customerData.forEach(c => {
      if (c.orders === 1) dist['1']++;
      else if (c.orders <= 5) dist['2-5']++;
      else if (c.orders <= 10) dist['6-10']++;
      else dist['11+']++;
    });
    return Object.entries(dist).map(([range, count]) => ({ range, count }));
  }, [customerData]);

  const spendingSegments = useMemo(() => {
    const segments = { 'Low ($0-50)': 0, 'Medium ($50-200)': 0, 'High ($200-500)': 0, 'VIP ($500+)': 0 };
    customerData.forEach(c => {
      if (c.totalSpent < 50) segments['Low ($0-50)']++;
      else if (c.totalSpent < 200) segments['Medium ($50-200)']++;
      else if (c.totalSpent < 500) segments['High ($200-500)']++;
      else segments['VIP ($500+)']++;
    });
    return Object.entries(segments).map(([name, value]) => ({ name, value })).filter(s => s.value > 0);
  }, [customerData]);

  const avgOrdersPerCustomer = customerData.length > 0 
    ? (customerData.reduce((sum, c) => sum + c.orders, 0) / customerData.length).toFixed(1)
    : 0;

  const avgSpentPerCustomer = customerData.length > 0
    ? (customerData.reduce((sum, c) => sum + c.totalSpent, 0) / customerData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-6">
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">{customerData.length}</p>
            <p className="text-sm text-stone-500 mt-1">Total Customers</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">{avgOrdersPerCustomer}</p>
            <p className="text-sm text-stone-500 mt-1">Avg Orders/Customer</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">${avgSpentPerCustomer.toFixed(2)}</p>
            <p className="text-sm text-stone-500 mt-1">Avg Customer LTV</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 mx-auto text-pink-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">
              {customerData.filter(c => c.orders > 1).length}
            </p>
            <p className="text-sm text-stone-500 mt-1">Repeat Customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="bg-white border-stone-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Top Customers by Spend
            </CardTitle>
            <CardDescription>Highest lifetime value customers</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, i) => (
                  <div key={customer.email} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                        i < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-700 truncate">{customer.name}</p>
                        <p className="text-xs text-stone-500 truncate">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-bold text-emerald-700">${customer.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-stone-500">{customer.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400">No customer data</div>
            )}
          </CardContent>
        </Card>

        {/* Order Frequency Distribution */}
        <Card className="bg-white border-stone-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              Order Frequency Distribution
            </CardTitle>
            <CardDescription>Number of orders per customer</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderFrequencyDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }} />
                <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Spending Segments */}
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Customer Spending Segments
          </CardTitle>
          <CardDescription>Distribution by lifetime spend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendingSegments}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {spendingSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}