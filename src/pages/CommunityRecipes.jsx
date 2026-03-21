import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, ChefHat, Plus, Clock, Users, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import moment from 'moment';

const categoryLabels = {
  baking: "Baking",
  preserving: "Preserving",
  fermentation: "Fermentation",
  gardening: "Gardening",
  herbal: "Herbal",
  seasonal: "Seasonal",
  other: "Other"
};

export default function CommunityRecipes() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['community-recipes'],
    queryFn: () => base44.entities.CustomerRecipe.filter({ status: 'published' }, '-created_date'),
  });

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.contributor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTime = (recipe) => {
    const prep = recipe.prep_time_minutes || 0;
    const cook = recipe.cook_time_minutes || 0;
    return prep + cook;
  };

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
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 font-medium">Shop</Link>
            <Link to="/CommunityRecipes" className="text-emerald-700 font-medium flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              Recipes
            </Link>
          </nav>
          <Link to="/SubmitRecipe">
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full gap-2">
              <Plus className="w-4 h-4" />
              Share Recipe
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-stone-800 mb-2">Community Recipes</h1>
          <p className="text-stone-600 max-w-2xl mx-auto mb-8">
            Share your favorite recipes with our community. Keep the traditions alive, one recipe at a time.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-full h-12 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Recipes Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <Link key={recipe.id} to={`/RecipeDetail?id=${recipe.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {recipe.category && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">
                          {categoryLabels[recipe.category]}
                        </Badge>
                      )}
                      {totalTime(recipe) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-stone-600">
                          <Clock className="w-3 h-3" />
                          {totalTime(recipe)}m
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recipe.description && (
                      <p className="text-sm text-stone-600 line-clamp-2">{recipe.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {recipe.servings && (
                        <div className="flex items-center gap-2 text-stone-600">
                          <Users className="w-4 h-4" />
                          Serves {recipe.servings}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <p className="text-xs text-stone-500">
                          by {recipe.contributor_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-stone-400">
                          {moment(recipe.created_date).fromNow()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-3xl">
            <ChefHat className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No recipes yet</h3>
            <p className="text-stone-500 mb-6">Be the first to share a recipe with our community!</p>
            <Link to="/SubmitRecipe">
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full gap-2">
                <Plus className="w-4 h-4" />
                Share Your First Recipe
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}