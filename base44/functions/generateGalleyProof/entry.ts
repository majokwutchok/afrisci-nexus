import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const today = new Date().toISOString().split('T')[0];
    const acceptedEntry = (manuscript.timeline || []).find(t => t.status === 'accepted');

    // Build structured galley proof from manuscript metadata (no LLM required)
    const authors = manuscript.authors || [];
    const affiliationMap = {};
    let affNum = 1;
    authors.forEach(a => {
      if (a.affiliation && !affiliationMap[a.affiliation]) {
        affiliationMap[a.affiliation] = affNum++;
      }
    });

    const formattedAuthors = authors.map(a => ({
      name: a.name,
      affiliation_number: affiliationMap[a.affiliation] || 1,
      is_corresponding: !!a.is_corresponding
    }));

    const affiliations = Object.entries(affiliationMap).map(([text, number]) => ({ number, text }));

    const year = manuscript.publication_date
      ? new Date(manuscript.publication_date).getFullYear()
      : new Date().getFullYear();
    const firstAuthor = authors[0]?.name?.split(' ').pop() || 'Author';
    const doi = manuscript.doi || 'Pending DOI assignment';

    const proof = {
      formatted_title: manuscript.title,
      running_head: manuscript.title.substring(0, 50).toUpperCase(),
      formatted_authors: formattedAuthors,
      affiliations,
      formatted_abstract: manuscript.abstract,
      structured_keywords: manuscript.keywords || [],
      citation_suggestion: `${firstAuthor} et al. (${year}). ${manuscript.title}. AfriSci Nexus. ${doi !== 'Pending DOI assignment' ? `https://doi.org/${doi}` : doi}`,
      doi_display: doi,
      received_date: manuscript.submission_date || today,
      accepted_date: acceptedEntry?.date || today,
      publication_note: `Published Online First: ${today}. AfriSci Nexus Open Access Journal.`,
      formatting_notes: [
        'Typeset in 10pt Times New Roman, two-column layout for print.',
        'Abstract limited to 250 words for print version.',
        'Keywords should be MeSH or discipline-standard terms.',
        'All figures should be minimum 300 DPI for print quality.',
        'References formatted in APA 7th Edition.'
      ]
    };

    // Update manuscript to online_first
    const timeline = [...(manuscript.timeline || []), {
      status: 'online_first',
      date: today,
      actor: user.full_name || user.email,
      comment: 'Galley proof generated. Manuscript marked as Online First.'
    }];

    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      status: 'online_first',
      online_first_date: today,
      timeline
    });

    return Response.json({ success: true, proof, manuscript_title: manuscript.title });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});