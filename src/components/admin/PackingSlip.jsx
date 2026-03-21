import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, Leaf } from "lucide-react";
import { format } from "date-fns";

export default function PackingSlip({ order, onClose }) {
    const slipRef = useRef();

    const handlePrint = () => {
        const content = slipRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>Packing Slip — Order ${order.id.slice(-6).toUpperCase()}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                    h1 { font-size: 24px; margin-bottom: 4px; }
                    .divider { border-top: 1px solid #ccc; margin: 16px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
                    th { font-weight: bold; background: #f5f5f5; }
                    .total-row td { font-weight: bold; border-top: 2px solid #333; }
                    .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} className="rounded-full">Close</Button>
                <Button onClick={handlePrint} className="bg-stone-800 hover:bg-stone-900 rounded-full">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Slip
                </Button>
            </div>

            <div ref={slipRef} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 text-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">🌿 EarthGoods</h1>
                        <p className="text-stone-500 text-xs">earthgoods.app</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">PACKING SLIP</p>
                        <p className="text-stone-500 text-xs">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-stone-500 text-xs">
                            {order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : ''}
                        </p>
                    </div>
                </div>

                <div className="border-t border-stone-200 pt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Ship To</p>
                        <p className="font-semibold">{order.customer_name}</p>
                        <p className="text-stone-600 whitespace-pre-line">{order.customer_address}</p>
                    </div>
                    <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Customer Email</p>
                        <p className="text-stone-600">{order.customer_email}</p>
                        {order.notes && (
                            <>
                                <p className="text-xs text-stone-400 uppercase tracking-wide mt-3 mb-1">Order Notes</p>
                                <p className="text-stone-600 text-xs">{order.notes}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="border-t border-stone-200 pt-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-stone-200">
                                <th className="text-left py-2 text-stone-500 font-medium">Item</th>
                                <th className="text-center py-2 text-stone-500 font-medium">Qty</th>
                                <th className="text-right py-2 text-stone-500 font-medium">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, i) => (
                                <tr key={i} className="border-b border-stone-100">
                                    <td className="py-2">{item.title}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="py-3 font-bold text-right pr-4">Order Total:</td>
                                <td className="py-3 font-bold text-right">${order.total?.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="border-t border-stone-200 pt-4 text-center text-xs text-stone-400">
                    Thank you for supporting sustainable living! 🌱 Questions? Contact us at earthgoods.app
                </div>
            </div>
        </div>
    );
}