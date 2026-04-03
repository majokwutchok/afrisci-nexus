import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DOI_PREFIX = "10.55490";

function generateDOISuffix(manuscript) {
  const year = manuscript.publication_date
    ? new Date(manuscript.publication_date).getFullYear()
    : new Date().getFullYear();
  const shortId = manuscript.id.replace(/-/g, '').slice(-8).toLowerCase();
  return `afrisci.${year}.${shortId}`;
}

// Entity automation handler — fires when a Manuscript is updated to published
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Only act on update events where status just became published/online_first
    if (event?.type !== 'update') return Response.json({ skipped: true });

    const manuscript = data;
    if (!manuscript) return Response.json({ skipped: 'no data' });

    const isPublished = manuscript.status === 'published' || manuscript.status === 'online_first';
    if (!isPublished) return Response.json({ skipped: 'not published' });

    // Skip if DOI already assigned
    if (manuscript.doi) return Response.json({ skipped: 'doi already exists', doi: manuscript.doi });

    const suffix = generateDOISuffix(manuscript);
    const doi = `${DOI_PREFIX}/${suffix}`;

    await base44.asServiceRole.entities.Manuscript.update(manuscript.id, {
      doi,
      doi_registered_date: new Date().toISOString().split('T')[0]
    });

    console.log(`DOI assigned: ${doi} → manuscript ${manuscript.id}`);
    return Response.json({ success: true, doi, manuscript_id: manuscript.id });

  } catch (error) {
    console.error('autoAssignDOI error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});