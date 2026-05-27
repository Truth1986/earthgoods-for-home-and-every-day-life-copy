import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProductImporter() {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importErrors, setImportErrors] = useState([]);

  const importProducts = useMutation({
    mutationFn: async () => {
      setImporting(true);
      setImportErrors([]);
      setImportedCount(0);

      try {
        // Fetch all products from Base44
        console.log('Fetching products from Base44...');
        const sourceProducts = await base44.entities.Product.list();
        
        if (!sourceProducts || sourceProducts.length === 0) {
          toast.error('No products found in source');
          return;
        }

        console.log(`Found ${sourceProducts.length} products to import`);
        
        // Fetch existing products once
        const existingProducts = await base44.entities.Product.list();
        const existingTitles = new Set(existingProducts.map(p => p.title));
        
        let successCount = 0;
        const errors = [];

        // Import each product
        for (const product of sourceProducts) {
          try {
            // Check if product already exists by title
            if (!existingTitles.has(product.title)) {
              // Create the product with all its data
              await base44.entities.Product.create({
                title: product.title,
                description: product.description,
                price: product.price,
                stock: product.stock || 0,
                category: product.category,
                image_url: product.image_url,
                featured: product.featured || false,
                variants: product.variants || [],
                supplier_id: product.supplier_id,
                supplier_sku: product.supplier_sku,
                supplier_cost: product.supplier_cost,
                brand: product.brand,
                sku: product.sku,
              });
              successCount++;
              existingTitles.add(product.title);
            }
          } catch (err) {
            console.error(`Error importing product ${product.title}:`, err);
            errors.push(`${product.title}: ${err.message}`);
          }
        }

        setImportedCount(successCount);
        setImportErrors(errors);
        
        // Invalidate the products query to refetch
        queryClient.invalidateQueries(['admin-products']);
        
        if (errors.length === 0) {
          toast.success(`Successfully imported ${successCount} products!`);
        } else {
          toast.warning(`Imported ${successCount} products with ${errors.length} errors`);
        }
      } catch (err) {
        console.error('Import failed:', err);
        toast.error(`Import failed: ${err.message}`);
        setImportErrors([err.message]);
      } finally {
        setImporting(false);
      }
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex gap-2 items-center"
          disabled={importing}
        >
          <Download className="w-4 h-4" />
          Import from Base44
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Products from Base44</DialogTitle>
        </DialogHeader>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-900">
              This will import all products from the Base44 database. 
              Duplicate products (by title) will be skipped.
            </p>
          </CardContent>
        </Card>

        {importedCount > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <p className="text-sm text-green-900 font-semibold">
                ✓ Successfully imported {importedCount} products!
              </p>
            </CardContent>
          </Card>
        )}

        {importErrors.length > 0 && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <p className="text-sm text-red-900 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Import Errors ({importErrors.length}):
              </p>
              <ul className="text-xs text-red-800 space-y-1 max-h-40 overflow-y-auto">
                {importErrors.map((err, idx) => (
                  <li key={idx} className="break-words">• {err}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={importing}
            onClick={() => window.location.reload()}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={importing}
            onClick={() => importProducts.mutate()}
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              'Import Products'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
