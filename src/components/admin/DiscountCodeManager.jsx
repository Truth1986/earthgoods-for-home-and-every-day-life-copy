import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Tag, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import moment from 'moment';

export default function DiscountCodeManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
    notes: '',
  });

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['discount-codes'],
    queryFn: () => base44.entities.DiscountCode.list('-created_date'),
  });

  const createCode = useMutation({
    mutationFn: (data) => base44.entities.DiscountCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      setOpen(false);
      resetForm();
      toast.success('Discount code created!');
    },
  });

  const toggleCode = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.DiscountCode.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discount-codes'] }),
  });

  const deleteCode = useMutation({
    mutationFn: (id) => base44.entities.DiscountCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast.success('Code deleted');
    },
  });

  const resetForm = () => setForm({
    code: '', discount_type: 'percent', discount_value: '', min_order_amount: '',
    max_uses: '', expires_at: '', is_active: true, notes: '',
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm({ ...form, code });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCode.mutate({
      ...form,
      code: form.code.toUpperCase().trim(),
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
      uses_count: 0,
    });
  };

  const isExpired = (code) => code.expires_at && new Date(code.expires_at) < new Date();
  const isMaxed = (code) => code.max_uses && code.uses_count >= code.max_uses;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-stone-500">{codes.filter(c => c.is_active && !isExpired(c) && !isMaxed(c)).length} active codes</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label>Code *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SPRING20"
                    className="uppercase font-mono"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateCode} className="shrink-0">
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent Off (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percent' ? '10' : '5.00'}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Order ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Summer campaign"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Active immediately</Label>
              </div>

              <Button type="submit" disabled={createCode.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {createCode.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Code'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400" /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <Tag className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <p>No discount codes yet. Create your first one!</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map(code => {
              const expired = isExpired(code);
              const maxed = isMaxed(code);
              return (
                <TableRow key={code.id} className={expired || maxed ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-stone-400 hover:text-stone-600">
                        {copied === code.code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {code.notes && <p className="text-xs text-stone-400 mt-0.5">{code.notes}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {code.discount_type === 'percent' ? `${code.discount_value}% off` : `$${code.discount_value} off`}
                    </Badge>
                    {code.min_order_amount > 0 && (
                      <p className="text-xs text-stone-400 mt-1">Min: ${code.min_order_amount}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-stone-700">{code.uses_count || 0}</span>
                    {code.max_uses && <span className="text-stone-400"> / {code.max_uses}</span>}
                  </TableCell>
                  <TableCell className="text-sm text-stone-500">
                    {code.expires_at ? moment(code.expires_at).format('MMM D, YYYY') : '—'}
                  </TableCell>
                  <TableCell>
                    {expired ? <Badge className="bg-red-100 text-red-700 border-0">Expired</Badge>
                      : maxed ? <Badge className="bg-orange-100 text-orange-700 border-0">Maxed</Badge>
                      : code.is_active ? <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
                      : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={(v) => toggleCode.mutate({ id: code.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-stone-400 hover:text-red-600"
                      onClick={() => deleteCode.mutate(code.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}