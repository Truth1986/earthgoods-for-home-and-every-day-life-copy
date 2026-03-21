import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, Truck, CheckCircle, Clock, Search, MapPin, RefreshCw, ShoppingBag, CreditCard, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from 'moment';

const statusSteps = ['pending', 'paid', 'shipped', 'delivered'];

const statusConfig = {
  pending:   { label: 'Order Placed',       icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400' },
  paid:      { label: 'Payment Confirmed',  icon: CreditCard,   color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500' },
  shipped:   { label: 'Out for Delivery',   icon: Truck,        color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200', dot: 'bg-purple-500' },
  delivered: { label: 'Delivered',          icon: Package,      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrder = useCallback(async (emailVal, orderIdVal, silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    const results = await base44.entities.Order.filter({ customer_email: emailVal.trim().toLowerCase() });
    const found = results.find(o =>
      o.id === orderIdVal.trim() || o.id.startsWith(orderIdVal.trim())
    );

    if (!found) {
      if (!silent) setError('No order found with that email and order ID. Please double-check and try again.');
    } else {
      setOrder(found);
      setLastUpdated(new Date());
    }

    if (silent) setRefreshing(false);
    else setLoading(false);
  }, []);

  // Auto-refresh every 60s if order is in-transit
  useEffect(() => {
    if (!order || order.status === 'delivered') return;
    const interval = setInterval(() => {
      fetchOrder(email, orderId, true);
    }, 60000);
    return () => clearInterval(interval);
  }, [order, email, orderId, fetchOrder]);

  // Check URL params for pre-fill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramEmail = params.get('email');
    const paramOrder = params.get('order');
    if (paramEmail && paramOrder) {
      setEmail(paramEmail);
      setOrderId(paramOrder);
      fetchOrder(paramEmail, paramOrder);
    }
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    setOrder(null);
    fetchOrder(email, orderId);
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
            <Button variant="outline" className="rounded-full border-stone-200">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center">
            <Truck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Order Status</h1>
          <p className="text-stone-500">Track your sustainable essentials — enter your order details below.</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-6 space-y-4">
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
              className="h-12 rounded-xl font-mono text-sm"
              required
            />
            <p className="text-xs text-stone-400">Your order ID is in your confirmation email.</p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
              : <><Search className="w-4 h-4 mr-2" />Track My Order</>
            }
          </Button>
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
        </form>

        {/* Order Result */}
        {order && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            {/* Status Banner */}
            <div className={`px-6 py-4 ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.border} border-b flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                {React.createElement(statusConfig[order.status]?.icon, {
                  className: `w-5 h-5 ${statusConfig[order.status]?.color}`
                })}
                <div>
                  <p className={`font-semibold ${statusConfig[order.status]?.color}`}>
                    {statusConfig[order.status]?.label}
                  </p>
                  {order.status !== 'delivered' && estimatedDelivery(order) && (
                    <p className="text-xs text-stone-500">Est. delivery: {estimatedDelivery(order)}</p>
                  )}
                  {order.status === 'delivered' && (
                    <p className="text-xs text-emerald-600">Your order has arrived!</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-xs text-stone-400">
                    Updated {moment(lastUpdated).fromNow()}
                  </span>
                )}
                <button
                  onClick={() => fetchOrder(email, orderId, true)}
                  disabled={refreshing}
                  className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-full hover:bg-white/60"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Meta */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Order ID</p>
                  <p className="font-mono text-xs text-stone-600 break-all">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Placed On</p>
                  <p className="text-sm font-medium text-stone-700">{moment(order.created_date).format('MMM D, YYYY')}</p>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-stone-100 z-0" />
                <div className="space-y-3 relative z-10">
                  {statusSteps.map((step, i) => {
                    const cfg = statusConfig[step];
                    const Icon = cfg.icon;
                    const done = i <= currentStepIndex;
                    const active = i === currentStepIndex;
                    return (
                      <div key={step} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? cfg.bg : ''}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                          active ? `${cfg.bg} ${cfg.border}` :
                          done ? 'bg-emerald-50 border-emerald-200' :
                          'bg-white border-stone-200'
                        }`}>
                          {done && !active
                            ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                            : <Icon className={`w-4 h-4 ${done ? cfg.color : 'text-stone-300'}`} />
                          }
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${active ? 'text-stone-800' : done ? 'text-stone-600' : 'text-stone-300'}`}>
                            {cfg.label}
                          </p>
                        </div>
                        {active && (
                          <Badge className={`${cfg.bg} ${cfg.color} border ${cfg.border} text-xs font-medium`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5 animate-pulse`} />
                            Current
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              {order.items?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-stone-400" />
                    Items in This Order
                  </p>
                  <div className="bg-stone-50 rounded-xl divide-y divide-stone-100">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-3 text-sm">
                        <span className="text-stone-700">
                          {item.title}
                          <span className="text-stone-400 ml-1">×{item.quantity}</span>
                        </span>
                        <span className="font-medium text-stone-800">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 font-semibold text-stone-800 text-sm">
                      <span>Total</span>
                      <span>${order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {order.customer_address && (
                <div className="flex gap-3">
                  <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-stone-700 mb-1">Shipping To</p>
                    <p className="text-sm text-stone-500 whitespace-pre-line">{order.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help text */}
        {!order && !loading && (
          <p className="text-center text-xs text-stone-400 mt-4">
            Need help? Contact us at <span className="text-emerald-600">hello@earthgoods.com</span>
          </p>
        )}
      </div>

      <footer className="bg-stone-800 text-stone-400 py-12 mt-12">
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