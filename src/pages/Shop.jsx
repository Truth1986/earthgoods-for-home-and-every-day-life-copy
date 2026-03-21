import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Search, ShoppingCart, Heart, SlidersHorizontal, X, Grid3X3, List } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import AdvancedFilters from "@/components/shop/AdvancedFilters";
import MobileNav from "@/components/MobileNav";
import ActiveFilters from "@/components/shop/ActiveFilters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MAX_PRICE = 500;

// Simple search indexing - creates searchable tokens from product
const createSearchIndex = (product) => {
  const tokens = [];
  if (product.title) tokens.push(...product.title.toLowerCase().split(/\s+/));
  if (product.description) tokens.push(...product.description.toLowerCase().split(/\s+/));
  if (product.brand) tokens.push(product.brand.toLowerCase());
  if (product.category) tokens.push(product.category.toLowerCase().replace('_', ' '));
  return tokens;
};

// Calculate search relevance score
const getSearchScore = (product, searchTerms, index) => {
  if (!searchTerms.length) return 1;
  
  let score = 0;
  const title = product.title?.toLowerCase() || '';
  const brand = product.brand?.toLowerCase() || '';
  
  for (const term of searchTerms) {
    // Exact title match - highest score
    if (title === term) score += 100;
    // Title starts with term
    else if (title.startsWith(term)) score += 50;
    // Title contains term
    else if (title.includes(term)) score += 30;
    // Brand exact match
    if (brand === term) score += 40;
    // Brand contains term
    else if (brand.includes(term)) score += 20;
    // Token match
    if (index.some(token => token.startsWith(term))) score += 10;
    if (index.some(token => token.includes(term))) score += 5;
  }
  
  return score;
};

export default function Shop() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    room: 'all',
    product_type: 'all',
    brand: 'all',
    minRating: 0,
    inStockOnly: false,
    priceRange: [0, MAX_PRICE],
    sortBy: 'relevance',
  });

  // Debounced search for better performance
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 150);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  // Extract unique brands from products
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.filter(p => p.brand).map(p => p.brand))];
    return uniqueBrands.sort();
  }, [products]);

  // Create search indices for all products
  const searchIndices = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.id] = createSearchIndex(product);
      return acc;
    }, {});
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const searchTerms = debouncedSearch.toLowerCase().split(/\s+/).filter(Boolean);
    
    let results = products.filter(p => {
      // Search filter
      if (searchTerms.length > 0) {
        const index = searchIndices[p.id] || [];
        const hasMatch = searchTerms.every(term => 
          index.some(token => token.includes(term))
        );
        if (!hasMatch) return false;
      }
      
      // Category filter
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      
      // Brand filter
      if (filters.brand !== 'all' && p.brand !== filters.brand) return false;
      
      // Rating filter
      if (filters.minRating > 0 && (!p.rating || p.rating < filters.minRating)) return false;
      
      // Stock filter
      if (filters.inStockOnly && (!p.stock || p.stock <= 0)) return false;
      
      // Price filter
      const price = p.price || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
      
      return true;
    });

    // Sort results
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'relevance':
          if (searchTerms.length > 0) {
            const scoreA = getSearchScore(a, searchTerms, searchIndices[a.id] || []);
            const scoreB = getSearchScore(b, searchTerms, searchIndices[b.id] || []);
            return scoreB - scoreA;
          }
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case 'newest':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
          return (b.review_count || 0) - (a.review_count || 0);
        default:
          return 0;
      }
    });

    return results;
  }, [products, debouncedSearch, filters, searchIndices]);

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

  const FiltersContent = (
    <AdvancedFilters 
      filters={filters}
      setFilters={setFilters}
      brands={brands}
      maxPrice={MAX_PRICE}
      resultCount={filteredProducts.length}
    />
  );

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
            <Link to={createPageUrl('Shop')} className="text-emerald-700 font-medium">
              Shop All
            </Link>
            <Link to={createPageUrl('Wishlist')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Wishlist
            </Link>
            <Link to={createPageUrl('About')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium">
              Our Mission
            </Link>
          </nav>
          <Button 
            variant="outline" 
            className="relative rounded-full border-stone-200 hidden md:flex"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
          <MobileNav cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input 
              placeholder="Search products, brands, categories..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-12 pr-10 h-12 rounded-full border-stone-200 bg-white text-base"
            />
            {filters.search && (
              <button 
                onClick={() => setFilters({...filters, search: ''})}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Mobile filter toggle */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden h-12 rounded-full border-stone-200">
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                {FiltersContent}
              </div>
            </SheetContent>
          </Sheet>

          {/* View toggle */}
          <div className="hidden md:flex items-center gap-1 bg-white border border-stone-200 rounded-full p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className={`rounded-full h-10 w-10 ${viewMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className={`rounded-full h-10 w-10 ${viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        <div className="mb-6">
          <ActiveFilters filters={filters} setFilters={setFilters} maxPrice={MAX_PRICE} />
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              {FiltersContent}
            </div>
          </aside>

          {/* Products Grid/List */}
          <main className="flex-1">
            {isLoading ? (
              <div className={viewMode === 'grid' 
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/50 rounded-3xl">
                <Leaf className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                <h3 className="text-xl font-semibold text-stone-700 mb-2">No products found</h3>
                <p className="text-stone-500 mb-4">Try adjusting your search or filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    search: '',
                    category: 'all',
                    brand: 'all',
                    minRating: 0,
                    inStockOnly: false,
                    priceRange: [0, MAX_PRICE],
                    sortBy: 'relevance',
                  })}
                  className="rounded-full"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
    </div>
  );
}