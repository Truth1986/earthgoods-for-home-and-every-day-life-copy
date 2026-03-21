import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const LOW_STOCK_THRESHOLD = 5; // notify when stock drops to this or below

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // This function is called by an entity automation on Product update
        const body = await req.json();
        const { data: product, old_data: oldProduct } = body;

        if (!product) {
            return Response.json({ message: 'No product data' });
        }

        const threshold = product.low_stock_threshold ?? LOW_STOCK_THRESHOLD;

        // Only notify if stock just dropped below threshold (wasn't below before)
        const wasOk = !oldProduct || (oldProduct.stock > threshold);
        const isLow = product.stock !== undefined && product.stock <= threshold;

        if (wasOk && isLow) {
            // Get admin users
            const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

            for (const admin of admins) {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: admin.email,
                    subject: `⚠️ Low Stock Alert: ${product.title}`,
                    body: `Hi ${admin.full_name || 'Admin'},\n\nThis is an automated low stock alert from EarthGoods.\n\nProduct: ${product.title}\nCurrent Stock: ${product.stock} units\nAlert Threshold: ${threshold} units\n\nPlease restock this item soon to avoid running out.\n\nCategory: ${product.category || 'N/A'}\nProduct ID: ${product.id}\n\n— EarthGoods Inventory System`
                });
            }

            return Response.json({ 
                notified: true, 
                product: product.title, 
                stock: product.stock,
                admins_notified: admins.length
            });
        }

        return Response.json({ notified: false, reason: 'Stock level OK or unchanged' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});