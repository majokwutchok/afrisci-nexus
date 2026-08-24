import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { subscription_id, action } = body;
    if (!subscription_id || !action) {
      return Response.json({ error: 'subscription_id and action are required' }, { status: 400 });
    }

    const subscription = await base44.asServiceRole.entities.Subscription.get(subscription_id);
    if (!subscription) return Response.json({ error: 'Subscription not found' }, { status: 404 });

    const now = new Date().toISOString();
    const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    if (action === 'activate') {
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: 'active',
        current_period_start: now,
        current_period_end: oneYear
      });
      const txs = await base44.asServiceRole.entities.Transaction.filter({ subscription_id });
      for (const t of txs) {
        if (t.status === 'pending') {
          await base44.asServiceRole.entities.Transaction.update(t.id, { status: 'completed' });
        }
      }
      return Response.json({ ok: true, status: 'active' });
    }

    if (action === 'cancel') {
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: 'canceled',
        canceled_at: now
      });
      const txs = await base44.asServiceRole.entities.Transaction.filter({ subscription_id });
      for (const t of txs) {
        if (t.status === 'pending') {
          await base44.asServiceRole.entities.Transaction.update(t.id, { status: 'failed' });
        }
      }
      return Response.json({ ok: true, status: 'canceled' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}