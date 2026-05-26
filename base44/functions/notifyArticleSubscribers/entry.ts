import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data } = body;

    if (event?.type !== 'update' && event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const manuscriptId = event?.entity_id;
    if (!manuscriptId) return Response.json({ skipped: true });

    const newCitationCount = data?.citation_count || 0;
    const oldCitationCount = old_data?.citation_count || 0;
    const isCitationIncrease = event.type === 'update' && newCitationCount > oldCitationCount;
    const isNewComment = event.entity_name === 'Comment' && event.type === 'create';

    if (!isCitationIncrease && !isNewComment) {
      return Response.json({ skipped: true, reason: 'No relevant change' });
    }

    const manuscriptIdToUse = isNewComment ? data?.manuscript_id : manuscriptId;
    if (!manuscriptIdToUse) return Response.json({ skipped: true });

    const [subscriptions] = await Promise.all([
      base44.asServiceRole.entities.ArticleSubscription.filter({ manuscript_id: manuscriptIdToUse }),
    ]);

    if (!subscriptions.length) {
      return Response.json({ skipped: true, reason: 'No subscribers' });
    }

    // Email service is not available — log notification count only
    console.log(`[Article Notification] ${subscriptions.length} subscriber(s) would be notified for manuscript ${manuscriptIdToUse}. Email service temporarily unavailable.`);

    return Response.json({ success: true, note: 'Subscribers noted. Email notifications skipped (service temporarily unavailable).', subscriber_count: subscriptions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});