import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { activateSubscription, cancelSubscription } from '../../shared/subscriptionLifecycle.ts';

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

    if (action === 'activate') return Response.json(await activateSubscription(base44, subscription_id));
    if (action === 'cancel') return Response.json(await cancelSubscription(base44, subscription_id));

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}