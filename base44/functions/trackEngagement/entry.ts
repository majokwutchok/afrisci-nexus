// @ts-nocheck
// AfriSci Nexus readership & impact — generated from functions-src/trackEngagement.ts; edit the source package.
// Base44 backend function: trackEngagement  (public, called by every reader's browser)
// POST { manuscript_id, type: "view" | "read" | "download", visitor, tz, referrer }
//   -> records a ReadershipStats event (country, device, source), de-duplicated per reader
//      for 30 minutes, ignores bots, and atomically increments the article's counters.
// GET  -> { ok, country, source }  diagnostics: which country this request resolves to.
// Uses no Base44 integrations, so it consumes no integration credits.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.57";
import { resolveCountry } from "../../shared/impactCore.ts";
import { recordEvent, json } from "../../shared/impactServer.ts";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  try {
    if (req.method === "GET") {
      const tz = new URL(req.url).searchParams.get("tz") || "";
      return json({ ok: true, ...resolveCountry(req.headers, tz) }, 200, CORS);
    }
    if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405, CORS);
    const payload = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const result = await recordEvent(base44.asServiceRole.entities, req, payload);
    const { status = 200, ...body } = result;
    return json(body, status, CORS);
  } catch (err) {
    console.error("trackEngagement", err);
    return json({ ok: false, error: "tracking failed" }, 500, CORS);
  }
});
