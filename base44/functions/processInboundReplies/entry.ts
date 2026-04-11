import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Decode base64url Gmail body
function decodeBody(data) {
  if (!data) return '';
  return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
}

// Extract plain text from Gmail message parts recursively
function extractText(payload) {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBody(payload.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractText(part);
      if (text) return text;
    }
  }
  return '';
}

// Get header value from Gmail message
function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const messageIds = body.data?.new_message_ids ?? [];

  if (!messageIds.length) {
    return Response.json({ skipped: true, reason: 'no new messages' });
  }

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  let processed = 0, matched = 0, skipped = 0;

  for (const messageId of messageIds) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: authHeader }
    );
    if (!res.ok) { skipped++; continue; }
    const message = await res.json();

    const headers = message.payload?.headers || [];
    const fromHeader = getHeader(headers, 'from');
    const subject = getHeader(headers, 'subject');
    const inReplyTo = getHeader(headers, 'in-reply-to');
    const references = getHeader(headers, 'references');

    // Only process replies (must have In-Reply-To or References headers)
    const isReply = !!(inReplyTo || references);
    if (!isReply) { skipped++; continue; }

    // Extract sender email
    const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : '';
    if (!senderEmail) { skipped++; continue; }

    // Look up the prospect by email
    const prospects = await base44.asServiceRole.entities.ProspectEmail.filter({ email: senderEmail });
    const prospect = prospects[0];

    // Also check PersonalizedOutreach for sent emails to this address
    const outreaches = await base44.asServiceRole.entities.PersonalizedOutreach.filter({ prospect_email: senderEmail });
    const outreach = outreaches.find(o => o.status === 'sent');

    if (!prospect && !outreach) { skipped++; continue; }

    // Extract email body text for sentiment analysis
    const bodyText = extractText(message.payload).slice(0, 2000);

    // AI sentiment analysis
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this email reply from an academic/professional to an outreach email from AfriSci Nexus (an African academic publishing platform).

FROM: ${fromHeader}
SUBJECT: ${subject}
BODY:
${bodyText}

Categorize this reply:
1. sentiment: one of "interested", "not_interested", "needs_follow_up", "auto_reply", "unsubscribe_request"
   - interested: expresses positive interest, asks questions, wants to learn more, agrees to collaborate
   - not_interested: politely declines, says not relevant, too busy, not applicable
   - needs_follow_up: unclear intent, asks for more info, deferred response, generic acknowledgment
   - auto_reply: out-of-office, vacation, auto-generated response
   - unsubscribe_request: asks to be removed, stop emailing, unsubscribe

2. summary: one sentence summarizing what they said (max 20 words)
3. suggested_action: what the team should do next (max 15 words)
4. key_quote: the most telling sentence from their reply (max 30 words, or null)

Return JSON only.`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          sentiment: { type: 'string' },
          summary: { type: 'string' },
          suggested_action: { type: 'string' },
          key_quote: { type: 'string' }
        }
      }
    });

    const sentiment = analysis?.sentiment || 'needs_follow_up';

    // Map sentiment to campaign_status
    const statusMap = {
      interested: 'responded',
      not_interested: 'unsubscribed',
      needs_follow_up: 'responded',
      auto_reply: null, // don't change status for auto-replies
      unsubscribe_request: 'unsubscribed'
    };
    const newStatus = statusMap[sentiment];

    // Save the inbound reply record
    await base44.asServiceRole.entities.InboundReply.create({
      gmail_message_id: messageId,
      sender_email: senderEmail,
      sender_name: fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '') || senderEmail,
      subject,
      body_preview: bodyText.slice(0, 500),
      prospect_id: prospect?.id || null,
      outreach_id: outreach?.id || null,
      sentiment,
      summary: analysis?.summary || '',
      suggested_action: analysis?.suggested_action || '',
      key_quote: analysis?.key_quote || null,
      is_auto_reply: sentiment === 'auto_reply'
    });

    // Update ProspectEmail status
    if (prospect && newStatus) {
      await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, { campaign_status: newStatus });
    }

    // Update PersonalizedOutreach status
    if (outreach && sentiment !== 'auto_reply') {
      await base44.asServiceRole.entities.PersonalizedOutreach.update(outreach.id, {
        status: 'replied',
        replied_at: new Date().toISOString()
      });
    }

    processed++;
    if (prospect || outreach) matched++;
  }

  console.log(`Processed ${processed} replies, matched ${matched} prospects, skipped ${skipped}`);
  return Response.json({ success: true, processed, matched, skipped });
});