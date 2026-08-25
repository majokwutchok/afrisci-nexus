import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildCheckoutSession } from '../../shared/stripeCheckout.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { plan_id, slot, title, sponsor_name, creative_url, link_url, start_date, end_date, booked_by_email, notes } = body;
    if (!plan_id || !slot || !sponsor_name || !link_url) {
      return Response.json({ error: 'plan_id, slot, sponsor_name and link_url are required' }, { status: 400 });
    }

    let plan;
    try { plan = await base44.asServiceRole.entities.Plan.get(plan_id); } catch { return Response.json({ error: 'Plan not found' }, { status: 404 }); }
    if (plan.product_type !== 'ad_placement') return Response.json({ error: 'Selected plan is not an advertising plan' }, { status: 400 });

    const origin = new URL(req.url).origin;
    const ad = await base44.asServiceRole.entities.AdPlacement.create({
      slot, title: title || sponsor_name, sponsor_name,
      creative_url: creative_url || '', link_url,
      start_date: start_date || '', end_date: end_date || '',
      booked_by_email: booked_by_email || '',
      plan_id, amount: plan.price || 0, currency: plan.currency || 'USD',
      status: 'pending_payment', payment_provider: 'stripe',
      notes: notes || ''
    });

    const tx = await base44.asServiceRole.entities.Transaction.create({
      plan_id, amount: plan.price || 0, currency: plan.currency || 'USD',
      transaction_type: 'payment', payment_provider: 'stripe',
      status: 'pending', description: `Ad placement: ${sponsor_name} (${slot})`
    });

    const session = await buildCheckoutSession({
      plan,
      customer_email: booked_by_email || '',
      success_url: `${origin}/Advertise?stripe=success&ad=${ad.id}`,
      cancel_url: `${origin}/Advertise?stripe=canceled`,
      metadata: { product_type: 'ad_placement', record_id: ad.id, transaction_id: tx.id, plan_id }
    });

    await base44.asServiceRole.entities.AdPlacement.update(ad.id, { stripe_checkout_session_id: session.id });
    await base44.asServiceRole.entities.Transaction.update(tx.id, { provider_transaction_id: session.id });

    return Response.json({ url: session.url, session_id: session.id, ad_placement_id: ad.id });
  } catch (error) {
    console.error('createAdCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}