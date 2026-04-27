import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DOI_PREFIX = "10.55490";

function generateDOISuffix(manuscript) {
  const year = new Date().getFullYear();
  const shortId = manuscript.id.replace(/-/g, '').slice(-8).toLowerCase();
  return `afrisci.${year}.${shortId}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && (!user.editor_roles || user.editor_roles.length === 0))) {
      return Response.json({ error: 'Forbidden: Editor access required' }, { status: 403 });
    }

    const { manuscript_id } = await req.json();
    if (!manuscript_id) {
      return Response.json({ error: 'manuscript_id is required' }, { status: 400 });
    }

    const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);
    if (!manuscript) {
      return Response.json({ error: 'Manuscript not found' }, { status: 404 });
    }

    if (!['accepted', 'online_first'].includes(manuscript.status)) {
      return Response.json({ error: 'Manuscript must be accepted or online_first to publish' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Assign DOI if not already assigned
    let doi = manuscript.doi;
    if (!doi) {
      const suffix = generateDOISuffix(manuscript);
      doi = `${DOI_PREFIX}/${suffix}`;
    }

    const timeline = [...(manuscript.timeline || []), {
      status: 'published',
      date: today,
      actor: user.full_name || user.email,
      comment: 'Article published and made available on the journal website.'
    }];

    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      status: 'published',
      publication_date: today,
      doi,
      timeline
    });

    return Response.json({ success: true, doi, publication_date: today });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});