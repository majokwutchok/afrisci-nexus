import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only editors and admins can trigger plagiarism checks
    const hasAccess = user.role === 'admin' ||
      (user.editor_roles && user.editor_roles.length > 0);
    if (!hasAccess) return Response.json({ error: 'Forbidden: editor or admin access required' }, { status: 403 });

    let manuscript_id;
    try {
      const body = await req.json();
      manuscript_id = body.manuscript_id || body.event?.entity_id;
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!manuscript_id) {
      return Response.json({ error: 'manuscript_id is required' }, { status: 400 });
    }

    const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);
    if (!manuscript) {
      return Response.json({ error: 'Manuscript not found' }, { status: 404 });
    }

    // Only screen on submission
    if (!['submitted', 'draft'].includes(manuscript.status) && !manuscript.abstract) {
      return Response.json({ skipped: true, reason: 'Not a new submission' });
    }

    const textToAnalyze = [
      manuscript.title,
      manuscript.abstract,
      (manuscript.keywords || []).join(' ')
    ].filter(Boolean).join('\n\n');

    const prompt = `
You are an academic plagiarism screening system. Analyze the following manuscript excerpt for potential plagiarism indicators and academic integrity issues.

MANUSCRIPT:
Title: ${manuscript.title}
Abstract: ${manuscript.abstract || '(no abstract)'}
Keywords: ${(manuscript.keywords || []).join(', ')}

Perform a thorough academic integrity analysis. Consider:
1. Generic/templated language that may be copied from common sources
2. Overly formal or inconsistent writing style that suggests text mixing from different authors
3. Technical phrases that are well-known verbatim quotes in the field
4. Self-plagiarism risk indicators (highly formulaic academic boilerplate)
5. Unusual juxtaposition of highly technical and overly basic language

Return a JSON object with your analysis. Be realistic — most legitimate research will score 5-25% similarity. Only flag genuinely suspicious patterns.
`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          similarity_score: {
            type: "number",
            description: "Estimated overall similarity percentage (0-100)"
          },
          risk_level: {
            type: "string",
            description: "low, medium, or high"
          },
          flagged_sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text_excerpt: { type: "string", description: "The flagged text excerpt (max 100 chars)" },
                issue_type: { type: "string", description: "e.g. possible_verbatim, boilerplate, style_inconsistency, self_plagiarism_risk" },
                explanation: { type: "string", description: "Why this was flagged" },
                severity: { type: "string", description: "low, medium, high" }
              }
            }
          },
          summary: { type: "string", description: "Brief overall assessment for editors (2-3 sentences)" },
          recommendation: { type: "string", description: "clear, flag_for_review, or reject_submission" },
          screened_at: { type: "string", description: "ISO timestamp" }
        }
      }
    });

    // Store result on manuscript
    const plagiarismReport = {
      ...result,
      screened_at: new Date().toISOString(),
      manuscript_id
    };

    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      plagiarism_report: plagiarismReport
    });

    return Response.json({ success: true, report: plagiarismReport });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});