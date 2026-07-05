import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildRawEmail({ to, subject, body }) {
  const message = [
    `From: AfriSci Nexus Editorial Team`,
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

    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const manuscript = data;
    if (!manuscript || !manuscript.id) {
      return Response.json({ error: 'No manuscript data' }, { status: 400 });
    }

    if (manuscript.status !== 'submitted') {
      return Response.json({ skipped: true, reason: 'Not a submitted manuscript' });
    }

    const correspondingAuthor = (manuscript.authors || []).find(a => a.is_corresponding) || manuscript.authors?.[0];
    const authorEmail = correspondingAuthor?.email || manuscript.created_by;

    let emailSent = false;
    if (authorEmail) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const subject = `Submission Received: ${manuscript.title}`;
        const html = `<p>Dear ${correspondingAuthor?.name || 'Author'},</p>
<p>Thank you for submitting your manuscript <strong>"${manuscript.title}"</strong> to AfriSci Nexus Discovery.</p>
<p>Your submission has been received and will now enter our editorial review process. We will notify you of any status updates.</p>
<p>Best regards,<br>AfriSci Nexus Editorial Team</p>`;
        const raw = buildRawEmail({ to: authorEmail, subject, body: html });
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw })
        });
        emailSent = res.ok;
      } catch (e) {
        console.log(`[Submission Confirmation] Gmail send failed: ${e.message}`);
      }
    }

    const existingTimeline = manuscript.timeline || [];
    const alreadyLogged = existingTimeline.some(t => t.status === 'submitted' && t.comment?.includes('confirmed'));
    if (!alreadyLogged) {
      await base44.asServiceRole.entities.Manuscript.update(manuscript.id, {
        timeline: [
          ...existingTimeline,
          {
            status: 'submitted',
            date: new Date().toISOString().split('T')[0],
            actor: 'system',
            comment: emailSent ? 'Submission confirmed. Author notification sent.' : 'Submission confirmed. Author notification could not be sent.'
          }
        ]
      });
    }

    return Response.json({ success: true, email_sent: emailSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});