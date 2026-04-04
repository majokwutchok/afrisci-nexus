import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    const prompt = `
You are a professional academic journal typesetter. Generate a complete, publication-ready galley proof for the following manuscript.

MANUSCRIPT DETAILS:
Title: ${manuscript.title}
Authors: ${(manuscript.authors || []).map(a => `${a.name} (${a.affiliation || 'Unknown affiliation'}${a.is_corresponding ? ', Corresponding Author' : ''})`).join('; ')}
Keywords: ${(manuscript.keywords || []).join(', ')}
Abstract: ${manuscript.abstract}
Language: ${manuscript.language || 'English'}
Journal ID: ${manuscript.journal_id || 'AfriSci Nexus Journal'}
DOI: ${manuscript.doi || 'Pending assignment'}
Submitted: ${manuscript.submission_date || 'N/A'}

Generate a complete galley proof in the following JSON format, adhering to academic publishing standards (APA/Chicago). Be detailed and professional.
`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          formatted_title: { type: "string" },
          running_head: { type: "string", description: "Short title for page headers, max 50 chars" },
          formatted_authors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                affiliation_number: { type: "number" },
                is_corresponding: { type: "boolean" }
              }
            }
          },
          affiliations: {
            type: "array",
            items: { type: "object", properties: { number: { type: "number" }, text: { type: "string" } } }
          },
          formatted_abstract: { type: "string", description: "Polished, publication-ready abstract" },
          structured_keywords: { type: "array", items: { type: "string" } },
          citation_suggestion: { type: "string", description: "How this article should be cited" },
          doi_display: { type: "string" },
          received_date: { type: "string" },
          accepted_date: { type: "string" },
          publication_note: { type: "string", description: "Brief editorial note for publication" },
          formatting_notes: { type: "array", items: { type: "string" }, description: "Any notes for final typesetting" }
        }
      }
    });

    // Update manuscript status to online_first and store proof data
    const today = new Date().toISOString().split('T')[0];
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

    return Response.json({ success: true, proof: result, manuscript_title: manuscript.title });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});