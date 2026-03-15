import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Leaf, Search, ArrowRight, Clock, Calendar, ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from 'moment';

const categoryLabels = {
  homesteading: "Homesteading",
  eco_living: "Eco Living",
  gardening: "Gardening",
  animal_care: "Animal Care",
  diy: "DIY",
  recipes: "Recipes",
  wellness: "Wellness",
  sustainability: "Sustainability",
};

const categoryColors = {
  homesteading: "bg-amber-100 text-amber-800",
  eco_living: "bg-emerald-100 text-emerald-800",
  gardening: "bg-lime-100 text-lime-800",
  animal_care: "bg-rose-100 text-rose-800",
  diy: "bg-blue-100 text-blue-800",
  recipes: "bg-orange-100 text-orange-800",
  wellness: "bg-teal-100 text-teal-800",
  sustainability: "bg-green-100 text-green-800",
};

export default function Blog() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_date'),
  });

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchesSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, search, activeCategory]);

  const featuredPost = filtered[0];
  const restPosts = filtered.slice(1);

  const categories = ['all', ...Object.keys(categoryLabels).filter(c =>
    posts.some(p => p.category === c)
  )];

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
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 font-medium">Shop All</Link>
            <Link to={createPageUrl('Blog')} className="text-emerald-700 font-medium">Blog</Link>
            <Link to={createPageUrl('About')} className="text-stone-600 hover:text-emerald-700 font-medium">Our Mission</Link>
          </nav>
          <Link to={createPageUrl('Shop')}>
            <Button variant="outline" className="rounded-full border-stone-200">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-4">The EarthGoods Journal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
            Living Simply, <span className="text-emerald-600">Living Well</span>
          </h1>
          <p className="text-lg text-stone-600 mb-8">
            Tips, guides, and inspiration for homesteaders, nature lovers, and sustainable living enthusiasts.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-full border-stone-200"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
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
              {cat === 'all' ? 'All Topics' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl">
            <Leaf className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No articles found</h3>
            <p className="text-stone-500">Check back soon for new content!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link to={`${createPageUrl('BlogPost')}?slug=${featuredPost.slug || featuredPost.id}`} className="block mb-12">
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group">
                  <div className="md:flex">
                    <div className="md:w-1/2 h-64 md:h-auto bg-stone-100 overflow-hidden">
                      {featuredPost.cover_image_url ? (
                        <img
                          src={featuredPost.cover_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-100">
                          <Leaf className="w-20 h-20 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={`${categoryColors[featuredPost.category]} border-0`}>
                          {categoryLabels[featuredPost.category]}
                        </Badge>
                        <span className="text-xs text-stone-400">Featured</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-4 group-hover:text-emerald-700 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-stone-600 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-stone-500">
                        {featuredPost.author_name && <span>By {featuredPost.author_name}</span>}
                        {featuredPost.published_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {moment(featuredPost.published_date).format('MMM DD, YYYY')}
                          </div>
                        )}
                        {featuredPost.read_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {featuredPost.read_time_minutes} min read
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {restPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restPosts.map(post => (
                  <Link key={post.id} to={`${createPageUrl('BlogPost')}?slug=${post.slug || post.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group h-full flex flex-col">
                      <div className="h-48 bg-stone-100 overflow-hidden">
                        {post.cover_image_url ? (
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-100">
                            <Leaf className="w-12 h-12 text-emerald-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <Badge className={`${categoryColors[post.category]} border-0 w-fit mb-3`}>
                          {categoryLabels[post.category]}
                        </Badge>
                        <h3 className="font-bold text-lg text-stone-800 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-stone-500 text-sm mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-stone-400 mt-auto">
                          <div className="flex items-center gap-3">
                            {post.published_date && (
                              <span>{moment(post.published_date).format('MMM DD, YYYY')}</span>
                            )}
                            {post.read_time_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.read_time_minutes} min
                              </div>
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
          </>
        )}
      </div>

      {/* Footer */}
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