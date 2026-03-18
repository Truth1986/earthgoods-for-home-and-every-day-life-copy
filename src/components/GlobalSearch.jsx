import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Search, Leaf, FileText, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { data: products = [] } = useQuery({
    queryKey: ['search-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
    enabled: true,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['search-posts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_date', 200),
    enabled: true,
  });

  const q = query.trim().toLowerCase();

  const matchedProducts = q.length < 2 ? [] : products
    .filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    )
    .slice(0, 4);

  const matchedPosts = q.length < 2 ? [] : posts
    .filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q)
    )
    .slice(0, 4);

  const hasResults = matchedProducts.length > 0 || matchedPosts.length > 0;
  const showDropdown = open && q.length >= 2;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && q.length >= 2) {
      navigate(`${createPageUrl('Shop')}?search=${encodeURIComponent(query)}`);
      setOpen(false);
      setQuery('');
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const handleSelect = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products & articles..."
          className="pl-9 pr-8 h-9 rounded-full border-stone-200 bg-stone-50 text-sm focus:bg-white"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-stone-400">
              No results for "{query}"
            </div>
          ) : (
            <>
              {matchedProducts.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wide">Products</p>
                  {matchedProducts.map(product => (
                    <Link
                      key={product.id}
                      to={`${createPageUrl('ProductDetail')}?id=${product.id}`}
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-4 h-4 text-stone-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{product.title}</p>
                        <p className="text-xs text-stone-400">${product.price?.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {matchedPosts.length > 0 && (
                <div className={matchedProducts.length > 0 ? 'border-t border-stone-100' : ''}>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wide">Articles</p>
                  {matchedPosts.map(post => (
                    <Link
                      key={post.id}
                      to={`${createPageUrl('BlogPost')}?slug=${post.slug || post.id}`}
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{post.title}</p>
                        <p className="text-xs text-stone-400 truncate">{post.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-stone-100 px-4 py-2.5">
                <button
                  onClick={() => {
                    navigate(`${createPageUrl('Shop')}?search=${encodeURIComponent(query)}`);
                    handleSelect();
                  }}
                  className="text-xs text-emerald-600 font-medium hover:underline"
                >
                  See all product results for "{query}" →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}