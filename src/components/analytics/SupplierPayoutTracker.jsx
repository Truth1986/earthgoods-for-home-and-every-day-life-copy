import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, User, DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function SupplierPayoutTracker() {
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [exporting, setExporting] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-payout'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-payout'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-payout'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  // Calculate payouts for selected month
  const payoutData = useMemo(() => {
    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const supplierMap = suppliers.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});

    const payouts = {};
    const [year, month] = selectedMonth.split('-');

    orders.forEach((order) => {
      // Only process paid/shipped/delivered orders in selected month
      if (!['paid', 'shipped', 'delivered'].includes(order.status)) return;

      const orderDate = moment(order.created_date);
      if (orderDate.format('YYYY-MM') !== selectedMonth) return;

      order.items?.forEach((item) => {
        const product = productMap[item.product_id];
        if (!product?.supplier_id) return;

        const supplierId = product.supplier_id;
        const itemTotal = item.price * item.quantity;

        if (!payouts[supplierId]) {
          payouts[supplierId] = {
            supplier_id: supplierId,
            supplier_name: supplierMap[supplierId]?.name || 'Unknown',
            supplier_email: supplierMap[supplierId]?.email || '',
            total_amount: 0,
            order_count: new Set(),
            item_count: 0,
            orders: [],
          };
        }

        payouts[supplierId].total_amount += itemTotal;
        payouts[supplierId].order_count.add(order.id);
        payouts[supplierId].item_count += item.quantity;
        payouts[supplierId].orders.push({
          order_id: order.id,
          date: order.created_date,
          customer: order.customer_name,
          product: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          total: itemTotal,
        });
      });
    });

    return Object.values(payouts).map(p => ({
      ...p,
      order_count: p.order_count.size,
    })).sort((a, b) => b.total_amount - a.total_amount);
  }, [orders, products, suppliers, selectedMonth]);

  const totalPayout = payoutData.reduce((sum, p) => sum + p.total_amount, 0);
  const totalOrders = payoutData.reduce((sum, p) => sum + p.order_count, 0);

  const downloadCSV = () => {
    setExporting(true);

    try {
      // Build CSV header
      const headers = [
        'Supplier Name',
        'Supplier Email',
        'Order Count',
        'Items Sold',
        'Total Amount',
        'Payment Status',
      ];

      // Build CSV rows
      const rows = payoutData.map(p => [
        p.supplier_name,
        p.supplier_email,
        p.order_count,
        p.item_count,
        `$${p.total_amount.toFixed(2)}`,
        'Pending', // Default status
      ]);

      // Add summary row
      rows.push([
        'TOTAL',
        '',
        totalOrders,
        payoutData.reduce((sum, p) => sum + p.item_count, 0),
        `$${totalPayout.toFixed(2)}`,
        '',
      ]);

      // Combine headers and rows
      const csvContent = [
        `Settlement Report for ${moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')}`,
        `Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier-payouts-${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('CSV report downloaded');
      base44.analytics.track({
        eventName: 'supplier_payout_csv_exported',
        properties: {
          month: selectedMonth,
          supplier_count: payoutData.length,
          total_payout: totalPayout,
        }
      });
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          Supplier Payouts
        </h2>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
          />
          <Button
            onClick={downloadCSV}
            disabled={exporting || payoutData.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-500 mb-1">Total Payout</p>
            <p className="text-3xl font-bold text-emerald-700">
              ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-500 mb-1">Suppliers</p>
            <p className="text-3xl font-bold text-stone-800">{payoutData.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-500 mb-1">Orders</p>
            <p className="text-3xl font-bold text-stone-800">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {moment(selectedMonth, 'YYYY-MM').format('MMMM YYYY')} Settlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutData.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <User className="w-12 h-12 mx-auto text-stone-300 mb-4" />
              <p>No supplier payouts for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 font-semibold text-stone-700">Supplier</th>
                    <th className="text-right py-3 px-4 font-semibold text-stone-700">Orders</th>
                    <th className="text-right py-3 px-4 font-semibold text-stone-700">Items</th>
                    <th className="text-right py-3 px-4 font-semibold text-stone-700">Total Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-stone-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutData.map((payout) => (
                    <tr key={payout.supplier_id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-stone-800">{payout.supplier_name}</p>
                          <p className="text-xs text-stone-500">{payout.supplier_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-stone-800">
                        {payout.order_count}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-600">
                        {payout.item_count}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold text-emerald-700">
                          ${payout.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-amber-100 text-amber-700 border-0">Pending</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Orders View */}
      {payoutData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Detailed Order Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payoutData.map((payout) => (
                <div key={payout.supplier_id} className="border border-stone-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-stone-800">{payout.supplier_name}</h4>
                    <span className="text-lg font-bold text-emerald-700">
                      ${payout.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-stone-50">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">Order ID</th>
                          <th className="text-left py-2 px-2">Customer</th>
                          <th className="text-left py-2 px-2">Product</th>
                          <th className="text-right py-2 px-2">Qty</th>
                          <th className="text-right py-2 px-2">Price</th>
                          <th className="text-right py-2 px-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payout.orders.map((order, idx) => (
                          <tr key={idx} className="border-t border-stone-100">
                            <td className="py-2 px-2 text-stone-600">
                              {moment(order.date).format('MMM DD')}
                            </td>
                            <td className="py-2 px-2 font-mono text-stone-600">
                              {order.order_id.slice(0, 6)}...
                            </td>
                            <td className="py-2 px-2 text-stone-600">{order.customer}</td>
                            <td className="py-2 px-2 text-stone-700 font-medium">{order.product}</td>
                            <td className="py-2 px-2 text-right text-stone-600">{order.quantity}</td>
                            <td className="py-2 px-2 text-right text-stone-600">
                              ${order.unit_price.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-stone-800">
                              ${order.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}