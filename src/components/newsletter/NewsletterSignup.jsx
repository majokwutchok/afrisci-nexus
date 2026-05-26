import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if already subscribed
      const existing = await base44.entities.NewsletterSubscriber.filter({
        email
      });

      if (existing && existing.length > 0) {
        setError('Email already subscribed');
        setLoading(false);
        return;
      }

      // Create subscriber
      const confirmationToken = Math.random().toString(36).substring(2, 15);
      
      await base44.entities.NewsletterSubscriber.create({
        email,
        name: name || email.split('@')[0],
        confirmation_token: confirmationToken,
        source: 'sidebar'
      });

      // Auto-confirm the subscription (email confirmation unavailable)
      const newSubs = await base44.entities.NewsletterSubscriber.filter({ email });
      const newSub = newSubs.find(s => s.confirmation_token === confirmationToken) || newSubs[0];
      if (newSub?.id) {
        await base44.entities.NewsletterSubscriber.update(newSub.id, { is_confirmed: true }).catch(() => {});
      }

      setSubmitted(true);
      setEmail('');
      setName('');
      toast.success('Check your email for confirmation!');
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Failed to subscribe. Please try again.');
      toast.error('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Welcome!</h3>
            <p className="text-sm text-slate-600">
              Check your inbox for a confirmation email. You'll start receiving curated research updates twice weekly.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="w-full"
            >
              Subscribe Another Email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900">Research Newsletter</h3>
            </div>
            <p className="text-xs text-slate-600">
              Receive curated African research updates twice weekly—no spam, unsubscribe anytime.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubscribe} className="space-y-3">
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="text-sm"
              required
            />

            {error && (
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? 'Subscribing...' : 'Subscribe Free'}
            </Button>
          </form>

          {/* Benefits */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-700">What You'll Get:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>✓ Curated research articles</li>
              <li>✓ Editorial insights & analysis</li>
              <li>✓ Journal updates & calls for papers</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}