import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Package, Truck, CheckCircle, AlertCircle, Plus, Trash2, ExternalLink, Mail, Edit2, X, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from 'moment';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
};

export default function DropshippingDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('fulfillment');
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', website: '', notes: '' });
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [forwardedItems, setForwardedItems] = useState(() => {
    const saved = localStorage.getItem('forwarded_items');
    return saved ? JSON.parse(saved) : {};
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const createSupplier = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setNewSupplier({ name: '', email: '', website: '', notes: '' });
      setShowAddSupplier(false);
      toast.success('Supplier added!');
    },
  });

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditingSupplier(null);
      toast.success('Supplier updated!');
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier removed!');
    },
  });

  const productMap = useMemo(() => {
    return products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
  }, [products]);

  const supplierMap = useMemo(() => {
    return suppliers.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  }, [suppliers]);

  // Group unfulfilled orders by supplier
  const fulfillmentGroups = useMemo(() => {
    const groups = {};
    const unfulfilledOrders = orders.filter(o => o.status === 'paid' || o.status === 'pending');

    unfulfilledOrders.forEach(order => {
      order.items?.forEach(item => {
        const product = productMap[item.product_id];
        if (!product?.supplier_id) return;
        const supplierId = product.supplier_id;
        if (!groups[supplierId]) groups[supplierId] = { supplier: supplierMap[supplierId], items: [] };
        groups[supplierId].items.push({ ...item, order, product });
      });
    });

    return Object.values(groups);
  }, [orders, productMap, supplierMap]);

  const toggleForwarded = (key) => {
    const updated = { ...forwardedItems, [key]: !forwardedItems[key] };
    setForwardedItems(updated);
    localStorage.setItem('forwarded_items', JSON.stringify(updated));
  };

  const totalNeedingFulfillment = fulfillmentGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
          <h1 className="text-lg font-semibold text-stone-700">Dropshipping Dashboard</h1>
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="outline" className="rounded-full border-stone-200">Admin</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{totalNeedingFulfillment}</p>
              <p className="text-sm text-stone-500">Items Needing Fulfillment</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{suppliers.length}</p>
              <p className="text-sm text-stone-500">Active Suppliers</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{orders.filter(o => o.status === 'shipped').length}</p>
              <p className="text-sm text-stone-500">Orders Shipped</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{products.filter(p => p.supplier_id).length}</p>
              <p className="text-sm text-stone-500">Dropship Products</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['fulfillment', 'suppliers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
              }`}
            >
              {tab === 'fulfillment' ? `Needs Fulfillment (${totalNeedingFulfillment})` : 'Manage Suppliers'}
            </button>
          ))}
        </div>

        {/* Fulfillment Tab */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            {fulfillmentGroups.length === 0 ? (
              <div className="text-center py-20 bg-white/60 rounded-3xl">
                <CheckCircle className="w-16 h-16 mx-auto text-emerald-300 mb-4" />
                <h3 className="text-xl font-semibold text-stone-700 mb-2">All caught up!</h3>
                <p className="text-stone-500">No orders waiting for supplier fulfillment.</p>
              </div>
            ) : (
              fulfillmentGroups.map((group, gi) => (
                <Card key={gi} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.supplier?.name || 'Unknown Supplier'}</CardTitle>
                        {group.supplier?.email && (
                          <p className="text-sm text-stone-500 mt-1 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {group.supplier.email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {group.supplier?.website && (
                          <a href={group.supplier.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="rounded-full">
                              <ExternalLink className="w-4 h-4 mr-1" /> Visit Supplier
                            </Button>
                          </a>
                        )}
                        <Badge className="bg-amber-100 text-amber-700 border-0">{group.items.length} items</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.items.map((item, i) => {
                        const key = `${item.order.id}-${item.product_id}`;
                        const forwarded = forwardedItems[key];
                        return (
                          <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${forwarded ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-100'}`}>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-800 text-sm">{item.title}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-stone-400">Order: <span className="font-mono">{item.order.id.slice(0, 8)}...</span></span>
                                <span className="text-xs text-stone-400">Customer: {item.order.customer_name}</span>
                                <span className="text-xs text-stone-400">Qty: {item.quantity}</span>
                                {item.product?.supplier_sku && <span className="text-xs text-stone-400">SKU: {item.product.supplier_sku}</span>}
                                <Badge className={`${statusColors[item.order.status]} border-0 text-xs`}>{item.order.status}</Badge>
                              </div>
                              <p className="text-xs text-stone-400 mt-1">Ship to: {item.order.customer_address}</p>
                            </div>
                            <button
                              onClick={() => toggleForwarded(key)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                forwarded
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-stone-600 border-stone-300 hover:border-emerald-400'
                              }`}
                            >
                              {forwarded ? <><CheckCircle className="w-3 h-3" /> Forwarded</> : <><Truck className="w-3 h-3" /> Mark Forwarded</>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddSupplier(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            </div>

            {showAddSupplier && (
              <Card className="border-2 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-base">New Supplier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name *</Label>
                      <Input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Supplier name" className="mt-1" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="contact@supplier.com" className="mt-1" />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input value={newSupplier.website} onChange={e => setNewSupplier({...newSupplier, website: e.target.value})} placeholder="https://..." className="mt-1" />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input value={newSupplier.notes} onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})} placeholder="Internal notes..." className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddSupplier(false)} className="rounded-full"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                    <Button onClick={() => createSupplier.mutate(newSupplier)} disabled={!newSupplier.name} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {suppliers.length === 0 && !showAddSupplier ? (
              <div className="text-center py-16 bg-white/60 rounded-3xl">
                <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-semibold text-stone-700 mb-2">No suppliers yet</h3>
                <p className="text-stone-500 mb-4">Add your first dropshipping supplier to get started.</p>
              </div>
            ) : (
              suppliers.map(supplier => (
                <Card key={supplier.id} className="border-0 shadow-sm">
                  <CardContent className="pt-4">
                    {editingSupplier?.id === supplier.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Name</Label>
                            <Input value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} className="mt-1" />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input value={editingSupplier.email || ''} onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})} className="mt-1" />
                          </div>
                          <div>
                            <Label>Website</Label>
                            <Input value={editingSupplier.website || ''} onChange={e => setEditingSupplier({...editingSupplier, website: e.target.value})} className="mt-1" />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Input value={editingSupplier.notes || ''} onChange={e => setEditingSupplier({...editingSupplier, notes: e.target.value})} className="mt-1" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setEditingSupplier(null)} className="rounded-full"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                          <Button onClick={() => updateSupplier.mutate({ id: supplier.id, data: editingSupplier })} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                            <Save className="w-4 h-4 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-stone-800">{supplier.name}</p>
                          {supplier.email && <p className="text-sm text-stone-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{supplier.email}</p>}
                          {supplier.website && (
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 flex items-center gap-1 mt-1 hover:underline">
                              <ExternalLink className="w-3 h-3" />{supplier.website}
                            </a>
                          )}
                          {supplier.notes && <p className="text-sm text-stone-400 mt-2 italic">{supplier.notes}</p>}
                          <p className="text-xs text-stone-400 mt-2">
                            {products.filter(p => p.supplier_id === supplier.id).length} products linked
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingSupplier({...supplier})}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSupplier.mutate(supplier.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <footer className="bg-stone-800 text-stone-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">EarthGoods Dropshipping Dashboard</p>
        </div>
      </footer>
    </div>
  );
}