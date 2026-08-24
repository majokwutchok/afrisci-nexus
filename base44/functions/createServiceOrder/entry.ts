import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { plan_id, manuscript_id } = body;
    if (!plan_id) return Response.json({ error: 'plan_id is required' }, { status: 400 });

    let plan;
    try {
      plan = await base44.asServiceRole.entities.Plan.get(plan_id);
    } catch {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }
    if (!plan || !plan.is_active || plan.product_type !== 'service') {
      return Response.json({ error: 'Service plan not available' }, { status: 404 });
    }

    let manuscript_title = '';
    if (manuscript_id) {
      try {
        const m = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);
        manuscript_title = m?.title || '';
      } catch { /* manuscript may not exist yet */ }
    }

    const order = await base44.asServiceRole.entities.ServiceOrder.create({
      manuscript_id: manuscript_id || '',
      manuscript_title,
      plan_id: plan.id,
      service_name: plan.name,
      user_id: user.id,
      author_email: user.email || '',
      status: 'pending',
      payment_provider: 'manual',
      amount: plan.price || 0,
      currency: plan.currency || 'USD'
    });

    const tx = await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.price || 0,
      currency: plan.currency || 'USD',
      transaction_type: 'payment',
      payment_provider: 'manual',
      provider_transaction_id: order.id,
      status: 'pending',
      description: `Author service: ${plan.name}`
    });

    return Response.json({ order_id: order.id, transaction_id: tx.id, status: 'pending' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}