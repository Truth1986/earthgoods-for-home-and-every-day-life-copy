import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, ArrowLeft, Check, ShoppingBag, Loader2, Truck, Zap, Copy, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_address: '',
    notes: ''
  });
  const [shipping, setShipping] = useState('standard');
  const [orderTotal, setOrderTotal] = useState(0);
  const [refInput, setRefInput] = useState('');
  const [appliedCode, setAppliedCode] = useState(null);
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState('');

  // Auto-apply ref from URL on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setRefInput(ref);
      applyCode(ref);
    }
  }, []);

  const applyCode = async (codeToApply) => {
    const code = (codeToApply || refInput).trim().toUpperCase();
    if (!code) return;
    setRefLoading(true);
    setRefError('');
    const results = await base44.entities.ReferralCode.filter({ code, is_active: true });
    if (results.length === 0) {
      setRefError('Invalid or expired referral code.');
    } else {
      setAppliedCode(results[0]);
    }
    setRefLoading(false);
  };

  const removeCode = () => {
    setAppliedCode(null);
    setRefInput('');
    setRefError('');
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedCode ? total * (appliedCode.discount_percent / 100) : 0;
  const discountedTotal = total - discountAmount;
  const fee = discountedTotal * 0.03;
  const shippingCost = shipping === 'overnight' ? discountedTotal * 0.20 : 0;
  const grandTotal = discountedTotal + fee + shippingCost;

  // Check if running in iframe (checkout won't work there)
  const isInIframe = window.self !== window.top;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isInIframe) {
      alert('Stripe checkout only works from the published app. Please open the app in a new tab.');
      return;
    }
    
    if (!form.customer_name || !form.customer_email || !form.customer_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Save order to DB first
    const orderData = {
      ...form,
      items: cart.map(item => ({
        product_id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity
      })),
      total: grandTotal,
      status: 'pending',
      notes: `${form.notes ? form.notes + '\n' : ''}Shipping: ${shipping === 'overnight' ? 'Overnight (+20%)' : 'Standard'}${appliedCode ? `\nReferral code: ${appliedCode.code}` : ''}`
    };

    const order = await base44.entities.Order.create(orderData);

    // Decrement inventory
    await Promise.all(
      cart.map(async (item) => {
        const products = await base44.entities.Product.filter({ id: item.id });
        if (products.length > 0) {
          const product = products[0];
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await base44.entities.Product.update(product.id, { stock: newStock });
        }
      })
    );

    // Handle referral rewards
    if (appliedCode) {
      await base44.entities.ReferralCode.update(appliedCode.id, {
        uses_count: (appliedCode.uses_count || 0) + 1
      });
      await base44.entities.ReferralReward.create({
        referrer_email: appliedCode.referrer_email,
        referred_email: form.customer_email,
        referral_code: appliedCode.code,
        discount_amount: parseFloat((total * 0.10).toFixed(2)),
        order_id: order.id,
        status: 'pending',
      });
    }

    // Create Stripe checkout session and redirect
    const response = await base44.functions.invoke('createCheckoutSession', {
      items: cart.map(item => ({
        product_id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url || null,
      })),
      customer_email: form.customer_email,
      shipping,
      appliedCode: appliedCode?.code || null,
      discountPercent: appliedCode?.discount_percent || 0,
      successUrl: `${window.location.origin}/Checkout?success=true&order=${order.id}`,
      cancelUrl: `${window.location.origin}/Checkout`,
    });

    if (response.data?.url) {
      localStorage.removeItem('cart');
      window.location.href = response.data.url;
    } else {
      toast.error('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-stone-300 mb-4" />
          <h2 className="text-2xl font-bold text-stone-800 mb-4">Your cart is empty</h2>
          <Link to={createPageUrl('Shop')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const copyPayPalLink = () => {
    navigator.clipboard.writeText('paypal.me/tracieruth281');
    toast.success('PayPal link copied!');
  };

  // Handle Stripe success redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccess(true);
    }
  }, []);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-stone-800 mb-4">Payment Successful!</h2>
          <p className="text-stone-600 mb-6">
            Thank you for your order! Your payment was processed and your order is confirmed. You'll receive a confirmation email shortly.
          </p>
          <p className="text-stone-500 text-sm mb-8">
            Your order will be processed and shipped within 1-2 business days.
          </p>
          <Link to={createPageUrl('Shop')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Shop')} className="inline-flex items-center text-stone-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <div className="md:col-span-3">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name"
                      value={form.customer_name}
                      onChange={(e) => setForm({...form, customer_name: e.target.value})}
                      className="h-12 rounded-xl"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={form.customer_email}
                      onChange={(e) => setForm({...form, customer_email: e.target.value})}
                      className="h-12 rounded-xl"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address *</Label>
                    <Textarea 
                      id="address"
                      value={form.customer_address}
                      onChange={(e) => setForm({...form, customer_address: e.target.value})}
                      className="rounded-xl min-h-24"
                      placeholder="Street, City, State, ZIP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (optional)</Label>
                    <Textarea 
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({...form, notes: e.target.value})}
                      className="rounded-xl"
                      placeholder="Any special instructions..."
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Shipping Method</Label>
                    <RadioGroup value={shipping} onValueChange={setShipping} className="space-y-3">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${shipping === 'standard' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'}`}>
                        <RadioGroupItem value="standard" id="standard" />
                        <Truck className="w-5 h-5 text-stone-600" />
                        <div className="flex-1">
                          <p className="font-medium text-stone-800">Standard Shipping</p>
                          <p className="text-sm text-stone-500">5-7 business days</p>
                        </div>
                        <span className="font-semibold text-emerald-600">FREE</span>
                      </label>
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${shipping === 'overnight' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'}`}>
                        <RadioGroupItem value="overnight" id="overnight" />
                        <Zap className="w-5 h-5 text-amber-500" />
                        <div className="flex-1">
                          <p className="font-medium text-stone-800">Overnight Shipping</p>
                          <p className="text-sm text-stone-500">Next business day</p>
                        </div>
                        <span className="font-semibold text-stone-800">+20%</span>
                      </label>
                    </RadioGroup>
                  </div>

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label>Referral Code (optional)</Label>
                    {appliedCode ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-emerald-700">{appliedCode.code}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">-{appliedCode.discount_percent}% off</Badge>
                        </div>
                        <button type="button" onClick={removeCode} className="text-stone-400 hover:text-stone-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={refInput}
                          onChange={(e) => { setRefInput(e.target.value.toUpperCase()); setRefError(''); }}
                          placeholder="Enter referral code"
                          className="h-12 rounded-xl uppercase"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => applyCode()}
                          disabled={refLoading || !refInput.trim()}
                          className="rounded-xl px-5 flex-shrink-0"
                        >
                          {refLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                    )}
                    {refError && <p className="text-sm text-red-500">{refError}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order — $${grandTotal.toFixed(2)}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card className="border-0 shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate text-sm">{item.title}</p>
                      <p className="text-stone-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-stone-800">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}

                <div className="border-t border-stone-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {appliedCode && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Referral Discount ({appliedCode.discount_percent}%)
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span className="flex items-center gap-1">
                      Platform Fee 
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">3%</span>
                    </span>
                    <span>${fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span>{shipping === 'overnight' ? `$${shippingCost.toFixed(2)}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-stone-800 pt-2">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}