import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, 
  Save, FileText, Globe, Tag, Link as LinkIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactQuill from 'react-quill';
import moment from 'moment';

const CATEGORIES = [
  { value: "homesteading", label: "Homesteading" },
  { value: "eco_living", label: "Eco Living" },
  { value: "gardening", label: "Gardening" },
  { value: "animal_care", label: "Animal Care" },
  { value: "diy", label: "DIY" },
  { value: "recipes", label: "Recipes" },
  { value: "wellness", label: "Wellness" },
  { value: "sustainability", label: "Sustainability" },
];

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  category: 'homesteading',
  tags: [],
  status: 'draft',
  author_name: '',
  read_time_minutes: 5,
  related_product_ids: [],
  seo_title: '',
  seo_description: '',
  published_date: new Date().toISOString().split('T')[0],
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function BlogEditor() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-admin'],
    queryFn: () => base44.entities.BlogPost.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-blog'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] }); closeEditor(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] }); closeEditor(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.BlogPost.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] }),
  });

  const closeEditor = () => {
    setShowEditor(false);
    setEditingPost(null);
    setForm(emptyForm);
    setTagInput('');
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setForm({ ...emptyForm, ...post });
    setShowEditor(true);
  };

  const handleTitleChange = (title) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
      seo_title: prev.seo_title || title,
    }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!form.tags.includes(tag)) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-800">Blog Manager</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Blog')} target="_blank">
              <Button variant="outline" className="rounded-full border-stone-200">
                <Globe className="w-4 h-4 mr-2" />
                View Blog
              </Button>
            </Link>
            <Button onClick={() => setShowEditor(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-stone-800">{posts.length}</p>
              <p className="text-sm text-stone-500 mt-1">Total Articles</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-emerald-600">{publishedCount}</p>
              <p className="text-sm text-stone-500 mt-1">Published</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-amber-600">{draftCount}</p>
              <p className="text-sm text-stone-500 mt-1">Drafts</p>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-white border-stone-200">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <h3 className="text-xl font-semibold text-stone-700 mb-2">No articles yet</h3>
              <p className="text-stone-500 mb-4">Create your first article to start driving traffic</p>
              <Button onClick={() => setShowEditor(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Write First Article
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Card key={post.id} className="bg-white border-stone-200 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1 min-w-0">
                      {post.cover_image_url && (
                        <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                          <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-stone-800 truncate">{post.title}</h3>
                          <Badge className={`${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-0 flex-shrink-0`}>
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-500 line-clamp-1 mb-2">{post.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-stone-400">
                          <span>{CATEGORIES.find(c => c.value === post.category)?.label}</span>
                          {post.published_date && <span>{moment(post.published_date).format('MMM DD, YYYY')}</span>}
                          {post.read_time_minutes && <span>{post.read_time_minutes} min read</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus.mutate({ id: post.id, status: post.status === 'published' ? 'draft' : 'published' })}
                        className={`rounded-full text-xs ${post.status === 'published' ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'}`}
                      >
                        {post.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(post.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Article' : 'New Article'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="content" className="mt-4">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="meta">Details & SEO</TabsTrigger>
                <TabsTrigger value="products">Related Products</TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Article title..."
                    required
                    className="text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Excerpt / Preview</label>
                  <Textarea
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Brief summary shown in the blog listing..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content *</label>
                  <div className="border border-stone-200 rounded-lg overflow-hidden">
                    <ReactQuill
                      value={form.content}
                      onChange={(content) => setForm({ ...form, content })}
                      style={{ minHeight: '300px' }}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'blockquote'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Meta Tab */}
              <TabsContent value="meta" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Author Name</label>
                    <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Read Time (minutes)</label>
                    <Input type="number" value={form.read_time_minutes} onChange={(e) => setForm({ ...form, read_time_minutes: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Published Date</label>
                    <Input type="date" value={form.published_date} onChange={(e) => setForm({ ...form, published_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL Slug</label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="auto-generated-from-title" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                  <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (press Enter to add)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.tags.map(tag => (
                      <button key={tag} type="button" onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1 hover:bg-red-100 hover:text-red-700 transition-colors">
                        #{tag} ×
                      </button>
                    ))}
                  </div>
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Add a tag and press Enter..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SEO Title</label>
                  <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Defaults to article title" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SEO Description</label>
                  <Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} rows={2} placeholder="Meta description for search engines (150-160 chars)" />
                  <p className="text-xs text-stone-400 mt-1">{form.seo_description.length}/160 characters</p>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                <p className="text-sm text-stone-600">Link products to this article so they appear as recommendations at the bottom of the post.</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {products.map(product => (
                    <label key={product.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.related_product_ids.includes(product.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...form.related_product_ids, product.id]
                            : form.related_product_ids.filter(id => id !== product.id);
                          setForm({ ...form, related_product_ids: ids });
                        }}
                        className="w-4 h-4"
                      />
                      {product.image_url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-stone-700">{product.title}</p>
                        <p className="text-sm text-emerald-700">${product.price?.toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-200">
              <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {isPending ? 'Saving...' : editingPost ? 'Update Article' : 'Save Article'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}