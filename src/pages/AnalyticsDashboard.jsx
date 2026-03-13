import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, ArrowLeft, TrendingUp, TrendingDown, Users, ShoppingCart, 
  Eye, DollarSign, Package, BarChart3, PieChart as PieChartIcon,
  Calendar, RefreshCw, Award, LineChart as LineChartIcon, Lock
} from "lucide-react";
import BestSellersReport from "@/components/analytics/BestSellersReport";
import SalesTrendsReport from "@/components/analytics/SalesTrendsReport";
import CustomerDemographics from "@/components/analytics/CustomerDemographics";
import OwnerProfitView from "@/components/analytics/OwnerProfitView";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

const COLORS = ['#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#84cc16'];

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('7days');
  const [trendTimeframe, setTrendTimeframe] = useState('monthly');

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const { data: wishlists = [] } = useQuery({
    queryKey: ['analytics-wishlists'],
    queryFn: () => base44.entities.Wishlist.list('-created_date', 500),
  });

  const isLoading = ordersLoading || productsLoading;

  // Calculate date range
  const getDaysCount = () => {
    switch(dateRange) {
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 7;
    }
  };

  const daysCount = getDaysCount();
  const startDate = subDays(new Date(), daysCount);

  // Filter orders by date range
  const filteredOrders = orders.filter(order => 
    new Date(order.created_date) >= startDate
  );

  // Calculate metrics
  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'pending')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  
  const totalOrders = filteredOrders.length;
  const paidOrders = filteredOrders.filter(o => o.status !== 'pending').length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  
  // Unique customers
  const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_email)).size;

  // Conversion rate (paid vs total orders)
  const conversionRate = totalOrders > 0 ? ((paidOrders / totalOrders) * 100).toFixed(1) : 0;

  // Cart abandonment (pending orders)
  const abandonmentRate = totalOrders > 0 ? ((pendingOrders / totalOrders) * 100).toFixed(1) : 0;

  // Sales over time
  const salesOverTime = eachDayOfInterval({ start: startDate, end: new Date() }).map(date => {
    const dayOrders = filteredOrders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
    });
    const dayRevenue = dayOrders
      .filter(o => o.status !== 'pending')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    
    return {
      date: format(date, 'MMM dd'),
      orders: dayOrders.length,
      revenue: dayRevenue,
      visitors: Math.floor(Math.random() * 200) + 50, // Simulated traffic data
      pageViews: Math.floor(Math.random() * 500) + 100, // Simulated
    };
  });

  // Popular products (from order items)
  const productSales = {};
  filteredOrders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!productSales[item.title]) {
        productSales[item.title] = { name: item.title, quantity: 0, revenue: 0 };
      }
      productSales[item.title].quantity += item.quantity || 1;
      productSales[item.title].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });
  const popularProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // Orders by status
  const ordersByStatus = [
    { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length, color: '#fbbf24' },
    { name: 'Paid', value: filteredOrders.filter(o => o.status === 'paid').length, color: '#3b82f6' },
    { name: 'Shipped', value: filteredOrders.filter(o => o.status === 'shipped').length, color: '#8b5cf6' },
    { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length, color: '#10b981' },
  ].filter(s => s.value > 0);

  // Products by category
  const productsByCategory = products.reduce((acc, p) => {
    const cat = p.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(productsByCategory).map(([name, value]) => ({ name, value }));

  // Wishlist insights
  const wishlistByProduct = wishlists.reduce((acc, w) => {
    acc[w.product_title] = (acc[w.product_title] || 0) + 1;
    return acc;
  }, {});
  const topWishlisted = Object.entries(wishlistByProduct)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtitle }) => (
    <Card className="bg-white border-stone-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-stone-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-stone-800">{value}</p>
            {subtitle && <p className="text-xs text-stone-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            trend === 'up' ? 'bg-emerald-100' : trend === 'down' ? 'bg-red-100' : 'bg-stone-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-stone-600'
            }`} />
          </div>
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 mt-3 text-sm ${
            trend === 'up' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-800">Analytics Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1">
              {['7days', '30days', '90days'].map(range => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-full ${dateRange === range ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  onClick={() => setDateRange(range)}
                >
                  {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => refetchOrders()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Revenue"
                value={`$${totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                trend="up"
                subtitle={`From ${paidOrders} paid orders`}
              />
              <StatCard
                title="Unique Visitors"
                value={salesOverTime.reduce((s, d) => s + d.visitors, 0).toLocaleString()}
                icon={Users}
                trend="up"
                subtitle="Estimated from activity"
              />
              <StatCard
                title="Page Views"
                value={salesOverTime.reduce((s, d) => s + d.pageViews, 0).toLocaleString()}
                icon={Eye}
                trend="up"
                subtitle={`Last ${daysCount} days`}
              />
              <StatCard
                title="Conversion Rate"
                value={`${conversionRate}%`}
                icon={TrendingUp}
                trend={parseFloat(conversionRate) > 50 ? 'up' : 'down'}
                subtitle={`${abandonmentRate}% cart abandonment`}
              />
            </div>

            <Tabs defaultValue="traffic" className="space-y-6">
              <TabsList className="bg-white border border-stone-200 p-1 rounded-full flex-wrap">
                <TabsTrigger value="traffic" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Traffic
                </TabsTrigger>
                <TabsTrigger value="sales" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Sales
                </TabsTrigger>
                <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Package className="w-4 h-4 mr-2" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="customers" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="bestsellers" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Award className="w-4 h-4 mr-2" />
                  Best Sellers
                </TabsTrigger>
                <TabsTrigger value="trends" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <LineChartIcon className="w-4 h-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="demographics" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Demographics
                </TabsTrigger>
                <TabsTrigger value="profit" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Lock className="w-4 h-4 mr-2" />
                  Profit
                </TabsTrigger>
              </TabsList>

              {/* Traffic Tab */}
              <TabsContent value="traffic" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="w-5 h-5 text-emerald-600" />
                        Page Views Over Time
                      </CardTitle>
                      <CardDescription>Daily page views for the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="pageViews" 
                            stroke="#059669" 
                            fill="#d1fae5" 
                            name="Page Views"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        Unique Visitors
                      </CardTitle>
                      <CardDescription>Daily unique visitors over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="visitors" 
                            stroke="#d97706" 
                            strokeWidth={2}
                            dot={{ fill: '#d97706' }}
                            name="Visitors"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Traffic Summary Cards */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-emerald-600">
                        {(salesOverTime.reduce((s, d) => s + d.pageViews, 0) / salesOverTime.reduce((s, d) => s + d.visitors, 0) || 0).toFixed(1)}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">Pages per Visit</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-amber-600">
                        {Math.floor(salesOverTime.reduce((s, d) => s + d.visitors, 0) / daysCount)}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">Avg Daily Visitors</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {Math.floor(salesOverTime.reduce((s, d) => s + d.pageViews, 0) / daysCount)}
                      </p>
                      <p className="text-sm text-stone-500 mt-1">Avg Daily Page Views</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        Revenue Over Time
                      </CardTitle>
                      <CardDescription>Daily revenue for the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#78716c" tickFormatter={(v) => `$${v}`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#059669" 
                            fill="#d1fae5" 
                            name="Revenue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-amber-600" />
                        Orders by Status
                      </CardTitle>
                      <CardDescription>Distribution of order statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={ordersByStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {ordersByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Sales Summary */}
                <div className="grid sm:grid-cols-4 gap-6">
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-emerald-600">${avgOrderValue.toFixed(2)}</p>
                      <p className="text-sm text-stone-500 mt-1">Avg Order Value</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
                      <p className="text-sm text-stone-500 mt-1">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-green-600">{paidOrders}</p>
                      <p className="text-sm text-stone-500 mt-1">Completed Orders</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-amber-600">{pendingOrders}</p>
                      <p className="text-sm text-stone-500 mt-1">Pending Orders</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        Top Selling Products
                      </CardTitle>
                      <CardDescription>Products by quantity sold</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {popularProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={popularProducts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#78716c" />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              tick={{ fontSize: 11 }} 
                              stroke="#78716c" 
                              width={120}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                            />
                            <Bar dataKey="quantity" fill="#059669" radius={[0, 4, 4, 0]} name="Units Sold" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-stone-400">
                          No sales data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-amber-600" />
                        Products by Category
                      </CardTitle>
                      <CardDescription>Distribution of products across categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Most Wishlisted */}
                <Card className="bg-white border-stone-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-pink-600" />
                      Most Wishlisted Products
                    </CardTitle>
                    <CardDescription>Products users want the most</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topWishlisted.length > 0 ? (
                      <div className="space-y-3">
                        {topWishlisted.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-semibold text-sm">
                                {i + 1}
                              </span>
                              <span className="font-medium text-stone-700">{item.name}</span>
                            </div>
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                              {item.count} saves
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-stone-400">
                        No wishlist data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Best Sellers Tab */}
              <TabsContent value="bestsellers" className="space-y-6">
                <BestSellersReport orders={filteredOrders} dateRange={`Last ${daysCount} days`} />
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-stone-800">Sales Trends Analysis</h3>
                  <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full p-1">
                    {['weekly', 'monthly', 'yearly'].map(tf => (
                      <Button
                        key={tf}
                        variant={trendTimeframe === tf ? 'default' : 'ghost'}
                        size="sm"
                        className={`rounded-full ${trendTimeframe === tf ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setTrendTimeframe(tf)}
                      >
                        {tf.charAt(0).toUpperCase() + tf.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <SalesTrendsReport orders={orders} timeframe={trendTimeframe} />
              </TabsContent>

              {/* Demographics Tab */}
              <TabsContent value="demographics" className="space-y-6">
                <CustomerDemographics orders={orders} />
              </TabsContent>

              {/* Profit Tab */}
              <TabsContent value="profit" className="space-y-6">
                <OwnerProfitView totalRevenue={totalRevenue} />
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-6">
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-4xl font-bold text-emerald-600">{uniqueCustomers}</p>
                      <p className="text-sm text-stone-500 mt-2">Unique Customers</p>
                      <p className="text-xs text-stone-400 mt-1">In selected period</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-4xl font-bold text-amber-600">
                        {uniqueCustomers > 0 ? (totalOrders / uniqueCustomers).toFixed(1) : 0}
                      </p>
                      <p className="text-sm text-stone-500 mt-2">Orders per Customer</p>
                      <p className="text-xs text-stone-400 mt-1">Average</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-stone-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-4xl font-bold text-purple-600">
                        ${uniqueCustomers > 0 ? (totalRevenue / uniqueCustomers).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-sm text-stone-500 mt-2">Revenue per Customer</p>
                      <p className="text-xs text-stone-400 mt-1">Average lifetime value</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border-stone-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      Orders Over Time
                    </CardTitle>
                    <CardDescription>Daily order count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4' }}
                        />
                        <Bar dataKey="orders" fill="#059669" radius={[4, 4, 0, 0]} name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}