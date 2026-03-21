import React from 'react';
import { Badge } from "@/components/ui/badge";
import { X, Star } from "lucide-react";

const categories = {
  homesteading: "Homesteading",
  eco_living: "Eco Living",
  animal_care: "Animal Care",
  survival: "Survival",
  home_improvement: "Home Improvement",
  handmade: "Handmade",
  garden: "Garden",
  wellness: "Wellness",
  clothing: "Clothing",
};

const rooms = {
  kitchen: "🍳 Kitchen",
  bedroom: "🛏️ Bedroom",
  bathroom: "🚿 Bathroom",
  living_room: "🛋️ Living Room",
  dining_room: "🍽️ Dining Room",
  outdoor: "🌿 Outdoor",
  garage: "🔧 Garage",
  office: "💼 Office",
  laundry: "👕 Laundry",
  entryway: "🚪 Entryway",
};

const productTypes = {
  cleaning: "Cleaning",
  storage: "Storage",
  decor: "Decor",
  bedding: "Bedding",
  cookware: "Cookware",
  tools: "Tools",
  lighting: "Lighting",
  furniture: "Furniture",
  personal_care: "Personal Care",
  appliances: "Appliances",
  textiles: "Textiles",
  organizers: "Organizers",
};

export default function ActiveFilters({ filters, setFilters, maxPrice = 500 }) {
  const activeFilters = [];

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => setFilters({ ...filters, search: '' })
    });
  }

  if (filters.category !== 'all') {
    activeFilters.push({
      key: 'category',
      label: categories[filters.category] || filters.category,
      color: 'bg-amber-100 text-amber-800',
      onRemove: () => setFilters({ ...filters, category: 'all' })
    });
  }

  if (filters.brand !== 'all') {
    activeFilters.push({
      key: 'brand',
      label: filters.brand,
      color: 'bg-blue-100 text-blue-800',
      onRemove: () => setFilters({ ...filters, brand: 'all' })
    });
  }

  if (filters.minRating > 0) {
    activeFilters.push({
      key: 'rating',
      label: `${filters.minRating}+ stars`,
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Star className="w-3 h-3 fill-current" />,
      onRemove: () => setFilters({ ...filters, minRating: 0 })
    });
  }

  if (filters.inStockOnly) {
    activeFilters.push({
      key: 'stock',
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
      onRemove: () => setFilters({ ...filters, inStockOnly: false })
    });
  }

  if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) {
    activeFilters.push({
      key: 'price',
      label: `$${filters.priceRange[0]} - $${filters.priceRange[1]}`,
      color: 'bg-purple-100 text-purple-800',
      onRemove: () => setFilters({ ...filters, priceRange: [0, maxPrice] })
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map(filter => (
        <Badge 
          key={filter.key}
          variant="secondary" 
          className={`${filter.color || 'bg-emerald-100 text-emerald-800'} px-3 py-1 flex items-center gap-1.5`}
        >
          {filter.icon}
          {filter.label}
          <button 
            onClick={filter.onRemove}
            className="ml-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}