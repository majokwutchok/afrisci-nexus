import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Server-rendered article landing page for crawlers (Google Scholar, Googlebot).
// Google Scholar does NOT execute JavaScript, so the citation_* / dc.* meta tags
// must be present in the raw HTML. This endpoint returns a complete HTML document
// with all scholarly citation tags baked into <head>, plus the abstract as visible
// body text, so Scholar can parse and index the article. Public (no auth).
const BASE_URL = "https://afriscinexus.com";

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function meta(name, content) { return content ? `<meta name="${esc(name)}" content="${esc(content)}" />` : ''; }
function metaProp(prop, content) { return content ? `<meta property="${esc(prop)}" content="${esc(content)}" />` : ''; }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }
    if (!id) return new Response('Missing article id', { status: 400 });

    const m = await base44.asServiceRole.entities.Manuscript.get(id);
    if (!m) return new Response('Article not found', { status: 404 });

    if (!['published', 'online_first'].includes(m.status)) {
      return new Response('Article not publicly available', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
    }

    let journal = null;
    if (m.journal_id) journal = await base44.asServiceRole.entities.Journal.get(m.journal_id).catch(() => null);

    const articleUrl = `${BASE_URL}/functions/articleCrawlerPage?id=${m.id}`;
    const realPageUrl = `${BASE_URL}/ManuscriptDetail?id=${m.id}`;
    const pubDate = m.publication_date || (m.online_first_date || m.created_date || '').toString().split('T')[0] || '';
    const image = m.cover_image_url || 'https://media.base44.com/images/public/689712620d81bb990dd76bb3/21f8643a1_generated_image.png';
    // Scholar requires citation_pdf_url to be a crawlable http(s) PDF URL.
    // Stored manuscript files may be base64 data URIs (not crawlable) — skip those.
    const rawFile = m.manuscript_file_url || '';
    const pdfUrl = rawFile.startsWith('http') ? rawFile : '';

    const authorTags = (m.authors || []).map(a => {
      let t = `<meta name="citation_author" content="${esc(a.name)}" />`;
      if (a.affiliation) t += `\n    <meta name="citation_author_institution" content="${esc(a.affiliation)}" />`;
      if (a.orcid) { const o = a.orcid.startsWith('http') ? a.orcid : `https://orcid.org/${a.orcid}`; t += `\n    <meta name="citation_author_orcid" content="${esc(o)}" />`; }
      return t;
    }).join('\n    ');
    const kwTags = (m.keywords || []).map(k => `<meta name="citation_keywords" content="${esc(k)}" />`).join('\n    ');
    const dcCreator = (m.authors || []).map(a => `<meta name="dc.creator" content="${esc(a.name)}" />`).join('\n    ');
    const dcSubject = (m.keywords || []).map(k => `<meta name="dc.subject" content="${esc(k)}" />`).join('\n    ');

    const jsonLd = {
      "@context": "https://schema.org", "@type": "ScholarlyArticle",
      "headline": m.title, "abstract": m.abstract, "datePublished": pubDate,
      "author": (m.authors || []).map(a => ({ "@type": "Person", "name": a.name })),
      "publisher": { "@type": "Organization", "name": "AfriSci Nexus" },
      "isPartOf": journal?.title ? { "@type": "Periodical", "name": journal.title, "issn": journal.issn } : undefined,
      "keywords": (m.keywords || []).join(', '),
      "url": articleUrl, "mainEntityOfPage": articleUrl,
      "identifier": m.doi ? `https://doi.org/${m.doi}` : undefined,
      "image": image
    };

    const head = [
      `<title>${esc(m.title)} — AfriSci Nexus</title>`,
      `<link rel="canonical" href="${esc(articleUrl)}" />`,
      `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
      `<meta name="description" content="${esc((m.abstract || '').substring(0, 280))}" />`,
      meta('citation_title', m.title),
      meta('citation_publisher', 'AfriSci Nexus'),
      meta('citation_publication_date', pubDate),
      meta('citation_journal_title', journal?.title),
      meta('citation_issn', journal?.issn),
      meta('citation_language', m.language || 'en'),
      meta('citation_abstract_html_url', articleUrl),
      meta('citation_fulltext_html_url', articleUrl),
      m.doi ? meta('citation_doi', m.doi) : '',
      pdfUrl ? meta('citation_pdf_url', pdfUrl) : '',
      authorTags,
      kwTags,
      meta('dc.title', m.title),
      meta('dc.publisher', 'AfriSci Nexus'),
      `<meta name="dc.date" content="${esc(pubDate)}" scheme="W3CDTF" />`,
      meta('dc.type', 'Text'),
      meta('dc.format', 'application/pdf'),
      meta('dc.language', m.language || 'en'),
      meta('dc.description', m.abstract),
      meta('dc.rights', 'https://creativecommons.org/licenses/by/4.0/'),
      meta('dc.identifier', articleUrl),
      m.doi ? meta('dc.identifier', `https://doi.org/${m.doi}`) : '',
      journal?.title ? meta('dc.source', journal.title) : '',
      journal?.issn ? meta('dc.relation', `urn:issn:${journal.issn}`) : '',
      dcCreator,
      dcSubject,
      metaProp('og:title', `${m.title} — AfriSci Nexus`),
      metaProp('og:type', 'article'),
      metaProp('og:url', articleUrl),
      metaProp('og:description', (m.abstract || '').substring(0, 280)),
      metaProp('og:site_name', 'AfriSci Nexus'),
      metaProp('og:image', image),
      `<script type="application/ld+json">${esc(JSON.stringify(jsonLd))}</script>`
    ].filter(Boolean).join('\n    ');

    const authorsHtml = (m.authors || []).map(a => `${esc(a.name)}${a.affiliation ? ` (${esc(a.affiliation)})` : ''}`).join(', ');
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${head}
</head>
<body>
  <article>
    <h1>${esc(m.title)}</h1>
    <p class="authors">${authorsHtml}</p>
    <p class="journal">${journal?.title ? esc(journal.title) : 'AfriSci Nexus'}${journal?.issn ? ` &middot; ISSN ${esc(journal.issn)}` : ''}</p>
    ${m.doi ? `<p>DOI: <a href="https://doi.org/${esc(m.doi)}">https://doi.org/${esc(m.doi)}</a></p>` : ''}
    ${pubDate ? `<p>Published: ${esc(pubDate)}</p>` : ''}
    <h2>Abstract</h2>
    <p class="abstract">${esc(m.abstract || '')}</p>
    ${(m.keywords || []).length ? `<p><strong>Keywords:</strong> ${(m.keywords || []).map(esc).join(', ')}</p>` : ''}
    <p><a href="${esc(realPageUrl)}">Read full article &rsaquo;</a></p>
  </article>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
    });
  } catch (e) {
    console.error('articleCrawlerPage error:', e.message);
    return new Response('Error: ' + e.message, { status: 500 });
  }
});