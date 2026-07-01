import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DOI_PREFIX = "10.55490";

function generateDOISuffix(manuscript) {
  const year = new Date().getFullYear();
  const shortId = manuscript.id.replace(/-/g, '').slice(-8).toLowerCase();
  return `afrisci.${year}.${shortId}`;
}

async function registerWithCrossref(base44, manuscript_id) {
  try {
    const res = await base44.functions.invoke('registerCrossrefDOI', { manuscript_id });
    return res;
  } catch (e) {
    console.error('Crossref registration error (non-fatal):', e.message);
    return null;
  }
}

async function notifyGoogle(base44) {
  try {
    const res = await base44.functions.invoke('notifyGoogleIndexing', {});
    return res;
  } catch (e) {
    console.error('Google indexing notification error (non-fatal):', e.message);
    return null;
  }
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

    // Publish the manuscript — set status, DOI, date
    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      status: 'published',
      publication_date: today,
      doi,
      doi_registered_date: today,
      crossref_status: 'pending',
      timeline
    });

    // Immediately register with Crossref
    const crossrefResult = await registerWithCrossref(base44, manuscript_id);

    // Notify Google Search Console so it discovers the new article faster
    const googleResult = await notifyGoogle(base44);

    return Response.json({
      success: true,
      doi,
      doi_url: `https://doi.org/${doi}`,
      publication_date: today,
      crossref_registered: crossrefResult?.success === true,
      crossref_batch_id: crossrefResult?.batch_id || null,
      google_notified: googleResult?.success === true,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});