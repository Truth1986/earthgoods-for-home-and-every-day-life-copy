import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterSignup({ title = 'Join Our Newsletter', service = 'mailchimp' }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await base44.functions.invoke('subscribeToNewsletter', {
        email,
        name,
        service,
      });

      if (response.data?.success) {
        setSuccess(true);
        setEmail('');
        setName('');
        toast.success('Successfully subscribed!');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        toast.error('Failed to subscribe');
      }
    } catch (err) {
      toast.error(err.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex items-center justify-center gap-3 py-6 text-emerald-700">
            <Check className="w-6 h-6" />
            <p className="font-medium">Welcome to our community!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 bg-white border-stone-200"
            />
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 bg-white border-stone-200"
            />
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg h-10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}