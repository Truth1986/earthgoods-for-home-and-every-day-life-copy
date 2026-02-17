import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Leaf, Heart, Star } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryLabels = {
  homesteading: "Homesteading",
  eco_living: "Eco Living",
  animal_care: "Animal Care",
  survival: "Survival",
  home_improvement: "Home",
  handmade: "Handmade",
  garden: "Garden",
  wellness: "Wellness",
  clothing: "Clothing"
};

const categoryColors = {
  homesteading: "bg-amber-100 text-amber-800",
  eco_living: "bg-emerald-100 text-emerald-800",
  animal_care: "bg-rose-100 text-rose-800",
  survival: "bg-stone-200 text-stone-800",
  home_improvement: "bg-blue-100 text-blue-800",
  handmade: "bg-purple-100 text-purple-800",
  garden: "bg-lime-100 text-lime-800",
  wellness: "bg-teal-100 text-teal-800",
  clothing: "bg-indigo-100 text-indigo-800"
};

export default function ProductCard({ product, viewMode = 'grid' }) {
  const queryClient = useQueryClient();
  
  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => base44.entities.Wishlist.list(),
  });

  const isInWishlist = wishlistItems.some(item => item.product_id === product.id);
  const wishlistItem = wishlistItems.find(item => item.product_id === product.id);

  const addToWishlist = useMutation({
    mutationFn: () => base44.entities.Wishlist.create({
      product_id: product.id,
      product_title: product.title,
      product_image_url: product.image_url,
      product_price: product.price
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const removeFromWishlist = useMutation({
    mutationFn: () => base44.entities.Wishlist.delete(wishlistItem.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist) {
      removeFromWishlist.mutate();
    } else {
      addToWishlist.mutate();
    }
  };

  // Render rating stars
  const renderRating = () => {
    if (!product.rating) return null;
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              className={`w-3 h-3 ${star <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
            />
          ))}
        </div>
        {product.review_count > 0 && (
          <span className="text-xs text-stone-400">({product.review_count})</span>
        )}
      </div>
    );
  };

  // List view layout
  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <div className="flex">
          <div className="relative w-40 h-40 flex-shrink-0 bg-stone-100">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-10 h-10 text-stone-300" />
              </div>
            )}
            {product.featured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-amber-500 text-white border-0 text-xs">Featured</Badge>
              </div>
            )}
          </div>
          <CardContent className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={`${categoryColors[product.category] || 'bg-stone-100'} text-xs`}>
                    {categoryLabels[product.category] || product.category}
                  </Badge>
                  {product.brand && (
                    <span className="text-xs text-stone-400">{product.brand}</span>
                  )}
                </div>
                <button
                  onClick={toggleWishlist}
                  className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                    isInWishlist 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-stone-100 text-stone-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
              <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
                <h3 className="font-semibold text-stone-800 mb-1 hover:text-emerald-700 transition-colors line-clamp-1">
                  {product.title}
                </h3>
              </Link>
              <p className="text-stone-500 text-sm line-clamp-2 mb-2">{product.description}</p>
              {renderRating()}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {product.variants?.length > 0 ? (
                  <span className="text-lg font-bold text-emerald-700">
                    From ${Math.min(product.price, ...product.variants.map(v => v.price)).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-emerald-700">${product.price?.toFixed(2)}</span>
                )}
                {product.stock <= 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">Out of stock</Badge>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">Only {product.stock} left</Badge>
                )}
              </div>
              <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid view layout (default)
  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
      <div className="relative overflow-hidden aspect-square bg-stone-100">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-16 h-16 text-stone-300" />
          </div>
        )}
        {product.featured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-amber-500 text-white border-0">Featured</Badge>
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-red-500 text-white border-0">Out of Stock</Badge>
          </div>
        )}
        <button
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            isInWishlist 
              ? 'bg-rose-500 text-white' 
              : 'bg-white/90 text-stone-400 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className={`${categoryColors[product.category] || 'bg-stone-100'}`}>
            {categoryLabels[product.category] || product.category}
          </Badge>
          {product.brand && (
            <span className="text-xs text-stone-400 truncate max-w-20">{product.brand}</span>
          )}
        </div>
        <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
          <h3 className="font-semibold text-lg text-stone-800 mb-1 hover:text-emerald-700 transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        {renderRating()}
        <p className="text-stone-500 text-sm mb-4 line-clamp-2 mt-2">{product.description}</p>
        <div className="flex items-center justify-between">
          {product.variants?.length > 0 ? (
            <span className="text-lg font-bold text-emerald-700">
              From ${Math.min(product.price, ...product.variants.map(v => v.price)).toFixed(2)}
            </span>
          ) : (
            <span className="text-2xl font-bold text-emerald-700">${product.price?.toFixed(2)}</span>
          )}
          <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4"
              size="sm"
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.variants?.length > 0 ? 'View' : 'Add'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}