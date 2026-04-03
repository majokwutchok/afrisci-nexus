import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// DOI prefix for AfriSci Nexus (use your registered prefix in production)
const DOI_PREFIX = "10.55490";

/**
 * Generates a unique DOI suffix from manuscript metadata.
 * Format: afrisci.<year>.<paddedId>
 */
function generateDOISuffix(manuscript) {
  const year = manuscript.publication_date
    ? new Date(manuscript.publication_date).getFullYear()
    : new Date().getFullYear();
  // Use last 8 chars of ID for uniqueness
  const shortId = manuscript.id.replace(/-/g, '').slice(-8).toLowerCase();
  return `afrisci.${year}.${shortId}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow editors, admins, and internal automation calls
    if (user && user.role !== 'admin' && user.role !== 'editor') {
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

    // If DOI already assigned, return it
    if (manuscript.doi) {
      return Response.json({
        doi: manuscript.doi,
        doi_url: `https://doi.org/${manuscript.doi}`,
        already_assigned: true
      });
    }

    // Only assign DOI to published manuscripts
    if (manuscript.status !== 'published' && manuscript.status !== 'online_first') {
      return Response.json({
        error: 'DOI can only be assigned to published or online_first manuscripts'
      }, { status: 400 });
    }

    const suffix = generateDOISuffix(manuscript);
    const doi = `${DOI_PREFIX}/${suffix}`;

    // Persist the DOI on the manuscript
    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      doi,
      doi_registered_date: new Date().toISOString().split('T')[0]
    });

    return Response.json({
      doi,
      doi_url: `https://doi.org/${doi}`,
      already_assigned: false
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});