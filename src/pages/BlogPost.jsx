import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Clock, Calendar, ArrowLeft, ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from 'moment';

const categoryLabels = {
  homesteading: "Homesteading", eco_living: "Eco Living", gardening: "Gardening",
  animal_care: "Animal Care", diy: "DIY", recipes: "Recipes",
  wellness: "Wellness", sustainability: "Sustainability",
};
const categoryColors = {
  homesteading: "bg-amber-100 text-amber-800", eco_living: "bg-emerald-100 text-emerald-800",
  gardening: "bg-lime-100 text-lime-800", animal_care: "bg-rose-100 text-rose-800",
  diy: "bg-blue-100 text-blue-800", recipes: "bg-orange-100 text-orange-800",
  wellness: "bg-teal-100 text-teal-800", sustainability: "bg-green-100 text-green-800",
};

export default function BlogPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      // Try by slug first, then by id
      let results = await base44.entities.BlogPost.filter({ slug });
      if (!results.length) results = await base44.entities.BlogPost.filter({ id: slug });
      return results[0] || null;
    },
    enabled: !!slug,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', post?.related_product_ids],
    queryFn: async () => {
      if (!post?.related_product_ids?.length) return [];
      const all = await base44.entities.Product.list();
      return all.filter(p => post.related_product_ids.includes(p.id));
    },
    enabled: !!post?.related_product_ids?.length,
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      const updated = existing
        ? prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
        : [...prev, { ...product, quantity: 1 }];
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">Article not found</h2>
          <Link to={createPageUrl('Blog')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">Back to Blog</Button>
          </Link>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Blog')} className="inline-flex items-center text-stone-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>

        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="aspect-video rounded-3xl overflow-hidden mb-10 shadow-lg">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Article Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={`${categoryColors[post.category]} border-0`}>
              {categoryLabels[post.category]}
            </Badge>
            {post.tags?.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 bg-stone-100 text-stone-600 rounded-full">#{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-5 text-sm text-stone-500 pb-6 border-b border-stone-200">
            {post.author_name && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold text-xs">{post.author_name[0]}</span>
                </div>
                <span className="font-medium text-stone-700">{post.author_name}</span>
              </div>
            )}
            {post.published_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {moment(post.published_date).format('MMMM DD, YYYY')}
              </div>
            )}
            {post.read_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.read_time_minutes} min read
              </div>
            )}
          </div>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-xl text-stone-600 leading-relaxed mb-8 font-medium italic border-l-4 border-emerald-500 pl-6">
            {post.excerpt}
          </p>
        )}

        {/* Article Content */}
        <div
          className="prose prose-stone prose-lg max-w-none mb-12
            prose-headings:text-stone-800 prose-headings:font-bold
            prose-p:text-stone-600 prose-p:leading-relaxed
            prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-stone-800
            prose-ul:text-stone-600 prose-ol:text-stone-600
            prose-blockquote:border-emerald-500 prose-blockquote:text-stone-600 prose-blockquote:not-italic
            prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 p-8 bg-gradient-to-br from-emerald-50 to-amber-50 rounded-3xl border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Shop Related Products</h2>
            <p className="text-stone-600 mb-6">Products mentioned or recommended in this article</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-32 rounded-xl bg-stone-100 overflow-hidden mb-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-stone-800 mb-1 line-clamp-2">{product.title}</h4>
                  <p className="text-emerald-700 font-bold mb-3">${product.price?.toFixed(2)}</p>
                  <Link to={`${createPageUrl('ProductDetail')}?id=${product.id}`}>
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full">
                      View Product
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Shop Simple Living Essentials</h3>
          <p className="text-emerald-100 mb-6">Find everything you need for a sustainable, self-sufficient lifestyle</p>
          <Link to={createPageUrl('Shop')}>
            <Button className="bg-white text-emerald-700 hover:bg-stone-100 rounded-full px-8">
              Browse the Store
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
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