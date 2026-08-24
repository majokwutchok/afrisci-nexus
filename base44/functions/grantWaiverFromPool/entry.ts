import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { pool_id, manuscript_id } = body;
    if (!pool_id || !manuscript_id) {
      return Response.json({ error: 'pool_id and manuscript_id are required' }, { status: 400 });
    }

    let pool;
    try { pool = await base44.asServiceRole.entities.WaiverPool.get(pool_id); } catch { return Response.json({ error: 'Pool not found' }, { status: 404 }); }
    if (!pool) return Response.json({ error: 'Pool not found' }, { status: 404 });
    if (pool.status !== 'active') return Response.json({ error: 'Pool is not active' }, { status: 400 });

    const remaining = (pool.total_slots || 0) - (pool.slots_used || 0);
    if (remaining <= 0) return Response.json({ error: 'Pool has no remaining slots' }, { status: 400 });

    let manuscript_title = '';
    try {
      const m = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);
      manuscript_title = m?.title || '';
    } catch { /* ignore */ }

    const newUsed = (pool.slots_used || 0) + 1;
    const newStatus = newUsed >= (pool.total_slots || 0) ? 'exhausted' : 'active';
    await base44.asServiceRole.entities.WaiverPool.update(pool_id, {
      slots_used: newUsed,
      status: newStatus
    });

    await base44.asServiceRole.entities.Transaction.create({
      organization_id: pool.funder_organization_id || '',
      plan_id: '',
      amount: pool.price_per_slot || 0,
      currency: pool.currency || 'USD',
      transaction_type: 'waiver_grant',
      payment_provider: 'waiver',
      status: 'completed',
      description: `Waiver granted from pool "${pool.name}" for manuscript: ${manuscript_title || manuscript_id}`,
      notes: `pool:${pool_id};manuscript:${manuscript_id}`
    });

    return Response.json({
      ok: true,
      slots_used: newUsed,
      remaining: (pool.total_slots || 0) - newUsed,
      status: newStatus
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}