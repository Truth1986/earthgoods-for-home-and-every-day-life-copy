import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, Search, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryLabels = {
  homesteading: "Homesteading",
  eco_living: "Eco Living",
  animal_care: "Animal Care",
  survival: "Survival",
  home_improvement: "Home Improvement",
  handmade: "Handmade",
  garden: "Garden",
  wellness: "Wellness",
  clothing: "Clothing"
};

export default function ProductsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('stock-low');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const filteredProducts = useMemo(() => {
    let results = products;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'stock-low':
        results.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case 'stock-high':
        results.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        break;
      case 'price-high':
        results.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-low':
        results.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      default:
        break;
    }

    return results;
  }, [products, searchQuery, sortBy]);

  const metrics = useMemo(() => {
    const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
    const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

    return {
      totalProducts: products.length,
      totalInventory: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      outOfStock,
      lowStock,
      totalValue
    };
  }, [products]);

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
          <h1 className="text-lg font-semibold text-stone-700">Products & Inventory</h1>
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="outline" className="rounded-full border-stone-200">Admin</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{metrics.totalProducts}</p>
              <p className="text-xs text-stone-500">Total Products</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-stone-800">{metrics.totalInventory}</p>
              <p className="text-xs text-stone-500">Total Units</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-700">{metrics.outOfStock}</p>
              <p className="text-xs text-red-600">Out of Stock</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-700">{metrics.lowStock}</p>
              <p className="text-xs text-yellow-600">Low Stock</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-emerald-700">${metrics.totalValue.toFixed(0)}</p>
              <p className="text-xs text-stone-500">Inventory Value</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-full h-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 h-10 rounded-full border border-stone-200 bg-white text-sm"
            >
              <option value="stock-low">Stock: Low to High</option>
              <option value="stock-high">Stock: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              All Products ({filteredProducts.length})
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
                      <th className="text-right py-3 px-4 font-semibold text-stone-700">Price</th>
                      <th className="text-right py-3 px-4 font-semibold text-stone-700">Stock</th>
                      <th className="text-center py-3 px-4 font-semibold text-stone-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-stone-700">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const value = (product.price || 0) * (product.stock || 0);
                      const status = product.stock === 0 ? 'out' : product.stock <= 10 ? 'low' : 'ok';

                      return (
                        <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-stone-800">{product.title}</p>
                              {product.brand && <p className="text-xs text-stone-500">{product.brand}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize text-xs">
                              {categoryLabels[product.category] || product.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-semibold text-stone-800">${product.price?.toFixed(2)}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-semibold text-stone-800">{product.stock || 0}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {status === 'out' ? (
                              <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Out
                              </Badge>
                            ) : status === 'low' ? (
                              <Badge className="bg-yellow-100 text-yellow-700 border-0 gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Low
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">OK</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-semibold text-stone-800">${value.toFixed(0)}</p>
                          </td>
                        </tr>
                      );
                    })}
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