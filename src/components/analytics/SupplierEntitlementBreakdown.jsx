import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, User } from 'lucide-react';
import moment from 'moment';

export default function SupplierEntitlementBreakdown() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-entitlement'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-entitlement'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-entitlement'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const entitlements = useMemo(() => {
    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const supplierMap = suppliers.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});

    const orderBreakdown = [];

    orders.forEach((order) => {
      if (!order.items?.length) return;

      const supplierCuts = {};

      order.items.forEach((item) => {
        const product = productMap[item.product_id];
        if (!product?.supplier_id) return;

        const supplierId = product.supplier_id;
        const itemTotal = item.price * item.quantity;

        if (!supplierCuts[supplierId]) {
          supplierCuts[supplierId] = {
            supplier_id: supplierId,
            supplier_name: supplierMap[supplierId]?.name || 'Unknown',
            items: [],
            subtotal: 0,
          };
        }

        supplierCuts[supplierId].items.push({
          product_title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          total: itemTotal,
        });

        supplierCuts[supplierId].subtotal += itemTotal;
      });

      if (Object.keys(supplierCuts).length > 0) {
        orderBreakdown.push({
          order_id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          order_total: order.total,
          order_date: order.created_date,
          status: order.status,
          supplier_cuts: Object.values(supplierCuts),
        });
      }
    });

    return orderBreakdown;
  }, [orders, products, suppliers]);

  // Summary stats
  const stats = useMemo(() => {
    const totalSupplierEntitlements = {};

    entitlements.forEach((order) => {
      order.supplier_cuts.forEach((cut) => {
        if (!totalSupplierEntitlements[cut.supplier_id]) {
          totalSupplierEntitlements[cut.supplier_id] = {
            name: cut.supplier_name,
            total: 0,
            orders: 0,
          };
        }
        totalSupplierEntitlements[cut.supplier_id].total += cut.subtotal;
        totalSupplierEntitlements[cut.supplier_id].orders += 1;
      });
    });

    return Object.values(totalSupplierEntitlements).sort((a, b) => b.total - a.total);
  }, [entitlements]);

  return (
    <div className="space-y-6">
      {/* Supplier Summary */}
      {stats.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Supplier Entitlements Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.map((supplier) => (
                <div key={supplier.name} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div>
                    <p className="font-medium text-stone-800">{supplier.name}</p>
                    <p className="text-xs text-stone-500">{supplier.orders} order(s)</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">
                    ${supplier.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order-by-Order Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Supplier Entitlements by Order
        </h3>

        {entitlements.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 text-center text-stone-500">
              No dropship orders yet
            </CardContent>
          </Card>
        ) : (
          entitlements.map((order) => (
            <Card key={order.order_id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Order {order.order_id.slice(0, 8)}...
                    </CardTitle>
                    <p className="text-sm text-stone-500 mt-1">
                      {order.customer_name} • {moment(order.order_date).format('MMM D, YYYY')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 text-xs capitalize ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'paid' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {order.supplier_cuts.map((cut, idx) => (
                  <div key={idx} className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-stone-800">{cut.supplier_name}</p>
                      <p className="text-lg font-bold text-emerald-700">
                        ${cut.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-2 bg-stone-50 rounded-lg p-3">
                      {cut.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex-1">
                            <p className="text-stone-700">{item.product_title}</p>
                            <p className="text-xs text-stone-500">
                              {item.quantity} × ${item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium text-stone-800 ml-2">
                            ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}