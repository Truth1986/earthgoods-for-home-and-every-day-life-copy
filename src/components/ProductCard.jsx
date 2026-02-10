import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Leaf } from "lucide-react";
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
  wellness: "Wellness"
};

const categoryColors = {
  homesteading: "bg-amber-100 text-amber-800",
  eco_living: "bg-emerald-100 text-emerald-800",
  animal_care: "bg-rose-100 text-rose-800",
  survival: "bg-stone-200 text-stone-800",
  home_improvement: "bg-blue-100 text-blue-800",
  handmade: "bg-purple-100 text-purple-800",
  garden: "bg-lime-100 text-lime-800",
  wellness: "bg-teal-100 text-teal-800"
};

export default function ProductCard({ product, onAddToCart }) {
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
      </div>
      <CardContent className="p-5">
        <Badge variant="secondary" className={`mb-3 ${categoryColors[product.category] || 'bg-stone-100'}`}>
          {categoryLabels[product.category] || product.category}
        </Badge>
        <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
          <h3 className="font-semibold text-lg text-stone-800 mb-2 hover:text-emerald-700 transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        <p className="text-stone-500 text-sm mb-4 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-emerald-700">${product.price?.toFixed(2)}</span>
          <Button 
            onClick={() => onAddToCart(product)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}