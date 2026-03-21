import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, AlertTriangle, Package, TrendingDown, Edit2, Save, X, Loader2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from 'sonner';

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryDashboard() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [filterLowOnly, setFilterLowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, stock }) => base44.entities.Product.update(id, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setEditingId(null);
      setEditValues({});
      toast.success('Stock updated');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (updates) => Promise.all(
      updates.map(({ id, stock }) => base44.entities.Product.update(id, { stock }))
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setEditValues({});
      toast.success('Bulk stock update completed');
    },
  });

  // Calculate inventory metrics
  const metrics = useMemo(() => {
    const lowStock = products.filter(p => (p.stock || 0) <= LOW_STOCK_THRESHOLD);
    const outOfStock = products.filter(p => (p.stock || 0) === 0);
    const totalItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    return {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalItems,
      lowStockProducts: lowStock,
    };
  }, [products]);

  // Filter and search
  const filteredProducts = useMemo(() => {
    let results = products;

    if (filterLowOnly) {
      results = results.filter(p => (p.stock || 0) <= LOW_STOCK_THRESHOLD);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    return results.sort((a, b) => (a.stock || 0) - (b.stock || 0));
  }, [products, filterLowOnly, searchQuery]);

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditValues({ ...editValues, [product.id]: product.stock || 0 });
  };

  const handleSave = (productId) => {
    const newStock = parseInt(editValues[productId], 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }
    updateProduct.mutate({ id: productId, stock: newStock });
  };

  const handleBulkUpdate = async (adjustment) => {
    const updates = filteredProducts.map(p => ({
      id: p.id,
      stock: Math.max(0, (p.stock || 0) + adjustment),
    }));
    bulkUpdateMutation.mutate(updates);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
          <h1 className="text-lg font-semibold text-stone-700">Inventory Dashboard</h1>
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="outline" className="rounded-full border-stone-200">Admin</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{metrics.totalProducts}</p>
              <p className="text-sm text-stone-500">Total Products</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{metrics.totalItems}</p>
              <p className="text-sm text-stone-500">Total Items in Stock</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-700 flex items-center gap-1">
                {metrics.lowStockCount}
                <AlertTriangle className="w-5 h-5" />
              </p>
              <p className="text-sm text-yellow-600">Low Stock Items</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-700">{metrics.outOfStockCount}</p>
              <p className="text-sm text-red-600">Out of Stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {metrics.lowStockProducts.length > 0 && (
          <Card className="border-0 shadow-sm border-l-4 border-yellow-500 mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-600 mb-3">
                {metrics.lowStockProducts.length} product(s) below {LOW_STOCK_THRESHOLD} units:
              </p>
              <div className="flex flex-wrap gap-2">
                {metrics.lowStockProducts.slice(0, 5).map(p => (
                  <Badge key={p.id} className="bg-yellow-100 text-yellow-800 border-0">
                    {p.title} ({p.stock || 0})
                  </Badge>
                ))}
                {metrics.lowStockProducts.length > 5 && (
                  <Badge className="bg-stone-200 text-stone-800 border-0">
                    +{metrics.lowStockProducts.length - 5} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <Input
              placeholder="Search by product name, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-full h-10"
            />
            <div className="flex gap-2">
              <Button
                variant={filterLowOnly ? "default" : "outline"}
                onClick={() => setFilterLowOnly(!filterLowOnly)}
                className={`rounded-full ${filterLowOnly ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Low Stock Only
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {filteredProducts.length > 0 && (
            <div className="flex gap-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-sm font-medium text-emerald-900">Bulk adjust selected:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate(-1)}
                disabled={bulkUpdateMutation.isPending}
                className="rounded-full h-8"
              >
                <Minus className="w-3 h-3 mr-1" />
                -1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate(1)}
                disabled={bulkUpdateMutation.isPending}
                className="rounded-full h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                +1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate(5)}
                disabled={bulkUpdateMutation.isPending}
                className="rounded-full h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                +5
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate(10)}
                disabled={bulkUpdateMutation.isPending}
                className="rounded-full h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                +10
              </Button>
            </div>
          )}
        </div>

        {/* Inventory Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Inventory ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <Package className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-4 font-semibold text-stone-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-stone-700">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-stone-700">Stock Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-stone-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-stone-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-stone-800">{product.title}</p>
                            {product.brand && <p className="text-xs text-stone-500">{product.brand}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize text-xs">
                            {product.category?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {editingId === product.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={editValues[product.id] || 0}
                              onChange={(e) => setEditValues({ ...editValues, [product.id]: e.target.value })}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            <p className="text-right font-semibold text-stone-800">{product.stock || 0}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(product.stock || 0) === 0 ? (
                            <Badge className="bg-red-100 text-red-700 border-0">Out</Badge>
                          ) : (product.stock || 0) <= LOW_STOCK_THRESHOLD ? (
                            <Badge className="bg-yellow-100 text-yellow-700 border-0">Low</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0">OK</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {editingId === product.id ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSave(product.id)}
                                disabled={updateProduct.isPending}
                                className="h-7 w-7 p-0 rounded-full"
                              >
                                {updateProduct.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingId(null); setEditValues({}); }}
                                className="h-7 w-7 p-0 rounded-full"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(product)}
                              className="h-7 w-7 p-0 rounded-full"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}