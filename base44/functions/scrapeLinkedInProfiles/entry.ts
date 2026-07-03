import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Credit-free LinkedIn/Scholar/ResearchGate discovery: uses DuckDuckGo's public
// HTML search (no API key, no LLM) to find publicly indexed profile pages.
// No AI/integration credits are consumed.

const LINKEDIN_REGEX = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?$/;
const SCHOLAR_REGEX = /^https?:\/\/scholar\.google\.com\/citations\?[^\s"]+$/;
const RESEARCHGATE_REGEX = /^https?:\/\/(www\.)?researchgate\.net\/profile\/[a-zA-Z0-9\-_%.]+\/?$/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AfriSciNexusBot/1.0; +https://afriscinexus.com)' }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function decodeDdgUrl(rawHref) {
  try {
    if (rawHref.startsWith('/l/?')) {
      const params = new URLSearchParams(rawHref.slice(rawHref.indexOf('?') + 1));
      return decodeURIComponent(params.get('uddg') || '');
    }
    return rawHref;
  } catch {
    return rawHref;
  }
}

// Searches DuckDuckGo's HTML endpoint and returns [{url, snippet}]
async function searchWeb(query) {
  const html = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, 5000);
  if (!html) return [];
  const results = [];
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = resultRegex.exec(html)) !== null && results.length < 8) {
    const url = decodeDdgUrl(m[1]);
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    const snippet = m[3].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
    results.push({ url, title, snippet });
  }
  return results;
}

async function findProfileLink(query, urlRegex) {
  const results = await searchWeb(query);
  const match = results.find(r => urlRegex.test(r.url));
  return match || null;
}

// Look up LinkedIn, Scholar and ResearchGate links for a given person/institution.
async function lookupPerson(name, institution) {
  const context = institution ? `"${name}" "${institution}"` : `"${name}"`;
  const [linkedin, scholar, researchgate] = await Promise.all([
    findProfileLink(`${context} site:linkedin.com/in`, LINKEDIN_REGEX),
    findProfileLink(`${context} site:scholar.google.com/citations`, SCHOLAR_REGEX),
    findProfileLink(`${context} site:researchgate.net/profile`, RESEARCHGATE_REGEX),
  ]);
  return {
    linkedin_url: linkedin?.url || null,
    linkedin_headline: linkedin?.snippet || linkedin?.title || null,
    google_scholar_url: scholar?.url || null,
    researchgate_url: researchgate?.url || null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { country, institution_type, batch_size = 30, mode = 'link' } = await req.json();
    if (!country) return Response.json({ error: 'Country is required' }, { status: 400 });

    const filter = { country };
    if (institution_type) filter.institution_type = institution_type;
    const allProspects = await base44.asServiceRole.entities.ProspectEmail.filter(filter);

    let linked = 0;
    let created = 0;
    const details = [];

    if (mode === 'discover') {
      // Discover new academics via institutional search: find LinkedIn profiles
      // at named institutions already present in our data, not yet captured.
      const institutions = [...new Set(allProspects.map(p => p.institution).filter(Boolean))].slice(0, 6);
      const existingEmails = new Set(allProspects.map(p => p.email.toLowerCase()));
      const institutionDesc = institution_type ? institution_type.replace('_', ' ') : 'academic staff';

      for (const institution of institutions) {
        if (created >= batch_size) break;
        const results = await searchWeb(`"${institution}" ${institutionDesc} site:linkedin.com/in`);
        for (const r of results) {
          if (created >= batch_size) break;
          if (!LINKEDIN_REGEX.test(r.url)) continue;
          // LinkedIn result titles look like "Name - Headline - Institution | LinkedIn"
          const namePart = r.title.split(' - ')[0]?.replace(/\| LinkedIn$/i, '').trim();
          if (!namePart) continue;
          const emailMatch = r.snippet.match(EMAIL_REGEX);
          if (!emailMatch) continue; // require a real published email to create a record
          const email = emailMatch[0].toLowerCase();
          if (existingEmails.has(email)) continue;

          await base44.asServiceRole.entities.ProspectEmail.create({
            email,
            contact_name: namePart,
            institution,
            institution_type: institution_type || 'other',
            country,
            linkedin_url: r.url,
            linkedin_headline: r.snippet || null,
            source_url: r.url,
            linkedin_verified_at: new Date().toISOString(),
            campaign_status: 'new'
          });
          existingEmails.add(email);
          created++;
          details.push({ name: namePart, email, linkedin_url: r.url });
        }
      }

      return Response.json({ success: true, mode, linked, created, profiles_found: created, details });
    }

    // Link mode: enrich existing named prospects that have no LinkedIn yet
    const targets = allProspects.filter(p => !p.linkedin_url && p.contact_name).slice(0, batch_size);
    if (targets.length === 0) {
      return Response.json({ message: 'All existing prospects already have LinkedIn profiles linked, or no named contacts found.', linked: 0, created: 0, profiles_found: 0, details: [] });
    }

    const lookups = await Promise.all(targets.map(p => lookupPerson(p.contact_name, p.institution)));

    for (let i = 0; i < targets.length; i++) {
      const prospect = targets[i];
      const found = lookups[i];
      const updates = {};
      if (found.linkedin_url) {
        updates.linkedin_url = found.linkedin_url;
        updates.linkedin_verified_at = new Date().toISOString();
      }
      if (found.linkedin_headline) updates.linkedin_headline = found.linkedin_headline;
      if (found.google_scholar_url) updates.google_scholar_url = found.google_scholar_url;
      if (found.researchgate_url) updates.researchgate_url = found.researchgate_url;

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, updates);
        linked++;
        details.push({ name: prospect.contact_name, email: prospect.email, linkedin_url: updates.linkedin_url || null });
      }
    }

    return Response.json({ success: true, mode, linked, created, profiles_found: targets.length, details });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});