import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterSignupForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const existing = await base44.entities.NewsletterSubscriber.filter({ email: email.toLowerCase().trim() });
      
      if (existing.length > 0) {
        toast.info('You\'re already subscribed!');
        setEmail('');
        setName('');
        setLoading(false);
        return;
      }

      // Create new subscriber
      await base44.entities.NewsletterSubscriber.create({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        subscribed_date: new Date().toISOString(),
        is_active: true
      });

      setSuccess(true);
      setEmail('');
      setName('');
      toast.success('Welcome to our newsletter!');

      // Reset success message after 4 seconds
      setTimeout(() => setSuccess(false), 4000);

      base44.analytics.track({
        eventName: 'newsletter_signup',
        properties: {
          has_name: !!name.trim()
        }
      });
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <Check className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-700">Thanks for subscribing!</p>
          <p className="text-sm text-emerald-600">Check your inbox for updates.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-stone-800">Get Updates</h3>
      </div>
      <Input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-10 rounded-lg bg-white/80 border-stone-300 text-sm"
        disabled={loading}
      />
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 rounded-lg bg-white/80 border-stone-300 text-sm"
          disabled={loading}
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </div>
    </form>
  );
}