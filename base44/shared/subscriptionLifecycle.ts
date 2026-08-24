// Shared subscription lifecycle logic used by both the admin manageSubscription
// function and the Stripe webhook handler, so activation/cancellation is identical
// regardless of who triggers it.

export async function activateSubscription(base44, subscriptionId) {
  const now = new Date().toISOString();
  const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
    status: 'active',
    current_period_start: now,
    current_period_end: oneYear
  });
  const txs = await base44.asServiceRole.entities.Transaction.filter({ subscription_id: subscriptionId });
  for (const t of txs) {
    if (t.status === 'pending') {
      await base44.asServiceRole.entities.Transaction.update(t.id, { status: 'completed' });
    }
  }
  return { ok: true, status: 'active' };
}

export async function cancelSubscription(base44, subscriptionId) {
  const now = new Date().toISOString();
  await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
    status: 'canceled',
    canceled_at: now
  });
  const txs = await base44.asServiceRole.entities.Transaction.filter({ subscription_id: subscriptionId });
  for (const t of txs) {
    if (t.status === 'pending') {
      await base44.asServiceRole.entities.Transaction.update(t.id, { status: 'failed' });
    }
  }
  return { ok: true, status: 'canceled' };
}