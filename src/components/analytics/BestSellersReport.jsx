import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, DollarSign, Award } from "lucide-react";

export default function BestSellersReport({ orders, dateRange }) {
  // Aggregate product sales data
  const productSales = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = {
          id: item.product_id,
          title: item.title,
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
      }
      productSales[item.product_id].quantity += item.quantity || 1;
      productSales[item.product_id].revenue += (item.price || 0) * (item.quantity || 1);
      productSales[item.product_id].orders += 1;
    });
  });

  const topByRevenue = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const topByQuantity = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Top Revenue Generators
          </CardTitle>
          <CardDescription>Products by total revenue ({dateRange})</CardDescription>
        </CardHeader>
        <CardContent>
          {topByRevenue.length > 0 ? (
            <div className="space-y-3">
              {topByRevenue.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-stone-200 text-stone-700' :
                      i === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {i === 0 ? <Award className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 truncate">{product.title}</p>
                      <p className="text-xs text-stone-500">{product.quantity} units • {product.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-emerald-700">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">No sales data</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Most Popular Products
          </CardTitle>
          <CardDescription>Products by units sold ({dateRange})</CardDescription>
        </CardHeader>
        <CardContent>
          {topByQuantity.length > 0 ? (
            <div className="space-y-3">
              {topByQuantity.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-stone-200 text-stone-700' :
                      i === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {i === 0 ? <Award className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 truncate">{product.title}</p>
                      <p className="text-xs text-stone-500">${product.revenue.toFixed(2)} revenue • {product.orders} orders</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0 flex-shrink-0">
                    {product.quantity} units
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">No sales data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}