import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Leaf, Search, Clock, ChefHat, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryLabels = {
  homesteading: "Homesteading", baking: "Baking", preserving: "Preserving",
  fermentation: "Fermentation", gardening: "Gardening", animal_care: "Animal Care",
  herbal: "Herbal", seasonal: "Seasonal",
};

const categoryColors = {
  homesteading: "bg-amber-100 text-amber-800", baking: "bg-orange-100 text-orange-800",
  preserving: "bg-lime-100 text-lime-800", fermentation: "bg-yellow-100 text-yellow-800",
  gardening: "bg-emerald-100 text-emerald-800", animal_care: "bg-rose-100 text-rose-800",
  herbal: "bg-teal-100 text-teal-800", seasonal: "bg-stone-100 text-stone-800",
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", hard: "bg-red-100 text-red-700",
};

export default function Recipes() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes-public'],
    queryFn: () => base44.entities.Recipe.filter({ status: 'published' }, '-created_date'),
  });

  const filtered = recipes.filter(r => {
    const matchesSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Object.keys(categoryLabels).filter(c => recipes.some(r => r.category === c))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 font-medium">Shop All</Link>
            <Link to={createPageUrl('Blog')} className="text-stone-600 hover:text-emerald-700 font-medium">Blog</Link>
            <Link to={createPageUrl('Recipes')} className="text-emerald-700 font-medium">Recipes</Link>
            <Link to={createPageUrl('About')} className="text-stone-600 hover:text-emerald-700 font-medium">Our Mission</Link>
          </nav>
        </div>
      </header>

      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-4">From Our Homestead Kitchen</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
            Recipes for <span className="text-emerald-600">Simple Living</span>
          </h1>
          <p className="text-lg text-stone-600 mb-8">
            Wholesome recipes using natural ingredients — with shop links for everything you need.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-full border-stone-200"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
              }`}
            >
              {cat === 'all' ? 'All Recipes' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl">
            <ChefHat className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No recipes found</h3>
            <p className="text-stone-500">Check back soon for new recipes!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(recipe => (
              <Link key={recipe.id} to={`${createPageUrl('RecipeDetail')}?id=${recipe.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group h-full flex flex-col">
                  <div className="h-48 bg-stone-100 overflow-hidden">
                    {recipe.cover_image_url ? (
                      <img src={recipe.cover_image_url} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-100">
                        <ChefHat className="w-12 h-12 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {recipe.category && <Badge className={`${categoryColors[recipe.category]} border-0`}>{categoryLabels[recipe.category]}</Badge>}
                      {recipe.difficulty && <Badge className={`${difficultyColors[recipe.difficulty]} border-0`}>{recipe.difficulty}</Badge>}
                    </div>
                    <h3 className="font-bold text-lg text-stone-800 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {recipe.title}
                    </h3>
                    <p className="text-stone-500 text-sm mb-4 line-clamp-2 flex-1">{recipe.description}</p>
                    <div className="flex items-center justify-between text-xs text-stone-400 mt-auto">
                      <div className="flex items-center gap-3">
                        {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                          </div>
                        )}
                        {recipe.ingredients?.length > 0 && (
                          <span>{recipe.ingredients.length} ingredients</span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-stone-800 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">EarthGoods</span>
          </div>
          <p className="text-sm">Made with love for simple living folks everywhere.</p>
        </div>
      </footer>
    </div>
  );
}