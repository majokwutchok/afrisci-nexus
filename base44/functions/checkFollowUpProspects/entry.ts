import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FOLLOW_UP_TEMPLATE = (name, institution) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <div style="background:linear-gradient(135deg,#1e3a8a,#0d9488);padding:32px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:26px;letter-spacing:-0.5px">AfriSci Nexus Discovery</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">12 Peer-Reviewed Journals · Africa's Premier Open-Access Platform</p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
    <p>Dear ${name},</p>
    <p>I wanted to follow up on my previous note about <strong>AfriSci Nexus Discovery</strong> and the publishing opportunities available for researchers at <strong>${institution}</strong>.</p>
    <p>I understand you're busy, so I'll be brief — we've had significant interest from institutions across Africa in our <strong>12 open-access peer-reviewed journals</strong>, and I believe there's a strong fit with your work.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0">
      <strong>🎯 Here's what I'd love to explore with you:</strong><br/><br/>
      • Publishing your latest research with a rapid 4–6 week review cycle<br/>
      • A waived or discounted APC for your institution<br/>
      • Co-branding your institution on every published article<br/>
      • Access to real-time citation and readership analytics
    </div>
    <p>Would you be open to a 15-minute conversation this week? Alternatively, feel free to reply with any questions — I'm happy to help.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="https://afriscinexus.com/InstitutionalPartnership" style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Learn More →</a>
    </div>
    <p style="font-style:italic;color:#64748b;font-size:13px">"AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally."</p>
    <p>Warm regards,<br><strong>Majok Wutchok</strong><br>Founder &amp; CEO, AfriSci Nexus Discovery<br><a href="mailto:editorial@afriscinexus.com" style="color:#0d9488">editorial@afriscinexus.com</a></p>
  </div>
  <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:11px;color:#94a3b8;border:1px solid #e2e8f0;border-top:none">
    AfriSci Nexus Discovery &nbsp;·&nbsp; 12 Peer-Reviewed Journals &nbsp;·&nbsp; <a href="https://afriscinexus.com" style="color:#0d9488">afriscinexus.com</a>
    <br/><a href="#" style="color:#94a3b8;font-size:10px">Unsubscribe</a>
  </div>
</div>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // Find prospects that: were emailed, opened an email, NOT replied, NOT already followed up within 5 days
    const prospects = await base44.asServiceRole.entities.ProspectEmail.filter({
      campaign_status: 'emailed'
    }, '-last_opened_at', 500);

    const eligible = prospects.filter(p => {
      if (!p.last_opened_at) return false; // never opened
      if (p.campaign_status === 'responded') return false; // already replied
      if (p.campaign_status === 'unsubscribed') return false;
      if (p.follow_up_sent_at && p.follow_up_sent_at > fiveDaysAgo) return false; // recently followed up
      // opened more than 5 days ago and no response
      return p.last_opened_at <= fiveDaysAgo;
    });

    if (eligible.length === 0) {
      return Response.json({ success: true, checked: prospects.length, followed_up: 0, message: 'No eligible prospects' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    let followed_up = 0;
    let errors = 0;

    for (const prospect of eligible) {
      const name = prospect.contact_name || 'Colleague';
      const institution = prospect.institution || 'your institution';
      const subject = `Following up — AfriSci Nexus Discovery & ${institution}`;
      const body = FOLLOW_UP_TEMPLATE(name, institution);

      const message = [
        `From: Majok Wutchok <editorial@afriscinexus.com>`,
        `To: ${prospect.email}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        body
      ].join('\r\n');

      const raw = btoa(unescape(encodeURIComponent(message)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw })
      });

      if (gmailRes.ok) {
        await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, {
          follow_up_sent_at: new Date().toISOString(),
          follow_up_count: (prospect.follow_up_count || 0) + 1
        });
        followed_up++;
      } else {
        errors++;
      }
    }

    return Response.json({ success: true, checked: prospects.length, eligible: eligible.length, followed_up, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});