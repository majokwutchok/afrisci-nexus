// Shared Stripe Checkout Session builder used by one-time product checkout
// functions (job posts, ad placements) so the Stripe call + metadata handling
// lives in one place. Membership subscriptions use createCheckoutSession which
// has its own activation path via the webhook.

import { secrets } from 'base44:runtime';

export async function buildCheckoutSession({ plan, customer_email, success_url, cancel_url, metadata }) {
  const key = secrets.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('Stripe is not configured yet (missing STRIPE_SECRET_KEY)');

  const amount = Math.round((plan.price || 0) * 100);
  const isRecurring = plan.billing_interval === 'annual' || plan.billing_interval === 'monthly';
  const interval = plan.billing_interval === 'annual' ? 'year' : 'month';

  const params = new URLSearchParams();
  params.append('mode', isRecurring ? 'subscription' : 'payment');
  if (customer_email) params.append('customer_email', customer_email);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', (plan.currency || 'USD').toLowerCase());
  params.append('line_items[0][price_data][unit_amount]', String(amount));
  params.append('line_items[0][price_data][product_data][name]', plan.name);
  if (isRecurring) params.append('line_items[0][price_data][recurring][interval]', interval);
  params.append('success_url', success_url);
  params.append('cancel_url', cancel_url);

  const appId = Deno.env.get('BASE44_APP_ID') || '';
  for (const [k, v] of Object.entries(metadata || {})) params.append(`metadata[${k}]`, String(v));
  params.append('metadata[base44_app_id]', appId);
  if (isRecurring) params.append('subscription_data[metadata][base44_app_id]', appId);

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2025-10-29.clover',
      'Idempotency-Key': crypto.randomUUID()
    },
    body: params.toString()
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.message || 'Stripe error');
  return data;
}