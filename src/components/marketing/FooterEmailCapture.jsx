import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Mail } from "lucide-react";

export default function FooterEmailCapture({ source = 'footer' }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    await base44.entities.EmailSubscriber.create({
      email,
      source,
      referral_code: ref || undefined,
      is_active: true,
    });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 text-emerald-300">
        <CheckCircle2 className="w-5 h-5" />
        <span>Thanks! You're on the list 🌿</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-emerald-400" />
        <span className="text-stone-300 text-sm font-medium">Get tips & deals in your inbox</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400 rounded-full"
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 flex-shrink-0"
        >
          {loading ? '...' : 'Join'}
        </Button>
      </form>
    </div>
  );
}