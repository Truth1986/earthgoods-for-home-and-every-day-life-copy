import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Heart, Home as HomeIcon, Sprout, ShoppingCart, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import OrderChatWidget from "@/components/chat/OrderChatWidget";
import EmailCapturePopup from "@/components/marketing/EmailCapturePopup";
import FooterEmailCapture from "@/components/marketing/FooterEmailCapture";

export default function Home() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => base44.entities.Product.filter({ featured: true }, '-created_date', 6),
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium">
              Shop All
            </Link>
            <Link to={createPageUrl('Wishlist')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Wishlist
            </Link>
            <Link to={createPageUrl('Blog')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium">
              Blog
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Only 3% Platform Fee
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-6 leading-tight">
              Simple Living,
              <span className="text-emerald-600"> Sustainable Goods</span>
            </h1>
            <p className="text-xl text-stone-600 mb-8 leading-relaxed">
              Affordable essentials for homesteaders, nature lovers, and free spirits. 
              Quality goods that help you live simply and sustainably.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('Shop')}>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-14 text-lg">
                  Browse Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Heart, title: "Community First", desc: "Supporting fellow earth dwellers" },
              { icon: Leaf, title: "Eco-Friendly", desc: "Sustainable & natural products" },
              { icon: HomeIcon, title: "Self-Sufficient", desc: "Tools for independent living" },
              { icon: Sprout, title: "Low Fees", desc: "Just 3% - more goes to you" },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-stone-800 mb-2">{item.title}</h3>
                <p className="text-stone-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-stone-800 mb-2">Featured Finds</h2>
              <p className="text-stone-500">Hand-picked essentials for simple living</p>
            </div>
            <Link to={createPageUrl('Shop')}>
              <Button variant="outline" className="rounded-full border-stone-300">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/50 rounded-3xl">
              <Leaf className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">No featured products yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Living Simply, Together
          </h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
            Join our community of folks who believe in affordable, sustainable living. 
            Every purchase supports independent sellers and a simpler way of life.
          </p>
          <Link to={createPageUrl('Shop')}>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-stone-100 rounded-full px-8 h-14 text-lg">
              Start Shopping
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-800 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-stone-700">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">EarthGoods</span>
              </div>
              <p className="text-sm">Made with love for simple living folks everywhere.</p>
            </div>
            <div>
              <FooterEmailCapture source="footer" />
            </div>
          </div>
          <p className="text-sm text-center">© 2026 EarthGoods. All rights reserved.</p>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
      <OrderChatWidget />
      <EmailCapturePopup />
    </div>
  );
}