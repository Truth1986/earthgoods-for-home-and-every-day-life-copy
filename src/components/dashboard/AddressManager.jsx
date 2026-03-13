import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Trash2, Star } from "lucide-react";

export default function AddressManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
    is_default: false,
  });

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => base44.entities.Address.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Address.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Address.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Address.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      full_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      phone: '',
      is_default: false,
    });
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-stone-800">Saved Addresses</h2>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-40" />
            </Card>
          ))}
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(address => (
            <Card key={address.id} className="bg-white border-stone-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-lg">{address.label}</CardTitle>
                    {address.is_default && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <Star className="w-3 h-3 mr-1 fill-emerald-700" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(address)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(address.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-stone-600 space-y-1">
                  <p className="font-medium text-stone-800">{address.full_name}</p>
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>{address.city}, {address.state} {address.zip_code}</p>
                  <p>{address.country}</p>
                  {address.phone && <p className="pt-2">📞 {address.phone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border-stone-200">
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No saved addresses</h3>
            <p className="text-stone-500 mb-4">Add your shipping addresses for faster checkout</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Label</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Home, Work, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address Line 1</label>
              <Input
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address Line 2 (optional)</label>
              <Input
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="Apt, suite, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300"
              />
              <label htmlFor="is_default" className="text-sm font-medium">Set as default address</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}