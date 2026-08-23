import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DOI_PREFIX = "10.67418";

function generateDOISuffix(manuscript) {
  const year = manuscript.publication_date
    ? new Date(manuscript.publication_date).getFullYear()
    : new Date().getFullYear();
  const shortId = manuscript.id.replace(/-/g, '').slice(-8).toLowerCase();
  return `afrisci.${year}.${shortId}`;
}

// Entity automation handler — fires when a Manuscript is updated to published/online_first/accepted
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event } = body;

    // Only act on genuine Manuscript update automation events
    if (event?.type !== 'update' || event?.entity_name !== 'Manuscript') {
      return Response.json({ skipped: true });
    }

    const manuscriptId = event?.entity_id;
    if (!manuscriptId) return Response.json({ skipped: 'no entity_id' });

    // Do NOT trust the request body's `data` — fetch the real record from the DB
    // so a forged payload cannot trigger DOI assignment on an arbitrary manuscript.
    const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscriptId);
    if (!manuscript) return Response.json({ skipped: 'manuscript not found' });

    const isEligible = ['accepted', 'published', 'online_first'].includes(manuscript.status);
    if (!isEligible) return Response.json({ skipped: 'not accepted/published' });

    const today = new Date().toISOString().split('T')[0];

    // Assign DOI if not already assigned
    if (!manuscript.doi) {
      const suffix = generateDOISuffix(manuscript);
      const doi = `${DOI_PREFIX}/${suffix}`;

      await base44.asServiceRole.entities.Manuscript.update(manuscript.id, {
        doi,
        doi_registered_date: today,
        crossref_status: 'pending',
      });

      console.log(`DOI assigned: ${doi} → manuscript ${manuscript.id}`);

      // Register with Crossref immediately
      try {
        const crossrefRes = await base44.asServiceRole.functions.invoke('registerCrossrefDOI', {
          manuscript_id: manuscript.id
        });
        console.log(`Crossref registration result:`, crossrefRes?.success);
      } catch (e) {
        console.error('Crossref registration error (non-fatal):', e.message);
      }

      return Response.json({ success: true, doi, manuscript_id: manuscript.id });
    }

    // DOI exists — check if Crossref registration is still pending/failed
    if (!manuscript.crossref_status || manuscript.crossref_status === 'pending' || manuscript.crossref_status === 'failed') {
      try {
        await base44.asServiceRole.functions.invoke('registerCrossrefDOI', {
          manuscript_id: manuscript.id
        });
        console.log(`Crossref re-registration triggered for manuscript ${manuscript.id}`);
      } catch (e) {
        console.error('Crossref re-registration error:', e.message);
      }
    }

    return Response.json({ skipped: 'doi already exists', doi: manuscript.doi });

  } catch (error) {
    console.error('autoAssignDOI error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});