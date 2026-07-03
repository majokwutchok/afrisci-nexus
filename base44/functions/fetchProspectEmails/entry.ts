import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Free, credit-free contact discovery: uses Wikipedia's public institution
// directory pages + direct HTTP fetches of institution websites. No AI/LLM
// integrations are used, so this never consumes integration credits.

const WIKI_LIST_TITLES = {
  university: (country) => [`List of universities and colleges in ${country}`, `List of universities in ${country}`],
  hospital: (country) => [`List of hospitals in ${country}`],
  research_institute: (country) => [`List of research institutes in ${country}`],
  school: (country) => [`List of schools in ${country}`, `List of secondary schools in ${country}`],
  ngo: (country) => [`List of non-governmental organisations in ${country}`, `List of non-profit organizations in ${country}`],
  government: (country) => [`List of government ministries of ${country}`, `Cabinet of ${country}`],
  professional_association: (country) => [`List of professional associations in ${country}`],
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const IGNORED_DOMAINS = [
  'aol.com', 'icloud.com',
  'example.com', 'sentry.io', 'wixpress.com', 'wix.com', 'godaddy.com'
];
const WIKIMEDIA_FAMILY = [
  'wikipedia.org', 'wikimedia.org', 'wikimediafoundation.org', 'mediawiki.org', 'wikidata.org',
  'wikibooks.org', 'wikinews.org', 'wikiquote.org', 'wikisource.org', 'wikiversity.org',
  'wikivoyage.org', 'wiktionary.org', 'archive.org'
];
const BANNED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.css', '.js'];

async function fetchWithTimeout(url, ms = 4000) {
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

const SKIP_TITLE_PATTERNS = [
  'list of', 'category:', 'template:', 'wikipedia:', 'help:', 'portal:', 'file:',
  'education in', 'higher education', 'international standard', 'national universities commission',
  'ministry of'
];

const KEYWORDS_BY_TYPE = {
  university: ['university', 'college', 'polytechnic', 'institute of technology'],
  hospital: ['hospital', 'medical centre', 'medical center', 'clinic', 'health centre', 'health center'],
  research_institute: ['institute', 'research', 'centre for', 'center for'],
  school: ['school', 'academy', 'college'],
  ngo: ['foundation', 'trust', 'association', 'ngo', 'organisation', 'organization', 'network', 'alliance'],
  government: ['ministry', 'department', 'commission', 'authority', 'agency', 'bureau'],
  professional_association: ['association', 'society', 'institute', 'council', 'federation', 'union'],
};

// Personal free-mail providers we now also capture as individual contacts,
// separate from an institution's own domain emails.
const PERSONAL_EMAIL_PROVIDERS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];

function extractInstitutionArticles(html, institutionType) {
  const contentStart = html.indexOf('id="mw-content-text"');
  const content = contentStart >= 0 ? html.slice(contentStart) : html;
  const linkRegex = /<a href="\/wiki\/([^":#]+)"[^>]*title="([^"]+)">([^<]*)<\/a>/g;
  const keywords = KEYWORDS_BY_TYPE[institutionType] || [];
  const found = [];
  const seenTitles = new Set();
  let m;
  while ((m = linkRegex.exec(content)) !== null && found.length < 40) {
    const articlePath = m[1];
    const title = m[2].replace(/&amp;/g, '&').trim();
    const lower = title.toLowerCase();
    if (seenTitles.has(title)) continue;
    if (SKIP_TITLE_PATTERNS.some(p => lower.includes(p))) continue;
    if (keywords.length > 0 && !keywords.some(k => lower.includes(k))) continue;
    seenTitles.add(title);
    found.push({ articlePath, title });
  }
  return found;
}

async function resolveInstitutionWebsite(articlePath) {
  const html = await fetchWithTimeout(`https://en.wikipedia.org/wiki/${articlePath}`, 5000);
  if (!html) return null;
  const infoboxMatch = html.match(/(?:Website|Official website)<\/th>\s*<td[^>]*>[\s\S]{0,300}?href="(https?:\/\/[^"]+)"/i);
  if (!infoboxMatch) return null;
  try {
    const domain = new URL(infoboxMatch[1]).hostname.replace(/^www\./, '');
    if (WIKIMEDIA_FAMILY.some(d => domain === d || domain.endsWith(`.${d}`))) return null;
    return domain;
  } catch {
    return null;
  }
}

function extractEmailsFromHtml(html, institutionDomain) {
  const results = [];
  const seen = new Set();

  const mailtoRegex = /<a[^>]+href="mailto:([^"?]+)"[^>]*>([^<]*)<\/a>/g;
  let m;
  while ((m = mailtoRegex.exec(html)) !== null) {
    const email = m[1].trim().toLowerCase();
    if (!seen.has(email)) { seen.add(email); results.push({ email, name: m[2].trim() || null }); }
  }

  const matches = html.match(EMAIL_REGEX) || [];
  for (const raw of matches) {
    const email = raw.toLowerCase();
    if (!seen.has(email)) { seen.add(email); results.push({ email, name: null }); }
  }

  return results.filter(r => {
    const domain = r.email.split('@')[1] || '';
    if (IGNORED_DOMAINS.includes(domain)) return false;
    if (BANNED_EXTENSIONS.some(ext => domain.endsWith(ext))) return false;
    // Keep emails on the institution's own domain, plus personal-provider
    // addresses (gmail/yahoo/hotmail/etc.) published for individual contacts.
    if (domain === institutionDomain || domain.endsWith(`.${institutionDomain}`)) return true;
    return PERSONAL_EMAIL_PROVIDERS.includes(domain);
  });
}

async function scanInstitution(inst) {
  const domain = await resolveInstitutionWebsite(inst.articlePath);
  if (!domain) return [];

  const paths = ['', '/contact', '/contact-us'];
  for (const path of paths) {
    const html = await fetchWithTimeout(`https://${domain}${path}`, 4000);
    if (!html) continue;
    const emails = extractEmailsFromHtml(html, domain);
    if (emails.length > 0) {
      return emails.map(e => ({
        email: e.email,
        contact_name: e.name,
        institution: inst.title,
        department: null,
        source_url: `https://${domain}${path}`
      }));
    }
  }
  return [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { country, institution_type, page = 1 } = await req.json();
    if (!country) return Response.json({ error: 'Country is required' }, { status: 400 });

    const titleFn = WIKI_LIST_TITLES[institution_type];
    if (!titleFn) {
      return Response.json({
        error: `Free web discovery currently covers "university", "hospital", "research_institute", "school", "ngo", "government" and "professional_association". "${institution_type}" isn't supported yet.`
      }, { status: 400 });
    }

    let html = null;
    for (const title of titleFn(country)) {
      html = await fetchWithTimeout(`https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`, 6000);
      if (html) break;
    }
    if (!html) {
      return Response.json({ error: `No public institution directory found for ${country}. Try a different country.` }, { status: 404 });
    }

    const allInstitutions = extractInstitutionArticles(html, institution_type);
    const PAGE_SIZE = 5;
    const offset = (page - 1) * PAGE_SIZE;
    const institutions = allInstitutions.slice(offset, offset + PAGE_SIZE);

    if (institutions.length === 0) {
      return Response.json({
        emails: [], saved_count: 0, duplicates_skipped: 0, invalid_skipped: 0,
        country, institution_type,
        note: 'No more institutions found on this page. Try page 1 or a different country.'
      });
    }

    const scanResults = await Promise.all(institutions.map(inst => scanInstitution(inst)));
    const foundEmails = scanResults.flat();

    const seen = new Set();
    const validEmails = foundEmails.filter(entry => {
      if (!entry.email || !STRICT_EMAIL_REGEX.test(entry.email)) return false;
      if (seen.has(entry.email)) return false;
      seen.add(entry.email);
      return true;
    });

    const existing = await base44.asServiceRole.entities.ProspectEmail.filter({ country });
    const existingSet = new Set(existing.map(e => e.email.toLowerCase()));
    const newEmails = validEmails.filter(e => !existingSet.has(e.email));

    if (newEmails.length > 0) {
      await base44.asServiceRole.entities.ProspectEmail.bulkCreate(
        newEmails.map(e => ({
          email: e.email,
          contact_name: e.contact_name || null,
          institution: e.institution || null,
          department: e.department || null,
          institution_type,
          country,
          source_url: e.source_url || null,
          campaign_status: 'new'
        }))
      );
    }

    return Response.json({
      emails: newEmails,
      saved_count: newEmails.length,
      duplicates_skipped: validEmails.length - newEmails.length,
      invalid_skipped: foundEmails.length - validEmails.length,
      institutions_scanned: institutions.map(i => i.title),
      country,
      institution_type
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});