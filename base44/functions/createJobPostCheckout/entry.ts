import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildCheckoutSession } from '../../shared/stripeCheckout.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { plan_id, title, organization_name, job_type, field, country, location, application_url, description, deadline, posted_by_email } = body;
    if (!plan_id || !title || !organization_name || !job_type || !application_url) {
      return Response.json({ error: 'plan_id, title, organization_name, job_type and application_url are required' }, { status: 400 });
    }

    let plan;
    try { plan = await base44.asServiceRole.entities.Plan.get(plan_id); } catch { return Response.json({ error: 'Plan not found' }, { status: 404 }); }
    if (plan.product_type !== 'job_pack') return Response.json({ error: 'Selected plan is not a job posting plan' }, { status: 400 });

    const origin = new URL(req.url).origin;
    const isFeatured = (plan.name || '').toLowerCase().includes('featured');

    const job = await base44.asServiceRole.entities.JobPost.create({
      title, organization_name, job_type,
      field: field || '', country: country || '', location: location || '',
      application_url, description: description || '', deadline: deadline || '',
      posted_by_email: posted_by_email || '',
      plan_id, amount: plan.price || 0, currency: plan.currency || 'USD',
      status: 'pending_payment', payment_provider: 'stripe', is_featured: isFeatured
    });

    const tx = await base44.asServiceRole.entities.Transaction.create({
      plan_id, amount: plan.price || 0, currency: plan.currency || 'USD',
      transaction_type: 'payment', payment_provider: 'stripe',
      status: 'pending', description: `Job posting: ${title}`
    });

    const session = await buildCheckoutSession({
      plan,
      customer_email: posted_by_email || '',
      success_url: `${origin}/Jobs?stripe=success&job=${job.id}`,
      cancel_url: `${origin}/Jobs?stripe=canceled`,
      metadata: { product_type: 'job_post', record_id: job.id, transaction_id: tx.id, plan_id }
    });

    await base44.asServiceRole.entities.JobPost.update(job.id, { stripe_checkout_session_id: session.id });
    await base44.asServiceRole.entities.Transaction.update(tx.id, { provider_transaction_id: session.id });

    return Response.json({ url: session.url, session_id: session.id, job_post_id: job.id });
  } catch (error) {
    console.error('createJobPostCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}