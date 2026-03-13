import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { format, startOfWeek, startOfMonth, startOfYear, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval } from 'date-fns';

export default function SalesTrendsReport({ orders, timeframe }) {
  const trendData = useMemo(() => {
    if (orders.length === 0) return [];

    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );
    
    const firstDate = new Date(sortedOrders[0].created_date);
    const lastDate = new Date();

    let intervals = [];
    let formatStr = '';
    let groupingFn;

    if (timeframe === 'weekly') {
      intervals = eachWeekOfInterval({ start: firstDate, end: lastDate });
      formatStr = 'MMM dd';
      groupingFn = (date) => format(startOfWeek(new Date(date)), 'yyyy-MM-dd');
    } else if (timeframe === 'monthly') {
      intervals = eachMonthOfInterval({ start: firstDate, end: lastDate });
      formatStr = 'MMM yyyy';
      groupingFn = (date) => format(startOfMonth(new Date(date)), 'yyyy-MM');
    } else {
      intervals = eachYearOfInterval({ start: firstDate, end: lastDate });
      formatStr = 'yyyy';
      groupingFn = (date) => format(startOfYear(new Date(date)), 'yyyy');
    }

    const grouped = {};
    orders.forEach(order => {
      const key = groupingFn(order.created_date);
      if (!grouped[key]) {
        grouped[key] = { orders: 0, revenue: 0, items: 0 };
      }
      grouped[key].orders += 1;
      if (order.status !== 'pending') {
        grouped[key].revenue += order.total || 0;
      }
      grouped[key].items += order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    });

    return intervals.map(date => {
      const key = timeframe === 'weekly' ? format(date, 'yyyy-MM-dd') :
                   timeframe === 'monthly' ? format(date, 'yyyy-MM') :
                   format(date, 'yyyy');
      const data = grouped[key] || { orders: 0, revenue: 0, items: 0 };
      return {
        period: format(date, formatStr),
        ...data,
      };
    });
  }, [orders, timeframe]);

  const totalRevenue = trendData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = trendData.reduce((sum, d) => sum + d.orders, 0);
  const avgPerPeriod = trendData.length > 0 ? (totalRevenue / trendData.length) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-stone-500 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">${avgPerPeriod.toFixed(2)}</p>
            <p className="text-sm text-stone-500 mt-1">Avg per {timeframe === 'weekly' ? 'Week' : timeframe === 'monthly' ? 'Month' : 'Year'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-stone-800">{totalOrders}</p>
            <p className="text-sm text-stone-500 mt-1">Total Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Revenue Trend ({timeframe})
          </CardTitle>
          <CardDescription>Historical revenue performance</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 12 }} stroke="#78716c" tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                  formatter={(value, name) => {
                    if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#059669" 
                  fill="#d1fae5" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-stone-400">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders and Items Chart */}
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Orders & Items Trend
          </CardTitle>
          <CardDescription>Order volume and items sold over time</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#d97706" 
                  strokeWidth={2}
                  dot={{ fill: '#d97706' }}
                  name="Orders"
                />
                <Line 
                  type="monotone" 
                  dataKey="items" 
                  stroke="#7c3aed" 
                  strokeWidth={2}
                  dot={{ fill: '#7c3aed' }}
                  name="Items Sold"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-stone-400">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}