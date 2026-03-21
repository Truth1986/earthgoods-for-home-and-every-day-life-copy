import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Star, X, SlidersHorizontal } from "lucide-react";

const categories = [
  { value: "homesteading", label: "Homesteading" },
  { value: "eco_living", label: "Eco Living" },
  { value: "animal_care", label: "Animal Care" },
  { value: "survival", label: "Survival" },
  { value: "home_improvement", label: "Home Improvement" },
  { value: "handmade", label: "Handmade" },
  { value: "garden", label: "Garden" },
  { value: "wellness", label: "Wellness" },
  { value: "clothing", label: "Clothing" },
];

const rooms = [
  { value: "kitchen", label: "🍳 Kitchen", icon: "🍳" },
  { value: "bedroom", label: "🛏️ Bedroom", icon: "🛏️" },
  { value: "bathroom", label: "🚿 Bathroom", icon: "🚿" },
  { value: "living_room", label: "🛋️ Living Room", icon: "🛋️" },
  { value: "dining_room", label: "🍽️ Dining Room", icon: "🍽️" },
  { value: "outdoor", label: "🌿 Outdoor", icon: "🌿" },
  { value: "garage", label: "🔧 Garage", icon: "🔧" },
  { value: "office", label: "💼 Office", icon: "💼" },
  { value: "laundry", label: "👕 Laundry", icon: "👕" },
  { value: "entryway", label: "🚪 Entryway", icon: "🚪" },
];

const productTypes = [
  { value: "cleaning", label: "Cleaning" },
  { value: "storage", label: "Storage" },
  { value: "decor", label: "Decor" },
  { value: "bedding", label: "Bedding" },
  { value: "cookware", label: "Cookware" },
  { value: "tools", label: "Tools" },
  { value: "lighting", label: "Lighting" },
  { value: "furniture", label: "Furniture" },
  { value: "personal_care", label: "Personal Care" },
  { value: "appliances", label: "Appliances" },
  { value: "textiles", label: "Textiles" },
  { value: "organizers", label: "Organizers" },
];

const sortOptions = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

export default function AdvancedFilters({ 
  filters, 
  setFilters, 
  brands = [],
  maxPrice = 500,
  resultCount = 0 
}) {
  const activeFilterCount = [
    filters.category !== 'all',
    filters.room !== 'all',
    filters.product_type !== 'all',
    filters.brand !== 'all',
    filters.minRating > 0,
    filters.inStockOnly,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilters({
      ...filters,
      category: 'all',
      room: 'all',
      product_type: 'all',
      brand: 'all',
      minRating: 0,
      inStockOnly: false,
      priceRange: [0, maxPrice],
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-stone-600" />
          <span className="font-semibold text-stone-800">Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-stone-500 hover:text-stone-700 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-xs text-stone-500 uppercase tracking-wide">Sort By</Label>
        <Select value={filters.sortBy} onValueChange={(v) => setFilters({...filters, sortBy: v})}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" defaultValue={["room", "product_type", "category", "price"]} className="space-y-2">
        {/* Category */}
        <AccordionItem value="category" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Category
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div 
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  filters.category === 'all' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50'
                }`}
                onClick={() => setFilters({...filters, category: 'all'})}
              >
                <span className="text-sm">All Categories</span>
              </div>
              {categories.map(cat => (
                <div 
                  key={cat.value}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filters.category === cat.value ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50'
                  }`}
                  onClick={() => setFilters({...filters, category: cat.value})}
                >
                  <span className="text-sm">{cat.label}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Price Range
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={(v) => setFilters({...filters, priceRange: v})}
              max={maxPrice}
              step={5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brand */}
        {brands.length > 0 && (
          <AccordionItem value="brand" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
              Brand
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <div 
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filters.brand === 'all' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50'
                  }`}
                  onClick={() => setFilters({...filters, brand: 'all'})}
                >
                  <span className="text-sm">All Brands</span>
                </div>
                {brands.map(brand => (
                  <div 
                    key={brand}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      filters.brand === brand ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50'
                    }`}
                    onClick={() => setFilters({...filters, brand: brand})}
                  >
                    <span className="text-sm">{brand}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Rating */}
        <AccordionItem value="rating" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Customer Rating
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-2">
              {[4, 3, 2, 1, 0].map(rating => (
                <div 
                  key={rating}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filters.minRating === rating ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-stone-50'
                  }`}
                  onClick={() => setFilters({...filters, minRating: rating})}
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-stone-600">
                    {rating === 0 ? 'All ratings' : `${rating}+ stars`}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Stock */}
        <AccordionItem value="stock" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Availability
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="inStock" 
                checked={filters.inStockOnly}
                onCheckedChange={(v) => setFilters({...filters, inStockOnly: v})}
              />
              <Label htmlFor="inStock" className="text-sm cursor-pointer">
                In stock only
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Result count */}
      <div className="pt-2 border-t border-stone-100 text-center">
        <span className="text-sm text-stone-500">
          {resultCount} {resultCount === 1 ? 'product' : 'products'} found
        </span>
      </div>
    </div>
  );
}