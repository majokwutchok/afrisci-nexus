import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { plan_id, institution_name, country, contact_email, email_domains, notes } = body;
    if (!plan_id || !institution_name) {
      return Response.json({ error: 'plan_id and institution_name are required' }, { status: 400 });
    }

    let plan;
    try {
      plan = await base44.asServiceRole.entities.Plan.get(plan_id);
    } catch {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }
    if (!plan || !plan.is_active) {
      return Response.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    const purchaserDomain = (user.email || '').split('@')[1]?.toLowerCase().trim();
    const extraDomains = Array.isArray(email_domains)
      ? email_domains.map(d => String(d).toLowerCase().trim()).filter(Boolean)
      : (typeof email_domains === 'string'
        ? email_domains.split(',').map(d => d.toLowerCase().trim()).filter(Boolean)
        : []);
    const domains = Array.from(new Set([purchaserDomain, ...extraDomains].filter(Boolean)));

    const now = new Date().toISOString();

    const org = await base44.asServiceRole.entities.Organization.create({
      name: institution_name,
      org_type: 'institution',
      country: country || '',
      email_domains: domains,
      contact_name: user.full_name || '',
      contact_email: contact_email || user.email || '',
      admin_user_id: user.id,
      status: 'active',
      description: notes || ''
    });

    const entitlements = plan.entitlements || {};

    const subscription = await base44.asServiceRole.entities.Subscription.create({
      organization_id: org.id,
      organization_name: org.name,
      user_id: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      status: 'pending_payment',
      seats: plan.seats || 0,
      entitlements_snapshot: entitlements,
      payment_provider: 'manual',
      started_at: now,
      notes: notes || ''
    });

    const transaction = await base44.asServiceRole.entities.Transaction.create({
      organization_id: org.id,
      subscription_id: subscription.id,
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.price || 0,
      currency: plan.currency || 'USD',
      transaction_type: 'payment',
      payment_provider: 'manual',
      status: 'pending',
      description: `Membership: ${plan.name} for ${institution_name}`
    });

    return Response.json({
      organization_id: org.id,
      subscription_id: subscription.id,
      transaction_id: transaction.id,
      status: 'pending_payment'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}