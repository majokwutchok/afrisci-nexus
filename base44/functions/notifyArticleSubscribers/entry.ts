import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildRawEmail({ to, subject, body }) {
  const message = [
    `From: AfriSci Nexus Discovery`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    body
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, old_data } = body;

    // Only act on genuine entity automation events for known entities.
    if (event?.type !== 'update' && event?.type !== 'create') {
      return Response.json({ skipped: true });
    }
    if (event?.entity_name !== 'Manuscript' && event?.entity_name !== 'Comment') {
      return Response.json({ skipped: true });
    }

    const isNewComment = event.entity_name === 'Comment' && event.type === 'create';
    const isManuscriptUpdate = event.entity_name === 'Manuscript' && event.type === 'update';

    // Resolve the manuscript ID from trusted DB records, not the request body,
    // so a forged payload cannot trigger notifications on arbitrary data.
    let manuscriptIdToUse = null;
    let newCitationCount = 0;
    let oldCitationCount = 0;

    if (isNewComment) {
      const comment = await base44.asServiceRole.entities.Comment.get(event.entity_id);
      if (!comment) return Response.json({ skipped: true, reason: 'comment not found' });
      manuscriptIdToUse = comment.manuscript_id;
    } else if (isManuscriptUpdate) {
      const manuscript = await base44.asServiceRole.entities.Manuscript.get(event.entity_id);
      if (!manuscript) return Response.json({ skipped: true, reason: 'manuscript not found' });
      manuscriptIdToUse = manuscript.id;
      newCitationCount = manuscript.citation_count || 0;
      oldCitationCount = old_data?.citation_count || 0;
    }

    if (!manuscriptIdToUse) return Response.json({ skipped: true });

    const isCitationIncrease = isManuscriptUpdate && newCitationCount > oldCitationCount;

    if (!isCitationIncrease && !isNewComment) {
      return Response.json({ skipped: true, reason: 'No relevant change' });
    }

    const subscriptions = await base44.asServiceRole.entities.ArticleSubscription.filter({ manuscript_id: manuscriptIdToUse });

    if (!subscriptions.length) {
      return Response.json({ skipped: true, reason: 'No subscribers' });
    }

    const manuscripts = await base44.asServiceRole.entities.Manuscript.filter({ id: manuscriptIdToUse });
    const manuscript = manuscripts[0];
    const title = manuscript?.title || 'an article you follow';

    const eventLabel = isNewComment ? 'a new comment' : 'a new citation';
    const subject = `Update on "${title}"`;
    const html = `<p>Hello,</p>
<p>There's ${eventLabel} on an article you're subscribed to: <strong>"${title}"</strong>.</p>
<p>Visit AfriSci Nexus Discovery to view the update.</p>
<p>Best regards,<br>AfriSci Nexus Discovery</p>`;

    let sent = 0, errors = 0;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      for (const sub of subscriptions) {
        if (!sub.subscriber_email) continue;
        try {
          const raw = buildRawEmail({ to: sub.subscriber_email, subject, body: html });
          const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw })
          });
          if (res.ok) sent++; else errors++;
        } catch (_e) {
          errors++;
        }
      }
    } catch (e) {
      console.log(`[Article Notification] Gmail connection failed: ${e.message}`);
      return Response.json({ success: false, note: 'Gmail not connected', subscriber_count: subscriptions.length });
    }

    return Response.json({ success: true, subscriber_count: subscriptions.length, sent, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});