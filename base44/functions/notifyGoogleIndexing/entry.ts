import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SITEMAP_URL = "https://afriscinexus.com/api/functions/generateSitemap";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && (!user.editor_roles || user.editor_roles.length === 0))) {
      return Response.json({ error: 'Forbidden: Editor access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
    if (!accessToken) {
      return Response.json({ error: 'Google Search Console is not connected' }, { status: 400 });
    }

    // Find the verified site property that matches our domain
    const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const sitesData = await sitesRes.json();
    const site = (sitesData.siteEntry || []).find(s => s.siteUrl.includes("afriscinexus.com"));

    if (!site) {
      return Response.json({ error: 'No verified Search Console property found for afriscinexus.com' }, { status: 404 });
    }

    const submitRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      return Response.json({ success: false, error: `Search Console submit failed: ${errText}` }, { status: submitRes.status });
    }

    return Response.json({ success: true, site: site.siteUrl, sitemap: SITEMAP_URL });
  } catch (error) {
    console.error('notifyGoogleIndexing error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});