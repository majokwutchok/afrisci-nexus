import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { requireUser, isAdmin } from '../../shared/authGuard.ts';

// Only send Stripe's return links to our own site.
function safeReturnUrl(value, fallback, origin) {
  try {
    if (!value) return fallback;
    const u = new URL(value);
    const host = u.hostname.replace(/^www\./, '');
    const ok = u.protocol === 'https:' && (host === 'afriscinexus.com' || host.endsWith('.base44.app') || u.origin === origin);
    return ok ? u.toString() : fallback;
  } catch { return fallback; }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Memberships are bought by a signed-in account, for a subscription record that account created.
    const gate = await requireUser(base44);
    if (gate.response) return gate.response;
    const user = gate.user;
    const key = secrets.get('STRIPE_SECRET_KEY');
    if (!key) return Response.json({ error: 'Stripe is not configured yet (missing STRIPE_SECRET_KEY)' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const { subscription_id, customer_email, success_url, cancel_url } = body;
    if (!subscription_id) return Response.json({ error: 'subscription_id is required' }, { status: 400 });

    let sub;
    try { sub = await base44.asServiceRole.entities.Subscription.get(subscription_id); } catch { return Response.json({ error: 'Subscription not found' }, { status: 404 }); }
    if (!sub) return Response.json({ error: 'Subscription not found' }, { status: 404 });
    const ownsSub = isAdmin(user) || (sub.user_id && sub.user_id === user.id) || (sub.created_by_id && sub.created_by_id === user.id);
    if (!ownsSub) return Response.json({ error: 'Subscription not found' }, { status: 404 });
    if (sub.status === 'active') return Response.json({ error: 'This subscription is already active' }, { status: 409 });

    let plan;
    try { plan = await base44.asServiceRole.entities.Plan.get(sub.plan_id); } catch { return Response.json({ error: 'Plan not found' }, { status: 404 }); }
    if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 });

    const amount = Math.round((plan.price || 0) * 100);
    const isRecurring = plan.billing_interval === 'annual' || plan.billing_interval === 'monthly';
    const interval = plan.billing_interval === 'annual' ? 'year' : 'month';
    const origin = new URL(req.url).origin;
    const success = safeReturnUrl(success_url, `${origin}/InstitutionDashboard?stripe=success`, origin);
    const cancel = safeReturnUrl(cancel_url, `${origin}/Memberships?stripe=canceled`, origin);
    const appId = Deno.env.get('BASE44_APP_ID') || '';

    const params = new URLSearchParams();
    params.append('mode', isRecurring ? 'subscription' : 'payment');
    const email = user.email || customer_email;
    if (email) params.append('customer_email', email);
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', (plan.currency || 'USD').toLowerCase());
    params.append('line_items[0][price_data][unit_amount]', String(amount));
    params.append('line_items[0][price_data][product_data][name]', plan.name);
    if (isRecurring) params.append('line_items[0][price_data][recurring][interval]', interval);
    params.append('success_url', success);
    params.append('cancel_url', cancel);
    params.append('metadata[subscription_id]', sub.id);
    params.append('metadata[organization_id]', sub.organization_id || '');
    params.append('metadata[plan_id]', plan.id);
    params.append('metadata[product_type]', 'membership');
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
    if (!resp.ok) {
      console.error('Stripe checkout error:', data?.error?.message);
      return Response.json({ error: data?.error?.message || 'Stripe error' }, { status: resp.status });
    }

    await base44.asServiceRole.entities.Subscription.update(subscription_id, {
      stripe_checkout_session_id: data.id,
      payment_provider: 'stripe'
    });

    return Response.json({ url: data.url, session_id: data.id });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}