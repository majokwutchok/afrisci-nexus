import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data } = body;

    // Only process update events
    if (event?.type !== 'update' && event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const manuscriptId = event?.entity_id;
    if (!manuscriptId) return Response.json({ skipped: true });

    // Determine what changed
    const newCitationCount = data?.citation_count || 0;
    const oldCitationCount = old_data?.citation_count || 0;
    const isCitationIncrease = event.type === 'update' && newCitationCount > oldCitationCount;
    const isNewComment = event.entity_name === 'Comment' && event.type === 'create';

    if (!isCitationIncrease && !isNewComment) {
      return Response.json({ skipped: true, reason: 'No relevant change' });
    }

    // Get subscribers for this manuscript
    const manuscriptIdToUse = isNewComment ? data?.manuscript_id : manuscriptId;
    if (!manuscriptIdToUse) return Response.json({ skipped: true });

    const [subscriptions, manuscript] = await Promise.all([
      base44.asServiceRole.entities.ArticleSubscription.filter({ manuscript_id: manuscriptIdToUse }),
      base44.asServiceRole.entities.Manuscript.get(manuscriptIdToUse).catch(() => null),
    ]);

    if (!subscriptions.length || !manuscript) {
      return Response.json({ skipped: true, reason: 'No subscribers or manuscript not found' });
    }

    const articleUrl = `https://afrisco-nexus.base44.app/ManuscriptDetail?id=${manuscript.id}`;
    const subject = isCitationIncrease
      ? `New citation for: "${manuscript.title?.slice(0, 60)}"`
      : `New comment on: "${manuscript.title?.slice(0, 60)}"`;

    const body_text = isCitationIncrease
      ? `Good news! The article "${manuscript.title}" has received a new citation.\n\nTotal citations: ${newCitationCount}\n\nView the article: ${articleUrl}\n\n---\nYou are receiving this because you subscribed to updates for this article.\nAfriSci Nexus Discovery`
      : `A new comment has been posted on the article "${manuscript.title}".\n\nComment by: ${data?.author_name || 'Anonymous'}\n"${(data?.content || '').slice(0, 200)}${(data?.content || '').length > 200 ? '...' : ''}"\n\nView the article: ${articleUrl}\n\n---\nYou are receiving this because you subscribed to updates for this article.\nAfriSci Nexus Discovery`;

    let sentCount = 0;
    for (const sub of subscriptions) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sub.subscriber_email,
        subject,
        body: body_text,
        from_name: 'AfriSci Nexus Discovery',
      }).catch(() => {});
      sentCount++;
    }

    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});