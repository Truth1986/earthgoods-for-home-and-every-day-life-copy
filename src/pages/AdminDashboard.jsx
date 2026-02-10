import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Leaf, Plus, Package, ShoppingBag, DollarSign, Pencil, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const categories = [
  { value: "homesteading", label: "Homesteading" },
  { value: "eco_living", label: "Eco Living" },
  { value: "animal_care", label: "Animal Care" },
  { value: "survival", label: "Survival" },
  { value: "home_improvement", label: "Home Improvement" },
  { value: "handmade", label: "Handmade" },
  { value: "garden", label: "Garden" },
  { value: "wellness", label: "Wellness" },
  { value: "clothing", label: "Clothing" },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800"
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'homesteading',
    image_url: '',
    stock: 1,
    featured: false,
    variants: []
  });
  const [newVariant, setNewVariant] = useState({ name: '', price: '' });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const createProduct = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setProductDialog(false);
      resetForm();
      toast.success('Product created!');
    }
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setProductDialog(false);
      resetForm();
      toast.success('Product updated!');
    }
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Product deleted');
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Order updated');
    }
  });

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: '',
      category: 'homesteading',
      image_url: '',
      stock: 1,
      featured: false,
      variants: []
    });
    setNewVariant({ name: '', price: '' });
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || '',
      price: product.price?.toString() || '',
      category: product.category || 'homesteading',
      image_url: product.image_url || '',
      stock: product.stock || 1,
      featured: product.featured || false,
      variants: product.variants || []
    });
    setProductDialog(true);
  };

  const addVariant = () => {
    if (newVariant.name && newVariant.price) {
      setProductForm({
        ...productForm,
        variants: [...productForm.variants, { name: newVariant.name, price: parseFloat(newVariant.price) }]
      });
      setNewVariant({ name: '', price: '' });
    }
  };

  const removeVariant = (index) => {
    setProductForm({
      ...productForm,
      variants: productForm.variants.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock)
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data });
    } else {
      createProduct.mutate(data);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-stone-800">EarthGoods</span>
              <span className="ml-2 text-sm text-stone-500">Admin</span>
            </div>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="rounded-full">View Store</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Products</p>
                  <p className="text-2xl font-bold text-stone-800">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold text-stone-800">{pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-stone-500 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-stone-800">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Products</CardTitle>
                <Dialog open={productDialog} onOpenChange={(open) => { setProductDialog(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input 
                          value={productForm.title}
                          onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={productForm.description}
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price *</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock</Label>
                          <Input 
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input 
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={productForm.featured}
                          onCheckedChange={(v) => setProductForm({...productForm, featured: v})}
                        />
                        <Label>Featured on homepage</Label>
                      </div>

                      {/* Variants */}
                      <div className="space-y-3 border-t pt-4">
                        <Label>Size/Quantity Variants (optional)</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Name (e.g., Large, 5lb)"
                            value={newVariant.name}
                            onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                            className="flex-1"
                          />
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={newVariant.price}
                            onChange={(e) => setNewVariant({...newVariant, price: e.target.value})}
                            className="w-24"
                          />
                          <Button type="button" variant="outline" onClick={addVariant}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {productForm.variants.length > 0 && (
                          <div className="space-y-2">
                            {productForm.variants.map((v, i) => (
                              <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                                <span>{v.name} - ${v.price?.toFixed(2)}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={createProduct.isPending || updateProduct.isPending}
                      >
                        {(createProduct.isPending || updateProduct.isPending) && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {editingProduct ? 'Update Product' : 'Create Product'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    No products yet. Add your first product!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden">
                                {product.image_url ? (
                                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Leaf className="w-4 h-4 text-stone-300" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium">{product.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {product.category?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            ${product.price?.toFixed(2)}
                            {product.variants?.length > 0 && (
                              <span className="text-xs text-stone-500 ml-1">+{product.variants.length} variants</span>
                            )}
                          </TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            {product.featured && <Badge className="bg-amber-100 text-amber-800">Yes</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEditDialog(product)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteProduct.mutate(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    No orders yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="text-stone-500">
                            {order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-sm text-stone-500">{order.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.items?.map((item, i) => (
                              <div key={i} className="text-sm">
                                {item.quantity}x {item.title}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="font-semibold">${order.total?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Select 
                              value={order.status || 'pending'} 
                              onValueChange={(status) => updateOrderStatus.mutate({ id: order.id, status })}
                            >
                              <SelectTrigger className={`w-28 h-8 ${statusColors[order.status || 'pending']}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}