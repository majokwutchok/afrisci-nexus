// Fulfillment for one-time paid products (job posts, ad placements) triggered by
// the Stripe webhook on checkout.session.completed. Each marks its record
// active and completes the matching pending Transaction.

export async function fulfillJobPost(base44, recordId, transactionId) {
  await base44.asServiceRole.entities.JobPost.update(recordId, {
    status: 'active',
    posted_date: new Date().toISOString().slice(0, 10)
  });
  if (transactionId) {
    try { await base44.asServiceRole.entities.Transaction.update(transactionId, { status: 'completed' }); } catch {}
  }
  return { ok: true };
}

export async function fulfillAdPlacement(base44, recordId, transactionId) {
  await base44.asServiceRole.entities.AdPlacement.update(recordId, { status: 'active' });
  if (transactionId) {
    try { await base44.asServiceRole.entities.Transaction.update(transactionId, { status: 'completed' }); } catch {}
  }
  return { ok: true };
}