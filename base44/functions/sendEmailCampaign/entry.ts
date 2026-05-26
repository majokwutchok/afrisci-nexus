import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

  // Mark campaign as queued — email delivery unavailable
  await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
    status: 'paused',
    total_recipients: newProspects.length,
    sent_count: 0,
    error_count: 0
  });

  console.log(`[Email Campaign] Campaign "${campaign.name}" queued for ${newProspects.length} prospects. Email delivery temporarily unavailable.`);

  return Response.json({
    success: false,
    note: 'Email delivery is temporarily unavailable. Campaign has been queued and will be sent when the email service is restored. No emails were sent.',
    queued_recipients: newProspects.length,
    sent: 0
  });
});