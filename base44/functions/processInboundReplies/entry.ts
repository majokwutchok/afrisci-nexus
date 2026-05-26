import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function decodeBody(data) {
  if (!data) return '';
  return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
}

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

function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

// Keyword-based sentiment analysis — no LLM required
function analyzeSentiment(text, subject) {
  const combined = `${subject} ${text}`.toLowerCase();

  if (/unsubscribe|remove me|stop email|opt.?out|no longer wish|please remove/i.test(combined)) {
    return {
      sentiment: 'unsubscribe_request',
      summary: 'Recipient requested to be removed from mailing list.',
      suggested_action: 'Remove from prospect list immediately.',
      key_quote: null
    };
  }

  if (/out of office|auto.?reply|vacation|on leave|holiday|away from|currently unavailable|will return/i.test(combined)) {
    return {
      sentiment: 'auto_reply',
      summary: 'Automated out-of-office reply detected.',
      suggested_action: 'No action needed — follow up after their return.',
      key_quote: null
    };
  }

  if (/not interested|no thank|decline|not relevant|too busy|unfortunately|don.t|cannot|not at this time|no longer/i.test(combined)) {
    return {
      sentiment: 'not_interested',
      summary: 'Recipient expressed disinterest or declined.',
      suggested_action: 'Mark as not interested. Do not follow up.',
      key_quote: null
    };
  }

  if (/yes|interested|love to|sounds great|happy to|would like|looking forward|please send|tell me more|schedule|call|collaborate|partnership|submit|review|sign up/i.test(combined)) {
    return {
      sentiment: 'interested',
      summary: 'Recipient expressed positive interest or agreed to next steps.',
      suggested_action: 'Follow up promptly with relevant information.',
      key_quote: null
    };
  }

  return {
    sentiment: 'needs_follow_up',
    summary: 'Reply received — intent unclear. Manual review recommended.',
    suggested_action: 'Review manually and determine appropriate follow-up.',
    key_quote: null
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const messageIds = body.data?.new_message_ids ?? [];

  if (!messageIds.length) {
    return Response.json({ skipped: true, reason: 'no new messages' });
  }

  let accessToken;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection('gmail');
    accessToken = conn?.accessToken;
  } catch (_) {
    return Response.json({ skipped: true, reason: 'Gmail connector not available' });
  }

  if (!accessToken) {
    return Response.json({ skipped: true, reason: 'Gmail access token unavailable' });
  }

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

    const isReply = !!(inReplyTo || references);
    if (!isReply) { skipped++; continue; }

    const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : '';
    if (!senderEmail) { skipped++; continue; }

    const prospects = await base44.asServiceRole.entities.ProspectEmail.filter({ email: senderEmail });
    const prospect = prospects[0];
    const outreaches = await base44.asServiceRole.entities.PersonalizedOutreach.filter({ prospect_email: senderEmail });
    const outreach = outreaches.find(o => o.status === 'sent');

    if (!prospect && !outreach) { skipped++; continue; }

    const bodyText = extractText(message.payload).slice(0, 2000);

    // Keyword-based analysis (no LLM required)
    const analysis = analyzeSentiment(bodyText, subject);
    const { sentiment } = analysis;

    const statusMap = {
      interested: 'responded',
      not_interested: 'unsubscribed',
      needs_follow_up: 'responded',
      auto_reply: null,
      unsubscribe_request: 'unsubscribed'
    };
    const newStatus = statusMap[sentiment];

    await base44.asServiceRole.entities.InboundReply.create({
      gmail_message_id: messageId,
      sender_email: senderEmail,
      sender_name: fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '') || senderEmail,
      subject,
      body_preview: bodyText.slice(0, 500),
      prospect_id: prospect?.id || null,
      outreach_id: outreach?.id || null,
      sentiment,
      summary: analysis.summary,
      suggested_action: analysis.suggested_action,
      key_quote: analysis.key_quote || null,
      is_auto_reply: sentiment === 'auto_reply'
    });

    if (prospect && newStatus) {
      await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, { campaign_status: newStatus });
    }

    if (outreach && sentiment !== 'auto_reply') {
      await base44.asServiceRole.entities.PersonalizedOutreach.update(outreach.id, {
        status: 'replied',
        replied_at: new Date().toISOString()
      });
    }

    processed++;
    if (prospect || outreach) matched++;
  }

  return Response.json({ success: true, processed, matched, skipped });
});