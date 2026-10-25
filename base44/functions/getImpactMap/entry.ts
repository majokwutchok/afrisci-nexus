// @ts-nocheck
// AfriSci Nexus readership & impact — generated from functions-src/getImpactMap.ts; edit the source package.
// Base44 backend function: getImpactMap  (public, used by the homepage Global Research Impact map)
// Returns real readership by country, citation and collaboration links, live recent activity and
// totals. Cached for 15 seconds; citations refresh from OpenAlex + Crossref every 12 hours.
// Uses no Base44 integrations, so it consumes no integration credits.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.57";
import { buildImpact, json } from "../../shared/impactServer.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let force = false;
    if (req.method === "POST") {
      const p = await req.json().catch(() => ({}));
      if (p?.refresh) {
        // Only an admin may force a recompute and citation refresh.
        try { force = (await base44.auth.me())?.role === "admin"; } catch (_) { force = false; }
      }
    }
    const data = await buildImpact(base44.asServiceRole.entities, { force });
    return json({ ok: true, ...data }, 200, { "cache-control": "public, max-age=30" });
  } catch (err) {
    console.error("getImpactMap", err);
    return json({ ok: false, error: "impact data unavailable" }, 500);
  }
});
