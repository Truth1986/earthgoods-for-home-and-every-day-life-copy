import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FrequentlyBoughtTogether({ currentProductId, onAddToCart }) {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-analysis'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const relatedProducts = useMemo(() => {
    // Find orders containing current product
    const ordersWithProduct = orders.filter(order => 
      order.items?.some(item => item.product_id === currentProductId)
    );

    if (ordersWithProduct.length === 0) return [];

    // Count co-occurrences of other products
    const productCounts = {};
    ordersWithProduct.forEach(order => {
      order.items?.forEach(item => {
        if (item.product_id !== currentProductId) {
          productCounts[item.product_id] = (productCounts[item.product_id] || 0) + 1;
        }
      });
    });

    // Sort by frequency and get top 3
    const topProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    // Map to actual product data
    return topProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter(Boolean);
  }, [orders, allProducts, currentProductId]);

  if (relatedProducts.length === 0) return null;

  const totalPrice = relatedProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-3xl p-8 border border-stone-200">
      <h2 className="text-2xl font-bold text-stone-800 mb-2">Frequently Bought Together</h2>
      <p className="text-stone-600 mb-6">Customers who bought this also purchased:</p>
      
      <div className="space-y-4 mb-6">
        {relatedProducts.map((product, idx) => (
          <div key={product.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-stone-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link 
                to={`${createPageUrl('ProductDetail')}?id=${product.id}`}
                className="font-semibold text-stone-800 hover:text-emerald-700 transition-colors line-clamp-1"
              >
                {product.title}
              </Link>
              <div className="text-emerald-700 font-bold mt-1">${product.price?.toFixed(2)}</div>
            </div>
            <Button
              onClick={() => onAddToCart(product)}
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 rounded-full flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-stone-600">Bundle Total</div>
          <div className="text-2xl font-bold text-emerald-700">${totalPrice.toFixed(2)}</div>
        </div>
        <Button 
          onClick={() => relatedProducts.forEach(p => onAddToCart(p))}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-full"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add All to Cart
        </Button>
      </div>
    </div>
  );
}