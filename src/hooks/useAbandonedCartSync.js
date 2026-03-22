import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Syncs the current cart to the AbandonedCart entity for logged-in users.
 * Call this hook in any page that manages the cart.
 */
export function useAbandonedCartSync(cart, user) {
    const syncTimeoutRef = useRef(null);
    const cartRecordIdRef = useRef(null);

    useEffect(() => {
        if (!user?.email || !cart) return;

        // Clear any pending sync
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        // Debounce sync by 3 seconds to avoid too many writes
        syncTimeoutRef.current = setTimeout(async () => {
            if (cart.length === 0) {
                // Cart is empty — mark as recovered if we have a record
                if (cartRecordIdRef.current) {
                    await base44.entities.AbandonedCart.update(cartRecordIdRef.current, {
                        status: 'recovered'
                    });
                    cartRecordIdRef.current = null;
                }
                return;
            }

            const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const payload = {
                customer_email: user.email,
                customer_name: user.full_name || '',
                items: cart.map(item => ({
                    product_id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.image_url || ''
                })),
                cart_total: cartTotal,
                last_updated: new Date().toISOString(),
                status: 'active',
                reminder_sent: false
            };

            if (cartRecordIdRef.current) {
                // Update existing record
                await base44.entities.AbandonedCart.update(cartRecordIdRef.current, payload);
            } else {
                // Check if there's already an active cart for this user
                const existing = await base44.entities.AbandonedCart.filter({
                    customer_email: user.email,
                    status: 'active'
                });

                if (existing.length > 0) {
                    cartRecordIdRef.current = existing[0].id;
                    await base44.entities.AbandonedCart.update(existing[0].id, payload);
                } else {
                    const created = await base44.entities.AbandonedCart.create(payload);
                    cartRecordIdRef.current = created.id;
                }
            }
        }, 3000);

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, [cart, user?.email]);

    // Mark cart as recovered when checkout is completed
    const markRecovered = async () => {
        if (cartRecordIdRef.current) {
            await base44.entities.AbandonedCart.update(cartRecordIdRef.current, { status: 'recovered' });
            cartRecordIdRef.current = null;
        } else if (user?.email) {
            const existing = await base44.entities.AbandonedCart.filter({
                customer_email: user.email,
                status: 'active'
            });
            for (const cart of existing) {
                await base44.entities.AbandonedCart.update(cart.id, { status: 'recovered' });
            }
        }
    };

    return { markRecovered };
}