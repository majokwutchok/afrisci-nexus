import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DOI_PREFIX = "10.55490";
const CROSSREF_DEPOSIT_URL = "https://doi.crossref.org/servlet/deposit";

/**
 * Builds a Crossref-compliant journal_article XML deposit payload.
 * Follows schema: https://data.crossref.org/reports/help/schema_doc/5.3.1/index.html
 */
function buildCrossrefXML(manuscript, journal, doi, batchId, depositorEmail) {
  const esc = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const pubDate = manuscript.publication_date
    ? new Date(manuscript.publication_date)
    : now;
  const pubYear = pubDate.getFullYear();
  const pubMonth = String(pubDate.getMonth() + 1).padStart(2, '0');
  const pubDay = String(pubDate.getDate()).padStart(2, '0');

  // Authors
  const authors = (manuscript.authors || []);
  const correspondingAuthor = authors.find(a => a.is_corresponding) || authors[0];
  const otherAuthors = authors.filter(a => a !== correspondingAuthor);

  const personName = (author, sequence) => {
    const nameParts = (author.name || '').trim().split(/\s+/);
    const given = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
    const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || '';
    return `
        <person_name sequence="${esc(sequence)}" contributor_role="author">
          <given_name>${esc(given)}</given_name>
          <surname>${esc(surname)}</surname>
          ${author.affiliation ? `<affiliation>${esc(author.affiliation)}</affiliation>` : ''}
          ${author.orcid ? `<ORCID authenticated="false">https://orcid.org/${esc(author.orcid)}</ORCID>` : ''}
        </person_name>`;
  };

  const contributorsXML = [
    correspondingAuthor ? personName(correspondingAuthor, 'first') : '',
    ...otherAuthors.map(a => personName(a, 'additional'))
  ].filter(Boolean).join('');

  // Keywords
  const keywordsXML = manuscript.keywords && manuscript.keywords.length > 0
    ? `<program name="AccessIndicators">
        <free_to_read/>
      </program>`
    : '';

  // License (Creative Commons for open access)
  const licenseXML = manuscript.access_type === 'open_access'
    ? `<program xmlns="http://www.crossref.org/AccessIndicators.xsd" name="AccessIndicators">
        <free_to_read/>
        <license_ref applies_to="vor">https://creativecommons.org/licenses/by/4.0/</license_ref>
      </program>`
    : '';

  const journalTitle = journal?.title || 'AfriSci Nexus Journal';
  const journalISSN = journal?.issn || '';
  const articleUrl = `https://afriscinexus.org/article/${manuscript.id}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.3.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 https://www.crossref.org/schemas/crossref5.3.1.xsd"
           version="5.3.1">
  <head>
    <doi_batch_id>${esc(batchId)}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>AfriSci Nexus</depositor_name>
      <email_address>${esc(depositorEmail)}</email_address>
    </depositor>
    <registrant>AfriSci Nexus</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>${esc(journalTitle)}</full_title>
        ${journalISSN ? `<issn media_type="electronic">${esc(journalISSN)}</issn>` : ''}
      </journal_metadata>
      <journal_issue>
        <publication_date media_type="online">
          <year>${pubYear}</year>
          <month>${pubMonth}</month>
          <day>${pubDay}</day>
        </publication_date>
      </journal_issue>
      <journal_article publication_type="full_text" reference_distribution_opts="any">
        <titles>
          <title>${esc(manuscript.title)}</title>
        </titles>
        <contributors>
          ${contributorsXML}
        </contributors>
        <abstract xmlns="http://www.ncbi.nlm.nih.gov/JATS1">
          <p>${esc(manuscript.abstract || '')}</p>
        </abstract>
        <publication_date media_type="online">
          <year>${pubYear}</year>
          <month>${pubMonth}</month>
          <day>${pubDay}</day>
        </publication_date>
        <publisher_item>
          <identifier id_type="doi">${esc(doi)}</identifier>
        </publisher_item>
        ${licenseXML}
        <doi_data>
          <doi>${esc(doi)}</doi>
          <resource>${esc(articleUrl)}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { manuscript_id } = await req.json();
    if (!manuscript_id) {
      return Response.json({ error: 'manuscript_id is required' }, { status: 400 });
    }

    const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);
    if (!manuscript) {
      return Response.json({ error: 'Manuscript not found' }, { status: 404 });
    }
    if (!manuscript.doi) {
      return Response.json({ error: 'Manuscript must have a DOI before registering with Crossref' }, { status: 400 });
    }

    // Load journal metadata
    let journal = null;
    if (manuscript.journal_id) {
      journal = await base44.asServiceRole.entities.Journal.get(manuscript.journal_id).catch(() => null);
    }

    const login = Deno.env.get("CROSSREF_LOGIN");
    const password = Deno.env.get("CROSSREF_PASSWORD");
    const depositorEmail = Deno.env.get("CROSSREF_DEPOSITOR_EMAIL") || "editor@afriscinexus.org";

    if (!login || !password) {
      return Response.json({ error: 'Crossref credentials not configured' }, { status: 500 });
    }

    // Generate a unique batch ID for this submission
    const batchId = `afrisci-${manuscript.id.slice(-8)}-${Date.now()}`;

    const xml = buildCrossrefXML(manuscript, journal, manuscript.doi, batchId, depositorEmail);

    // Submit to Crossref via multipart form POST
    const formData = new FormData();
    formData.append('login_id', login);
    formData.append('login_passwd', password);
    formData.append('fname', new Blob([xml], { type: 'application/xml' }), `${batchId}.xml`);

    const crossrefRes = await fetch(CROSSREF_DEPOSIT_URL, {
      method: 'POST',
      body: formData,
    });

    const responseText = await crossrefRes.text();
    const success = crossrefRes.ok && (
      responseText.includes('successfully') ||
      responseText.includes('queued') ||
      responseText.includes('batch_id') ||
      crossrefRes.status === 200
    );

    // Determine status from Crossref response
    const crossrefStatus = success ? 'submitted' : 'failed';

    // Record submission on the manuscript
    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      crossref_submission_id: batchId,
      crossref_status: crossrefStatus,
      crossref_submitted_at: new Date().toISOString(),
      crossref_response: responseText.slice(0, 500), // Store first 500 chars of response
    });

    console.log(`Crossref deposit [${batchId}]: status=${crossrefStatus}, HTTP=${crossrefRes.status}`);

    if (!success) {
      return Response.json({
        success: false,
        batch_id: batchId,
        http_status: crossrefRes.status,
        crossref_response: responseText.slice(0, 500),
        error: 'Crossref returned an error — see crossref_response for details'
      }, { status: 422 });
    }

    return Response.json({
      success: true,
      batch_id: batchId,
      doi: manuscript.doi,
      doi_url: `https://doi.org/${manuscript.doi}`,
      crossref_status: crossrefStatus,
      crossref_response: responseText.slice(0, 200),
    });

  } catch (error) {
    console.error('registerCrossrefDOI error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});