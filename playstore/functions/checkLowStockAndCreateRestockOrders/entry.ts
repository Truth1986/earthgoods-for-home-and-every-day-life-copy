import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const LOW_STOCK_THRESHOLD = 10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const products = await base44.asServiceRole.entities.Product.list();
    const suppliers = await base44.asServiceRole.entities.Supplier.list();
    const existingRestockOrders = await base44.asServiceRole.entities.RestockOrder.filter({ status: 'draft' });

    // Map suppliers by ID
    const supplierMap = suppliers.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});

    // Group low-stock products by supplier
    const lowStockBySupplier = {};
    const lowStockProducts = [];

    products.forEach((product) => {
      const stock = product.stock || 0;

      if (stock <= LOW_STOCK_THRESHOLD) {
        lowStockProducts.push({
          id: product.id,
          title: product.title,
          stock,
          threshold: LOW_STOCK_THRESHOLD,
          supplier_id: product.supplier_id,
        });

        if (product.supplier_id) {
          if (!lowStockBySupplier[product.supplier_id]) {
            lowStockBySupplier[product.supplier_id] = [];
          }
          lowStockBySupplier[product.supplier_id].push({
            product_id: product.id,
            product_title: product.title,
            current_stock: stock,
            suggested_quantity: Math.max(20, LOW_STOCK_THRESHOLD * 2),
            supplier_sku: product.supplier_sku || '',
          });
        }
      }
    });

    // Create or update restock orders for each supplier
    const createdOrders = [];
    for (const [supplierId, products] of Object.entries(lowStockBySupplier)) {
      const supplier = supplierMap[supplierId];
      if (!supplier) continue;

      // Check if draft order already exists for this supplier
      const existingOrder = existingRestockOrders.find(
        (o) => o.supplier_id === supplierId && o.status === 'draft'
      );

      if (existingOrder) {
        // Update existing draft
        await base44.asServiceRole.entities.RestockOrder.update(existingOrder.id, {
          products,
        });
      } else {
        // Create new draft
        const order = await base44.asServiceRole.entities.RestockOrder.create({
          supplier_id: supplierId,
          supplier_name: supplier.name,
          supplier_email: supplier.email,
          products,
          status: 'draft',
        });
        createdOrders.push(order);
      }
    }

    // Send notification email to admin
    if (lowStockProducts.length > 0) {
      const emailBody = `
        <h2>Low Stock Alert</h2>
        <p>The following products have fallen below the ${LOW_STOCK_THRESHOLD} unit threshold:</p>
        
        <ul>
          ${lowStockProducts.map((p) => `
            <li><strong>${p.title}</strong> - Current Stock: ${p.stock} units</li>
          `).join('')}
        </ul>
        
        <p>Restock order drafts have been automatically generated and are ready to be sent to your suppliers. Please review them in your admin dashboard.</p>
      `;

      try {
        await base44.integrations.Core.SendEmail({
          to: 'admin@earthgoods.com',
          subject: `Low Stock Alert - ${lowStockProducts.length} products`,
          body: emailBody,
          from_name: 'EarthGoods Inventory System',
        });
      } catch (emailError) {
        console.error('Failed to send low stock alert email:', emailError);
      }
    }

    return Response.json({
      success: true,
      low_stock_products: lowStockProducts.length,
      restock_orders_created: createdOrders.length,
      suppliers_affected: Object.keys(lowStockBySupplier).length,
    });
  } catch (error) {
    console.error('Low stock check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});