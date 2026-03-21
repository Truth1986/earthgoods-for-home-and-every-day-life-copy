import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, ShoppingCart, ArrowLeft, Minus, Plus, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CartDrawer from "@/components/CartDrawer";
import ReviewSection from "@/components/product/ReviewSection";
import FrequentlyBoughtTogether from "@/components/product/FrequentlyBoughtTogether";
import SocialShareBar from "@/components/marketing/SocialShareBar";

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

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price;
  const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.name}` : product?.id;

  const addToCart = (productToAdd = null, quantityToAdd = null) => {
    const targetProduct = productToAdd || product;
    const targetQuantity = quantityToAdd || quantity;
    const targetPrice = productToAdd ? productToAdd.price : currentPrice;
    const targetId = productToAdd ? productToAdd.id : cartItemId;
    
    const cartItem = {
      ...targetProduct,
      id: targetId,
      productId: targetProduct.id,
      price: targetPrice,
      variantName: productToAdd ? null : (selectedVariant?.name || null),
      quantity: targetQuantity
    };

    setCart(prev => {
      const existing = prev.find(p => p.id === targetId);
      if (existing) {
        return prev.map(p => p.id === targetId ? { ...p, quantity: p.quantity + targetQuantity } : p);
      }
      return [...prev, cartItem];
    });
    
    if (!productToAdd) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">Product not found</h2>
          <Link to={createPageUrl('Shop')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Shop')} className="inline-flex items-center text-stone-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="aspect-square rounded-3xl bg-white shadow-lg overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100">
                <Leaf className="w-24 h-24 text-stone-300" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <Badge className="w-fit mb-4 bg-emerald-100 text-emerald-800 border-0">
              {categoryLabels[product.category] || product.category}
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <p className="text-4xl font-bold text-emerald-700">
                ${currentPrice?.toFixed(2)}
                {selectedVariant && <span className="text-lg text-stone-500 ml-2">({selectedVariant.name})</span>}
              </p>
              {product.stock <= 0 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
                  Out of Stock
                </span>
              ) : product.stock <= 3 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                  🔥 Only {product.stock} left!
                </span>
              ) : product.stock <= 10 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  ⚡ Limited Stock — only {product.stock} remaining
                </span>
              ) : null}
            </div>

            <p className="text-stone-600 leading-relaxed mb-8 flex-1">
              {product.description || "A quality product for sustainable, simple living."}
            </p>

            <div className="space-y-6">
              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-stone-600 font-medium">Size / Option:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedVariant(null)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        !selectedVariant 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="font-medium">Standard</span>
                      <span className="ml-2 text-sm">${product.price?.toFixed(2)}</span>
                    </button>
                    {product.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedVariant?.name === variant.name 
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="font-medium">{variant.name}</span>
                        <span className="ml-2 text-sm">${variant.price?.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-stone-600 font-medium">Quantity:</span>
                <div className="flex items-center gap-3 bg-white rounded-full border border-stone-200 p-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-lg">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button 
                onClick={addToCart}
                disabled={added}
                className={`w-full h-14 rounded-full text-lg font-semibold transition-all ${
                  added 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              {/* PayPal badge */}
              <a
                href="https://www.paypal.com/paypalme/tracieruth281"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#003087]"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825l-1.273 8.05h3.51l.922-5.832c.082-.518.526-.9 1.05-.9h.663c4.299 0 7.664-1.747 8.647-6.797.021-.106.04-.21.057-.316z"/></svg>
                <span className="text-blue-800 font-medium text-sm">Pay securely via PayPal at checkout</span>
              </a>

              {/* Low fee badge */}
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <p className="text-amber-800 text-sm">
                  <span className="font-semibold">Only 3% platform fee</span> — More money goes directly to supporting sustainable living
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Share */}
        <div className="mt-12">
          <SocialShareBar
            url={window.location.href}
            title={`${product.title} — EarthGoods`}
            description={product.description}
            imageUrl={product.image_url}
          />
        </div>

        {/* Frequently Bought Together */}
        <div className="mt-12">
          <FrequentlyBoughtTogether 
            currentProductId={product.id} 
            onAddToCart={(p) => addToCart(p, 1)}
          />
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <ReviewSection productId={product.id} />
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
    </div>
  );
}