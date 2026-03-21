import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function BulkStockEditor() {
    const queryClient = useQueryClient();
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState(false);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['admin-products-stock'],
        queryFn: () => base44.entities.Product.list('title'),
    });

    const handleChange = (id, value) => {
        setEdits(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        const changed = Object.entries(edits).filter(([id, val]) => {
            const original = products.find(p => p.id === id);
            return original && parseInt(val) !== original.stock;
        });

        if (changed.length === 0) {
            toast.info('No changes to save.');
            return;
        }

        setSaving(true);
        await Promise.all(
            changed.map(([id, val]) =>
                base44.entities.Product.update(id, { stock: parseInt(val) })
            )
        );
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['admin-products-stock']);
        setEdits({});
        setSaving(false);
        toast.success(`Updated stock for ${changed.length} product(s)!`);
    };

    const changedCount = Object.keys(edits).filter(id => {
        const original = products.find(p => p.id === id);
        return original && parseInt(edits[id]) !== original.stock;
    }).length;

    if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-stone-500">{products.length} products — edit stock quantities inline</p>
                {changedCount > 0 && (
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-full"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save {changedCount} Change{changedCount !== 1 ? 's' : ''}
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                {products.map(product => {
                    const currentVal = edits[product.id] !== undefined ? edits[product.id] : product.stock;
                    const isChanged = edits[product.id] !== undefined && parseInt(edits[product.id]) !== product.stock;
                    const isLow = parseInt(currentVal) <= 5;

                    return (
                        <div key={product.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${isChanged ? 'border-emerald-400 bg-emerald-50' : 'border-stone-100 bg-white'}`}>
                            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                                {product.image_url
                                    ? <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full bg-stone-200" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-stone-800 truncate text-sm">{product.title}</p>
                                <p className="text-xs text-stone-400 capitalize">{product.category?.replace('_', ' ')}</p>
                            </div>
                            {isLow && (
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    value={currentVal ?? 0}
                                    onChange={(e) => handleChange(product.id, e.target.value)}
                                    className={`w-20 h-9 text-center ${isChanged ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}
                                />
                                {isChanged && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">changed</Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}