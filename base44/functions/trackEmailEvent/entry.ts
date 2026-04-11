import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Transparent 1x1 GIF for open tracking pixel
const PIXEL = new Uint8Array([
  71,73,70,56,57,97,1,0,1,0,128,0,0,255,255,255,0,0,0,33,249,4,0,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59
]);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const event = url.searchParams.get('event');
  const campaign_id = url.searchParams.get('campaign_id');
  const email = url.searchParams.get('email');
  const link_url = url.searchParams.get('url');

  // No auth needed — this is called by email clients
  if (campaign_id && email && event) {
    const base44 = createClientFromRequest(req);

    // Log event (fire and forget — don't await to keep response fast)
    base44.asServiceRole.entities.EmailCampaignTrack.create({
      campaign_id,
      prospect_email: decodeURIComponent(email),
      event_type: event === 'click' ? 'clicked' : 'opened',
      link_url: link_url ? decodeURIComponent(link_url) : undefined,
      user_agent: req.headers.get('user-agent') || undefined
    }).then(async () => {
      // Increment counter on campaign
      const campaigns = await base44.asServiceRole.entities.EmailCampaign.filter({ id: campaign_id });
      if (campaigns[0]) {
        const field = event === 'click' ? 'click_count' : 'open_count';
        await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
          [field]: (campaigns[0][field] || 0) + 1
        });
      }
    }).catch(() => {});
  }

  // For open events: return tracking pixel
  if (event === 'open') {
    return new Response(PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  }

  // For click events: redirect to actual URL
  if (event === 'click' && link_url) {
    return Response.redirect(decodeURIComponent(link_url), 302);
  }

  return Response.json({ ok: true });
});