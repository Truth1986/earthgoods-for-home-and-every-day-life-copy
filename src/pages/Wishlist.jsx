import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Leaf, Heart, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CartDrawer from "@/components/CartDrawer";

export default function Wishlist() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => base44.entities.Wishlist.list('-created_date'),
  });

  const removeFromWishlist = useMutation({
    mutationFn: (id) => base44.entities.Wishlist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.product_id);
      if (existing) {
        return prev.map(p => p.id === item.product_id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { 
        id: item.product_id, 
        title: item.product_title, 
        price: item.product_price,
        image_url: item.product_image_url,
        quantity: 1 
      }];
    });
    setCartOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
          <nav className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium">
              Shop All
            </Link>
            <Link to={createPageUrl('Wishlist')} className="text-emerald-700 font-medium flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Wishlist
            </Link>
            <Link to={createPageUrl('About')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium">
              Our Mission
            </Link>
          </nav>
          <Button 
            variant="outline" 
            className="relative rounded-full border-stone-200"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-rose-500" />
          <h1 className="text-3xl font-bold text-stone-800">My Wishlist</h1>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
                <div className="relative h-48 bg-stone-100">
                  {item.product_image_url ? (
                    <img 
                      src={item.product_image_url} 
                      alt={item.product_title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-stone-300" />
                    </div>
                  )}
                  <button
                    onClick={() => removeFromWishlist.mutate(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <Link to={createPageUrl('ProductDetail') + `?id=${item.product_id}`}>
                    <h3 className="font-semibold text-stone-800 hover:text-emerald-700 transition-colors mb-2">
                      {item.product_title}
                    </h3>
                  </Link>
                  {item.product_price && (
                    <p className="text-emerald-700 font-bold mb-3">${item.product_price.toFixed(2)}</p>
                  )}
                  <Button 
                    onClick={() => addToCart(item)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-3xl">
            <Heart className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">Your wishlist is empty</h3>
            <p className="text-stone-500 mb-6">Save items you love to your wishlist</p>
            <Link to={createPageUrl('Shop')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
                Browse Products
              </Button>
            </Link>
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
    </div>
  );
}