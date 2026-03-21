import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Package, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DropshipRevenueBreakdown() {
  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders-revenue'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-revenue'],
    queryFn: () => base44.entities.Product.list(),
  });

  const metrics = useMemo(() => {
    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    let ownRevenue = 0;
    let dropshipRevenue = 0;
    let ownCount = 0;
    let dropshipCount = 0;

    orders.forEach((order) => {
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        order.items?.forEach((item) => {
          const product = productMap[item.product_id];
          const itemTotal = item.price * item.quantity;

          if (product?.supplier_id) {
            dropshipRevenue += itemTotal;
            dropshipCount += item.quantity;
          } else {
            ownRevenue += itemTotal;
            ownCount += item.quantity;
          }
        });
      }
    });

    const totalRevenue = ownRevenue + dropshipRevenue;
    const ownPercent = totalRevenue > 0 ? ((ownRevenue / totalRevenue) * 100).toFixed(1) : 0;
    const dropshipPercent = totalRevenue > 0 ? ((dropshipRevenue / totalRevenue) * 100).toFixed(1) : 0;

    return {
      ownRevenue,
      dropshipRevenue,
      totalRevenue,
      ownPercent,
      dropshipPercent,
      ownCount,
      dropshipCount,
    };
  }, [orders, products]);

  const chartData = [
    { name: 'Own Products', value: parseFloat(metrics.ownPercent), revenue: metrics.ownRevenue },
    { name: 'Dropship', value: parseFloat(metrics.dropshipPercent), revenue: metrics.dropshipRevenue },
  ];

  const COLORS = ['#059669', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-500 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-stone-800">${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 mb-1">Own Products</p>
                <p className="text-3xl font-bold text-emerald-900">{metrics.ownPercent}%</p>
                <p className="text-xs text-emerald-600 mt-2">${metrics.ownRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <Badge className="bg-emerald-600 text-white border-0 h-fit">{metrics.ownCount} items</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 mb-1">Dropship Partners</p>
                <p className="text-3xl font-bold text-amber-900">{metrics.dropshipPercent}%</p>
                <p className="text-xs text-amber-600 mt-2">${metrics.dropshipRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <Badge className="bg-amber-600 text-white border-0 h-fit">{metrics.dropshipCount} items</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-stone-400">No revenue data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Details Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Breakdown Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx] }}
                    />
                    <div>
                      <p className="font-medium text-stone-800">{item.name}</p>
                      <p className="text-sm text-stone-500">${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-stone-800">{item.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}