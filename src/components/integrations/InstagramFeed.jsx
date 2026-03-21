import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram, Loader2, ExternalLink } from 'lucide-react';

export default function InstagramFeed({ limit = 9 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await base44.functions.invoke('getInstagramFeed', { limit });
        if (response.data?.posts) {
          setPosts(response.data.posts);
        }
      } catch (err) {
        setError('Failed to load Instagram feed');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 text-center text-stone-600">{error}</CardContent>
      </Card>
    );
  }

  if (!posts.length) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 text-center text-stone-600">No posts available</CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Instagram className="w-6 h-6 text-pink-500" />
          Follow Us on Instagram
        </h2>
        <a
          href="https://instagram.com/earthgoods"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
        >
          View All
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-lg aspect-square"
          >
            <img
              src={post.image}
              alt={post.caption || 'Instagram post'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}