import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Clock, ChefHat, ArrowLeft, ShoppingCart, Check, Users, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryLabels = {
  homesteading: "Homesteading", baking: "Baking", preserving: "Preserving",
  fermentation: "Fermentation", gardening: "Gardening", animal_care: "Animal Care",
  herbal: "Herbal", seasonal: "Seasonal",
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", hard: "bg-red-100 text-red-700",
};

export default function RecipeDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [added, setAdded] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      const results = await base44.entities.Recipe.filter({ id: recipeId });
      return results[0] || null;
    },
    enabled: !!recipeId,
  });

  const linkedProductIds = recipe?.ingredients?.filter(i => i.product_id).map(i => i.product_id) || [];

  const { data: linkedProducts = [] } = useQuery({
    queryKey: ['recipe-products', linkedProductIds],
    queryFn: async () => {
      const all = await base44.entities.Product.list();
      return all.filter(p => linkedProductIds.includes(p.id));
    },
    enabled: linkedProductIds.length > 0,
  });

  const shopIngredients = () => {
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    let updatedCart = [...currentCart];

    linkedProducts.forEach(product => {
      const existing = updatedCart.find(p => p.id === product.id);
      if (existing) {
        updatedCart = updatedCart.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }
    });

    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const totalTime = (recipe?.prep_time_minutes || 0) + (recipe?.cook_time_minutes || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">Recipe not found</h2>
          <Link to={createPageUrl('Recipes')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">Back to Recipes</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          </nav>
          <Link to={createPageUrl('Shop')}>
            <Button variant="outline" className="rounded-full border-stone-200">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Recipes')} className="inline-flex items-center text-stone-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Link>

        {recipe.cover_image_url && (
          <div className="aspect-video rounded-3xl overflow-hidden mb-10 shadow-lg">
            <img src={recipe.cover_image_url} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {recipe.category && <Badge className="bg-amber-100 text-amber-800 border-0">{categoryLabels[recipe.category]}</Badge>}
            {recipe.difficulty && <Badge className={`${difficultyColors[recipe.difficulty]} border-0`}>{recipe.difficulty}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">{recipe.title}</h1>
          {recipe.description && <p className="text-lg text-stone-600 mb-6">{recipe.description}</p>}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 py-6 border-y border-stone-200">
            {recipe.prep_time_minutes && (
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Prep Time</p>
                <p className="font-semibold text-stone-800 flex items-center gap-1"><Clock className="w-4 h-4 text-emerald-600" />{recipe.prep_time_minutes} min</p>
              </div>
            )}
            {recipe.cook_time_minutes && (
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Cook Time</p>
                <p className="font-semibold text-stone-800 flex items-center gap-1"><ChefHat className="w-4 h-4 text-emerald-600" />{recipe.cook_time_minutes} min</p>
              </div>
            )}
            {totalTime > 0 && (
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Total Time</p>
                <p className="font-semibold text-stone-800">{totalTime} min</p>
              </div>
            )}
            {recipe.servings && (
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Servings</p>
                <p className="font-semibold text-stone-800 flex items-center gap-1"><Users className="w-4 h-4 text-emerald-600" />{recipe.servings}</p>
              </div>
            )}
            {recipe.author_name && (
              <div className="text-center">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">By</p>
                <p className="font-semibold text-stone-800">{recipe.author_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-stone-800">Ingredients</h2>
                <span className="text-sm text-stone-400">{recipe.ingredients?.length || 0} items</span>
              </div>
              <ul className="space-y-3 mb-6">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    <span className="text-stone-600 text-sm leading-relaxed">
                      {ing.text}
                      {ing.product_id && linkedProducts.find(p => p.id === ing.product_id) && (
                        <span className="ml-1 text-xs text-emerald-600 font-medium">
                          — {linkedProducts.find(p => p.id === ing.product_id)?.title}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {linkedProducts.length > 0 && (
                <Button
                  onClick={shopIngredients}
                  disabled={added}
                  className={`w-full rounded-full font-semibold transition-all ${added ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                >
                  {added ? (
                    <><Check className="w-4 h-4 mr-2" /> Added to Cart!</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4 mr-2" /> Shop Ingredients ({linkedProducts.length})</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Instructions</h2>
            <ol className="space-y-6">
              {recipe.instructions?.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                    {step.step || i + 1}
                  </div>
                  <p className="text-stone-600 leading-relaxed pt-1">{step.text}</p>
                </li>
              ))}
            </ol>

            {recipe.tips && (
              <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> Tips & Notes
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">{recipe.tips}</p>
              </div>
            )}

            {/* Shop linked products */}
            {linkedProducts.length > 0 && (
              <div className="mt-10 p-6 bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  Shop These Ingredients
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {linkedProducts.map(product => (
                    <Link key={product.id} to={`${createPageUrl('ProductDetail')}?id=${product.id}`}>
                      <div className="bg-white rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Leaf className="w-5 h-5 text-stone-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{product.title}</p>
                          <p className="text-xs text-emerald-700 font-semibold">${product.price?.toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Button onClick={shopIngredients} disabled={added} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
                  {added ? <><Check className="w-4 h-4 mr-2" />Added to Cart!</> : <><ShoppingCart className="w-4 h-4 mr-2" />Add All to Cart</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-stone-800 text-stone-400 py-12 mt-16">
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