import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildRawEmail({ to, subject, body, from_name }) {
  const message = [
    `From: ${from_name || 'AfriSci Nexus Editorial Team'}`,
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
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { campaign_id } = await req.json();
  if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

  const campaigns = await base44.asServiceRole.entities.EmailCampaign.filter({ id: campaign_id });
  const campaign = campaigns[0];
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.status === 'sending' || campaign.status === 'sent') {
    return Response.json({ error: 'Campaign already sent or sending' }, { status: 400 });
  }

  const filter = { country: campaign.country };
  if (campaign.institution_type) filter.institution_type = campaign.institution_type;
  const prospects = await base44.asServiceRole.entities.ProspectEmail.filter(filter);
  const newProspects = prospects.filter(p => p.campaign_status === 'new');

  if (newProspects.length === 0) {
    return Response.json({ error: 'No new prospects found for this country/type' }, { status: 400 });
  }

  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'sending',
    total_recipients: newProspects.length,
    sent_count: 0,
    error_count: 0
  });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  let sentCount = 0;
  let errorCount = 0;

  for (const prospect of newProspects) {
    try {
      const raw = buildRawEmail({
        to: prospect.email,
        subject: campaign.subject,
        body: campaign.body_html,
        from_name: campaign.from_name
      });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw })
      });
      if (!res.ok) throw new Error((await res.json())?.error?.message || 'Gmail send failed');
      await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, { campaign_status: 'emailed' });
      sentCount++;
    } catch (error) {
      console.log(`[Email Campaign] Failed to send to ${prospect.email}: ${error.message}`);
      errorCount++;
    }
  }

  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_count: sentCount,
    error_count: errorCount
  });

  return Response.json({
    success: true,
    sent: sentCount,
    errors: errorCount
  });
});