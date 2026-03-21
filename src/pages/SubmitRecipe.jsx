import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, ChefHat, ArrowLeft, Plus, X, Loader2, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubmitRecipe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contributor_name: '',
    category: 'other',
    prep_time_minutes: '',
    cook_time_minutes: '',
    servings: '',
    ingredients: [''],
    instructions: [{ step: 1, text: '' }],
    tips: ''
  });

  const handleAddIngredient = () => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, '']
    });
  };

  const handleRemoveIngredient = (idx) => {
    setForm({
      ...form,
      ingredients: form.ingredients.filter((_, i) => i !== idx)
    });
  };

  const handleAddInstruction = () => {
    setForm({
      ...form,
      instructions: [
        ...form.instructions,
        { step: form.instructions.length + 1, text: '' }
      ]
    });
  };

  const handleRemoveInstruction = (idx) => {
    setForm({
      ...form,
      instructions: form.instructions.filter((_, i) => i !== idx)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Please enter a recipe title');
      return;
    }

    if (form.ingredients.filter(i => i.trim()).length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    if (form.instructions.filter(i => i.text.trim()).length === 0) {
      toast.error('Please add at least one instruction step');
      return;
    }

    setLoading(true);

    try {
      await base44.entities.CustomerRecipe.create({
        title: form.title.trim(),
        description: form.description.trim() || null,
        contributor_name: form.contributor_name.trim() || 'Anonymous',
        category: form.category,
        prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
        cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
        servings: form.servings ? parseInt(form.servings) : null,
        ingredients: form.ingredients
          .filter(i => i.trim())
          .map(text => ({ text: text.trim() })),
        instructions: form.instructions
          .filter(i => i.text.trim())
          .map((i, idx) => ({ step: idx + 1, text: i.text.trim() })),
        tips: form.tips.trim() || null,
        status: 'published'
      });

      setSuccess(true);
      toast.success('Recipe shared! Thank you for keeping traditions alive.');

      setTimeout(() => {
        navigate('/CommunityRecipes');
      }, 2000);

      base44.analytics.track({
        eventName: 'customer_recipe_submitted',
        properties: {
          ingredient_count: form.ingredients.filter(i => i.trim()).length,
          instruction_count: form.instructions.filter(i => i.text.trim()).length,
          category: form.category
        }
      });
    } catch (error) {
      console.error('Recipe submission error:', error);
      toast.error('Failed to submit recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-stone-800 mb-4">Recipe Shared!</h2>
          <p className="text-stone-600 mb-8">
            Your recipe has been added to the community. Thank you for keeping traditions alive.
          </p>
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
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/CommunityRecipes" className="inline-flex items-center text-stone-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Link>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-emerald-600" />
              Share Your Recipe
            </CardTitle>
            <p className="text-sm text-stone-600 mt-2">Help preserve culinary traditions by sharing your favorite recipes with our community.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4 p-4 bg-emerald-50 rounded-xl">
                <h3 className="font-semibold text-stone-800">Recipe Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Recipe Name *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Grandma's Apple Pie"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    className="h-11 rounded-lg"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your recipe..."
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    className="h-24 rounded-lg"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Display name"
                      value={form.contributor_name}
                      onChange={(e) => setForm({...form, contributor_name: e.target.value})}
                      className="h-11 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={form.category} onValueChange={(value) => setForm({...form, category: value})} disabled={loading}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baking">Baking</SelectItem>
                        <SelectItem value="preserving">Preserving</SelectItem>
                        <SelectItem value="fermentation">Fermentation</SelectItem>
                        <SelectItem value="gardening">Gardening</SelectItem>
                        <SelectItem value="herbal">Herbal</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="prep">Prep Time (min)</Label>
                    <Input
                      id="prep"
                      type="number"
                      min="0"
                      placeholder="15"
                      value={form.prep_time_minutes}
                      onChange={(e) => setForm({...form, prep_time_minutes: e.target.value})}
                      className="h-11 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cook">Cook Time (min)</Label>
                    <Input
                      id="cook"
                      type="number"
                      min="0"
                      placeholder="30"
                      value={form.cook_time_minutes}
                      onChange={(e) => setForm({...form, cook_time_minutes: e.target.value})}
                      className="h-11 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      placeholder="4"
                      value={form.servings}
                      onChange={(e) => setForm({...form, servings: e.target.value})}
                      className="h-11 rounded-lg"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-3 p-4 bg-amber-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-stone-800">Ingredients *</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredient}
                    className="h-8 rounded-full gap-1"
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="e.g., 2 cups flour"
                        value={ingredient}
                        onChange={(e) => {
                          const newIngredients = [...form.ingredients];
                          newIngredients[idx] = e.target.value;
                          setForm({...form, ingredients: newIngredients});
                        }}
                        className="h-10 rounded-lg"
                        disabled={loading}
                      />
                      {form.ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="h-10 w-10 rounded-lg"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-stone-800">Instructions *</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInstruction}
                    className="h-8 rounded-full gap-1"
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.instructions.map((instruction, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="min-w-fit pt-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-semibold text-sm">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Describe this step..."
                          value={instruction.text}
                          onChange={(e) => {
                            const newInstructions = [...form.instructions];
                            newInstructions[idx].text = e.target.value;
                            setForm({...form, instructions: newInstructions});
                          }}
                          className="h-20 rounded-lg"
                          disabled={loading}
                        />
                        {form.instructions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveInstruction(idx)}
                            className="h-10 w-10 rounded-lg flex-shrink-0"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-2">
                <Label htmlFor="tips">Tips & Notes</Label>
                <Textarea
                  id="tips"
                  placeholder="Any helpful tips or substitutions..."
                  value={form.tips}
                  onChange={(e) => setForm({...form, tips: e.target.value})}
                  className="h-20 rounded-lg"
                  disabled={loading}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sharing Recipe...
                  </>
                ) : (
                  'Share Recipe'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}