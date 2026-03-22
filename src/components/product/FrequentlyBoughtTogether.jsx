import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart, Leaf, Star, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function ProductRow({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
      <div className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-8 h-8 text-stone-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          to={`${createPageUrl('ProductDetail')}?id=${product.id}`}
          className="font-semibold text-stone-800 hover:text-emerald-700 transition-colors line-clamp-1 block"
        >
          {product.title}
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-emerald-700 font-bold">${product.price?.toFixed(2)}</span>
          {product.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)}
            </span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <Badge className="bg-red-100 text-red-700 border-0 text-xs px-1.5 py-0">Only {product.stock} left</Badge>
          )}
          {product.stock <= 0 && (
            <Badge className="bg-stone-100 text-stone-500 border-0 text-xs px-1.5 py-0">Out of stock</Badge>
          )}
        </div>
      </div>
      <Button
        onClick={() => onAddToCart(product)}
        disabled={product.stock <= 0}
        size="icon"
        className="bg-emerald-600 hover:bg-emerald-700 rounded-full flex-shrink-0 disabled:opacity-50"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  );
}

export default function FrequentlyBoughtTogether({ currentProductId, onAddToCart }) {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-analysis'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { suggestedProducts, mode } = useMemo(() => {
    const currentProduct = allProducts.find(p => p.id === currentProductId);

    // --- Strategy 1: Co-purchase data from order history ---
    const ordersWithProduct = orders.filter(order =>
      order.items?.some(item => item.product_id === currentProductId)
    );

    if (ordersWithProduct.length > 0) {
      const productCounts = {};
      ordersWithProduct.forEach(order => {
        order.items?.forEach(item => {
          if (item.product_id !== currentProductId) {
            productCounts[item.product_id] = (productCounts[item.product_id] || 0) + 1;
          }
        });
      });

      const topProductIds = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      const products = topProductIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean);

      if (products.length > 0) return { suggestedProducts: products, mode: 'purchased_together' };
    }

    // --- Strategy 2: Same category fallback, sorted by rating ---
    if (currentProduct) {
      const similar = allProducts
        .filter(p => p.id !== currentProductId && p.category === currentProduct.category)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);

      if (similar.length > 0) return { suggestedProducts: similar, mode: 'similar' };
    }

    // --- Strategy 3: Top-rated products across the store ---
    const topRated = allProducts
      .filter(p => p.id !== currentProductId)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);

    return { suggestedProducts: topRated, mode: 'top_rated' };
  }, [orders, allProducts, currentProductId]);

  if (suggestedProducts.length === 0) return null;

  const availableProducts = suggestedProducts.filter(p => p.stock > 0);
  const bundleTotal = suggestedProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  const headingConfig = {
    purchased_together: { icon: TrendingUp, label: 'Frequently Bought Together', sub: 'Customers who bought this also purchased:' },
    similar: { icon: Sparkles, label: 'Similar Products', sub: 'Other popular items in this category:' },
    top_rated: { icon: Star, label: 'You Might Also Like', sub: 'Top-rated picks from our store:' },
  };
  const { icon: HeadingIcon, label, sub } = headingConfig[mode];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-3xl p-8 border border-stone-200">
      <div className="flex items-center gap-2 mb-1">
        <HeadingIcon className="w-5 h-5 text-emerald-700" />
        <h2 className="text-2xl font-bold text-stone-800">{label}</h2>
      </div>
      <p className="text-stone-600 mb-6">{sub}</p>

      <div className="space-y-4 mb-6">
        {suggestedProducts.map(product => (
          <ProductRow key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>

      {availableProducts.length > 1 && (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm text-stone-600">Bundle Total</div>
            <div className="text-2xl font-bold text-emerald-700">${bundleTotal.toFixed(2)}</div>
          </div>
          <Button
            onClick={() => availableProducts.forEach(p => onAddToCart(p))}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-full"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add All to Cart
          </Button>
        </div>
      )}
    </div>
  );
}