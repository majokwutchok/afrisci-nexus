import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Encode email as RFC 2822 + base64url for Gmail API
function buildRawEmail({ to, subject, body, from_name }) {
  const fromHeader = from_name ? `${from_name} <me>` : 'me';
  const message = [
    `From: ${fromHeader}`,
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

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { to, subject, body, from_name, prospect_id } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Use admin's Google SSO token to send via Gmail API
    const accessToken = await base44.asServiceRole.sso.getAccessToken(user.id);

    const raw = buildRawEmail({ to, subject, body, from_name });

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!gmailRes.ok) {
      const err = await gmailRes.json();
      return Response.json({ error: err?.error?.message || 'Gmail send failed' }, { status: 500 });
    }

    if (prospect_id) {
      await base44.asServiceRole.entities.ProspectEmail.update(prospect_id, { campaign_status: 'emailed' });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});