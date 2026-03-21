import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CartDrawer({ open, onClose, cart, setCart }) {
  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return updated;
    });
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const fee = total * 0.03; // 3% low fee
  const grandTotal = total + fee;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-stone-50">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-stone-800">
            <ShoppingBag className="w-5 h-5" />
            Your Cart
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-800 truncate">{item.title}</h4>
                        <p className="text-emerald-700 font-semibold">${item.price?.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-stone-200 pt-4 mt-4 space-y-3">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    Platform Fee 
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Only 3%</span>
                  </span>
                  <span>${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-stone-800">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <Link to={createPageUrl('Checkout')} onClick={onClose}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-12 text-lg mt-2">
                    Checkout with Card
                  </Button>
                </Link>
                <div className="relative flex items-center gap-3 mt-3">
                  <div className="flex-1 border-t border-stone-200" />
                  <span className="text-xs text-stone-400">or</span>
                  <div className="flex-1 border-t border-stone-200" />
                </div>
                <a
                  href={`https://www.paypal.com/paypalme/tracieruth281/${grandTotal.toFixed(2)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="block w-full mt-3"
                >
                  <button
                    type="button"
                    className="w-full h-12 rounded-full text-base font-bold flex items-center justify-center gap-2"
                    style={{ background: '#003087', color: '#fff' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825l-1.273 8.05h3.51l.922-5.832c.082-.518.526-.9 1.05-.9h.663c4.299 0 7.664-1.747 8.647-6.797.021-.106.04-.21.057-.316z"/></svg>
                    Pay ${grandTotal.toFixed(2)} with PayPal
                  </button>
                </a>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}