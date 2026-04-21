import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { emailTemplates, sendEmail } from './utils/emailTemplates.js';
import { analyticsTracker } from './utils/analytics.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all products
    const products = await base44.asServiceRole.entities.Product.list();
    
    const lowStockProducts = [];

    for (const product of products) {
      const stock = product.stock || 0;
      const reorderLevel = product.reorder_level || product.low_stock_threshold || 10;

      if (stock <= reorderLevel) {
        lowStockProducts.push(product);

        // Track analytics
        await analyticsTracker.trackLowStockAlert(base44, {
          product_id: product.id,
          product_name: product.title,
          current_stock: stock,
          reorder_level: reorderLevel,
        });

        // Check if auto-restock is enabled
        if (product.auto_restock === true) {
          // Get supplier info
          const suppliers = await base44.asServiceRole.entities.Supplier.filter({ 
            id: product.supplier_id 
          });

          if (suppliers.length > 0) {
            const supplier = suppliers[0];
            const suggestedQty = product.reorder_quantity || (reorderLevel * 3); // 3x reorder level

            // Create restock order
            const restockOrder = await base44.asServiceRole.entities.RestockOrder?.create?.({
              supplier_id: product.supplier_id,
              supplier_name: supplier.name,
              supplier_email: supplier.email,
              products: [
                {
                  product_id: product.id,
                  product_title: product.title,
                  supplier_sku: product.supplier_sku,
                  current_stock: stock,
                  suggested_quantity: suggestedQty,
                }
              ],
              status: 'draft',
              created_date: new Date().toISOString(),
            });

            console.log(`Auto-restock order created for ${product.title}: ${restockOrder?.id}`);

            // Send email to supplier
            const template = emailTemplates.restockOrderRequest(supplier, restockOrder);
            await sendEmail(base44, supplier.email, template);
          }
        }
      }
    }

    // Notify admins of all low-stock items
    if (lowStockProducts.length > 0) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      
      const productList = lowStockProducts
        .map(p => `- ${p.title}: ${p.stock || 0} units (Reorder at: ${p.reorder_level || 10})`)
        .join('\n');

      for (const admin of admins) {
        await sendEmail(base44, admin.email, {
          subject: `⚠️ ${lowStockProducts.length} Product(s) Running Low on Stock`,
          body: `Hi Admin,

The following products are running low on stock:\n\n${productList}\n\nPlease review and consider placing restock orders.\n\nBest,\nEarthGoods System`,
        });
      }
    }

    return Response.json({
      success: true,
      low_stock_products: lowStockProducts.length,
      products: lowStockProducts.map(p => ({
        id: p.id,
        title: p.title,
        stock: p.stock,
        reorder_level: p.reorder_level,
      })),
    });
  } catch (error) {
    console.error('Low stock check error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
