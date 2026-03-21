import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, Truck, CheckCircle, Clock, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from 'moment';

const statusSteps = ['pending', 'paid', 'shipped', 'delivered'];

const statusConfig = {
  pending:   { label: 'Order Placed',    icon: Clock,         color: 'text-amber-500',  bg: 'bg-amber-100' },
  paid:      { label: 'Payment Confirmed', icon: CheckCircle, color: 'text-blue-500',   bg: 'bg-blue-100' },
  shipped:   { label: 'Shipped',          icon: Truck,        color: 'text-purple-500', bg: 'bg-purple-100' },
  delivered: { label: 'Delivered',        icon: Package,      color: 'text-emerald-600',bg: 'bg-emerald-100' },
};

const estimatedDelivery = (order) => {
  if (order.status === 'delivered') return null;
  const base = moment(order.created_date);
  if (order.status === 'shipped') return base.add(3, 'days').format('MMM D, YYYY');
  return base.add(7, 'days').format('MMM D, YYYY');
};

export default function TrackOrder() {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    const results = await base44.entities.Order.filter({ customer_email: email.trim().toLowerCase() });
    const found = results.find(o =>
      o.id === orderId.trim() || o.id.startsWith(orderId.trim())
    );

    if (!found) {
      setError('No order found with that email and order ID. Please double-check and try again.');
    } else {
      setOrder(found);
    }
    setLoading(false);
  };

  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 font-medium">Shop All</Link>
            <Link to={createPageUrl('Blog')} className="text-stone-600 hover:text-emerald-700 font-medium">Blog</Link>
            <Link to="/TrackOrder" className="text-emerald-700 font-medium">Track Order</Link>
          </nav>
          <Link to={createPageUrl('Shop')}>
            <Button variant="outline" className="rounded-full border-stone-200">Shop</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Track Your Order</h1>
          <p className="text-stone-500">Enter your email and order ID to see your order status.</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              placeholder="Paste your order ID here"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
            <p className="text-xs text-stone-400">You can find your order ID in your confirmation email.</p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {loading ? 'Searching...' : <><Search className="w-4 h-4 mr-2" />Track Order</>}
          </Button>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </form>

        {/* Order Result */}
        {order && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Order ID</p>
                <p className="font-mono text-sm text-stone-700 break-all">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Placed</p>
                <p className="text-sm font-medium text-stone-700">{moment(order.created_date).format('MMM D, YYYY')}</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              {statusSteps.map((step, i) => {
                const cfg = statusConfig[step];
                const Icon = cfg.icon;
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? cfg.bg : done ? 'bg-stone-50' : 'opacity-40'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${active ? cfg.bg : done ? 'bg-white border border-stone-200' : 'bg-white border border-stone-200'}`}>
                      <Icon className={`w-5 h-5 ${done ? cfg.color : 'text-stone-300'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${active ? 'text-stone-800' : done ? 'text-stone-700' : 'text-stone-400'}`}>{cfg.label}</p>
                      {active && step !== 'delivered' && estimatedDelivery(order) && (
                        <p className="text-xs text-stone-500 mt-0.5">Estimated delivery: {estimatedDelivery(order)}</p>
                      )}
                      {active && step === 'delivered' && (
                        <p className="text-xs text-emerald-600 mt-0.5">Your order has arrived!</p>
                      )}
                    </div>
                    {active && <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs`}>Current</Badge>}
                    {done && !active && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Items */}
            {order.items?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-stone-700 mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-stone-600">{item.title} <span className="text-stone-400">×{item.quantity}</span></span>
                      <span className="font-medium text-stone-800">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-stone-100 pt-2 flex justify-between font-semibold text-stone-800">
                    <span>Total</span>
                    <span>${order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.customer_address && (
              <div>
                <p className="text-sm font-semibold text-stone-700 mb-1">Shipping To</p>
                <p className="text-sm text-stone-500 whitespace-pre-line">{order.customer_address}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-stone-800 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">EarthGoods</span>
          </div>
          <p className="text-sm">Made with love for simple living folks everywhere.</p>
        </div>
      </footer>
    </div>
  );
}