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
    const { email, name, confirmationToken } = await req.json();

    if (!email || !confirmationToken) {
      return Response.json({ error: 'Missing email or confirmation token' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      email,
      confirmation_token: confirmationToken
    });

    if (subscribers.length > 0) {
      await base44.asServiceRole.entities.NewsletterSubscriber.update(subscribers[0].id, {
        is_confirmed: true
      });
    }

    let emailSent = false;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      const subject = 'Welcome to AfriSci Nexus Discovery Newsletter';
      const html = `<p>Dear ${name || 'Reader'},</p>
<p>Your subscription to the AfriSci Nexus Discovery newsletter is now confirmed. You'll receive updates on newly published research across our 12 journals.</p>
<p>Best regards,<br>AfriSci Nexus Discovery</p>`;
      const raw = buildRawEmail({ to: email, subject, body: html });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw })
      });
      emailSent = res.ok;
    } catch (e) {
      console.log(`[Newsletter Confirmation] Gmail send failed: ${e.message}`);
    }

    return Response.json({
      success: true,
      message: emailSent ? 'Subscription confirmed and welcome email sent' : 'Subscription confirmed (welcome email could not be sent)',
      email_sent: emailSent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});