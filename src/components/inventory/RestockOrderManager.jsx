import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Download, CheckCircle, Clock, Package, Loader2 } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RestockOrderManager() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notes, setNotes] = useState('');

  const { data: restockOrders = [] } = useQuery({
    queryKey: ['restock-orders'],
    queryFn: () => base44.entities.RestockOrder.list('-created_date'),
  });

  const sendOrderMutation = useMutation({
    mutationFn: ({ orderId, notes: orderNotes }) =>
      base44.functions.invoke('sendRestockOrderToSupplier', {
        restock_order_id: orderId,
        notes: orderNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restock-orders'] });
      setSelectedOrder(null);
      setNotes('');
      toast.success('Restock order sent to supplier');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send order');
    },
  });

  const downloadCSV = (order) => {
    const headers = ['Product', 'SKU', 'Current Stock', 'Suggested Quantity'];
    const rows = order.products.map((p) => [
      p.product_title,
      p.supplier_sku || 'N/A',
      p.current_stock,
      p.suggested_quantity,
    ]);

    const csvContent = [
      `Restock Order for ${order.supplier_name}`,
      `Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
      '',
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-${order.supplier_id}-${moment().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('CSV downloaded');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700 border-0">Draft</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700 border-0">Sent</Badge>;
      case 'acknowledged':
        return <Badge className="bg-amber-100 text-amber-700 border-0">Acknowledged</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Completed</Badge>;
      default:
        return null;
    }
  };

  const draftOrders = restockOrders.filter((o) => o.status === 'draft');
  const sentOrders = restockOrders.filter((o) => o.status !== 'draft');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          Restock Orders
        </h2>
      </div>

      {/* Draft Orders Section */}
      {draftOrders.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-amber-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <Clock className="w-5 h-5" />
              Pending Restock Orders ({draftOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {draftOrders.map((order) => (
              <div key={order.id} className="border border-stone-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-stone-800">{order.supplier_name}</h3>
                    <p className="text-sm text-stone-500">{order.supplier_email}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="bg-stone-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-stone-600 mb-2">Products to Restock:</p>
                  <div className="space-y-1">
                    {order.products.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-stone-700">{p.product_title}</span>
                        <span className="text-stone-600">
                          {p.current_stock} → {p.suggested_quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-2 flex-1 sm:flex-none"
                      >
                        <Send className="w-4 h-4" />
                        Send to Supplier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send Restock Order</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">To: {selectedOrder?.supplier_email}</p>
                          <div className="bg-stone-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                            {selectedOrder?.products.map((p, idx) => (
                              <div key={idx} className="text-sm text-stone-700 py-1">
                                {p.product_title} ({p.suggested_quantity} units)
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Additional Notes (optional)</label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any special instructions or notes..."
                            className="mt-1 min-h-24"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" className="rounded-lg">
                            Cancel
                          </Button>
                          <Button
                            onClick={() =>
                              sendOrderMutation.mutate({
                                orderId: selectedOrder?.id,
                                notes,
                              })
                            }
                            disabled={sendOrderMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-2"
                          >
                            {sendOrderMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Send Order
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={() => downloadCSV(order)}
                    className="rounded-lg gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sent Orders Section */}
      {sentOrders.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Sent Orders ({sentOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-stone-800">{order.supplier_name}</p>
                    <p className="text-xs text-stone-500">
                      Sent: {moment(order.sent_date).format('MMM DD, YYYY')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {restockOrders.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 text-center text-stone-500">
            <Package className="w-12 h-12 mx-auto text-stone-300 mb-4" />
            <p>No restock orders. All products are well-stocked.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}