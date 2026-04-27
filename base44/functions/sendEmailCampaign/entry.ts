import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Injects a tracking pixel and wraps links for click tracking
function injectTracking(html, campaignId, recipientEmail, baseUrl) {
  const encoded = encodeURIComponent(recipientEmail);

  // Replace links with tracked versions
  const trackedHtml = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      const trackedUrl = `${baseUrl}/trackEmailEvent?event=click&campaign_id=${campaignId}&email=${encoded}&url=${encodeURIComponent(url)}`;
      return `href="${trackedUrl}"`;
    }
  );

  // Append tracking pixel
  const pixel = `<img src="${baseUrl}/trackEmailEvent?event=open&campaign_id=${campaignId}&email=${encoded}" width="1" height="1" style="display:none" alt="" />`;
  return trackedHtml.replace('</body>', `${pixel}</body>`) + (trackedHtml.includes('</body>') ? '' : pixel);
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { campaign_id } = await req.json();
  if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

  // Load campaign
  const campaigns = await base44.asServiceRole.entities.EmailCampaign.filter({ id: campaign_id });
  const campaign = campaigns[0];
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.status === 'sending' || campaign.status === 'sent') {
    return Response.json({ error: 'Campaign already sent or sending' }, { status: 400 });
  }

  // Load prospects
  const filter = { country: campaign.country };
  if (campaign.institution_type) filter.institution_type = campaign.institution_type;
  const prospects = await base44.asServiceRole.entities.ProspectEmail.filter(filter);
  const newProspects = prospects.filter(p => p.campaign_status === 'new');

  if (newProspects.length === 0) {
    return Response.json({ error: 'No new prospects found for this country/type' }, { status: 400 });
  }

  // Mark campaign as sending
  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'sending',
    sent_at: new Date().toISOString(),
    total_recipients: newProspects.length,
    sent_count: 0,
    open_count: 0,
    click_count: 0,
    error_count: 0
  });

  const baseUrl = 'https://afriscinexus.com/api/functions';

  let sentCount = 0;
  let errorCount = 0;

  // Send in batches of 10 with small delay to avoid rate limits
  for (let i = 0; i < newProspects.length; i++) {
    const prospect = newProspects[i];
    try {
      const personalizedHtml = injectTracking(
        campaign.body_html
          .replace(/\{\{name\}\}/g, prospect.contact_name || 'Colleague')
          .replace(/\{\{institution\}\}/g, prospect.institution || 'Your Institution')
          .replace(/\{\{country\}\}/g, prospect.country || ''),
        campaign_id,
        prospect.email,
        baseUrl
      );

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: prospect.email,
        subject: campaign.subject,
        body: personalizedHtml,
        from_name: campaign.from_name || 'AfriSci Nexus Editorial Team'
      });

      // Log sent event
      await base44.asServiceRole.entities.EmailCampaignTrack.create({
        campaign_id,
        prospect_email: prospect.email,
        event_type: 'sent'
      });

      // Mark prospect as emailed
      await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, {
        campaign_status: 'emailed'
      });

      sentCount++;

      // Update campaign progress every 10 emails
      if (sentCount % 10 === 0) {
        await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
          sent_count: sentCount
        });
      }

      // Small delay every 10 sends
      if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error(`Failed to send to ${prospect.email}:`, err.message);
      errorCount++;
    }
  }

  // Mark as sent
  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'sent',
    sent_count: sentCount,
    error_count: errorCount
  });

  return Response.json({ success: true, sent: sentCount, errors: errorCount, total: newProspects.length });
});