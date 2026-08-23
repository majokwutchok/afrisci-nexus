import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DOI_PREFIX = "10.67418";

function generateDOISuffix(manuscript) {
  const year = manuscript.publication_date
    ? new Date(manuscript.publication_date).getFullYear()
    : new Date().getFullYear();
  const shortId = manuscript.id.replace(/-/g, '').slice(-8).toLowerCase();
  return `afrisci.${year}.${shortId}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { manuscript_id } = body;

    if (!manuscript_id) {
      return Response.json({ error: 'manuscript_id is required' }, { status: 400 });
    }

    const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);

    if (!manuscript) {
      return Response.json({ error: 'Manuscript not found' }, { status: 404 });
    }

    // If DOI already assigned, still try Crossref registration if not yet submitted
    if (manuscript.doi) {
      // If not yet registered with Crossref, do it now
      if (!manuscript.crossref_status || manuscript.crossref_status === 'pending' || manuscript.crossref_status === 'failed') {
        try {
          await base44.functions.invoke('registerCrossrefDOI', { manuscript_id });
        } catch (e) {
          console.error('Crossref registration error:', e.message);
        }
      }
      return Response.json({
        doi: manuscript.doi,
        doi_url: `https://doi.org/${manuscript.doi}`,
        already_assigned: true
      });
    }

    // Allow DOI assignment for accepted, online_first, or published manuscripts
    const eligibleStatuses = ['accepted', 'online_first', 'published'];
    if (!eligibleStatuses.includes(manuscript.status)) {
      return Response.json({
        error: 'DOI can only be assigned to accepted, online_first, or published manuscripts'
      }, { status: 400 });
    }

    const suffix = generateDOISuffix(manuscript);
    const doi = `${DOI_PREFIX}/${suffix}`;
    const today = new Date().toISOString().split('T')[0];

    // Persist the DOI on the manuscript, mark Crossref as pending
    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      doi,
      doi_registered_date: today,
      crossref_status: 'pending',
    });

    // Immediately register with Crossref
    let crossrefResult = null;
    try {
      crossrefResult = await base44.functions.invoke('registerCrossrefDOI', { manuscript_id });
    } catch (e) {
      console.error('Crossref registration error (non-fatal):', e.message);
    }

    return Response.json({
      doi,
      doi_url: `https://doi.org/${doi}`,
      already_assigned: false,
      crossref_registered: crossrefResult?.data?.success === true,
      crossref_batch_id: crossrefResult?.data?.batch_id || null,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});