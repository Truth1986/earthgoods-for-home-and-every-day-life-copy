import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Leaf, Sprout, CheckCircle2 } from "lucide-react";

export default function EmailCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('email_popup_dismissed');
    const subscribed = localStorage.getItem('email_subscribed');
    if (dismissed || subscribed) return;

    // Show popup after 8 seconds
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('email_popup_dismissed', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    await base44.entities.EmailSubscriber.create({
      email,
      name,
      source: 'homepage_popup',
      referral_code: ref || undefined,
      is_active: true,
    });
    localStorage.setItem('email_subscribed', 'true');
    setSubmitted(true);
    setLoading(false);
    setTimeout(() => setVisible(false), 3000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Top gradient banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-8 text-center relative">
          <button onClick={dismiss} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Join the Community</h2>
          <p className="text-emerald-100 text-sm">Simple living tips, new products & exclusive deals</p>
        </div>

        <div className="p-8">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-stone-800 mb-2">You're in! 🌿</h3>
              <p className="text-stone-600">Welcome to the EarthGoods community. Watch your inbox for good things.</p>
            </div>
          ) : (
            <>
              <p className="text-stone-600 text-center mb-6">
                Get <span className="font-semibold text-emerald-700">10% off your first order</span> plus weekly tips for sustainable, simple living.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  placeholder="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-full"
                />
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-full"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-full text-base font-semibold"
                >
                  {loading ? 'Joining...' : 'Get My 10% Off →'}
                </Button>
              </form>
              <button onClick={dismiss} className="w-full text-center text-xs text-stone-400 mt-4 hover:text-stone-600">
                No thanks, I'll pay full price
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}