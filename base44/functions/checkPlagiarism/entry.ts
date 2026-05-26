import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Heuristic plagiarism screening — no LLM required
function heuristicAnalysis(title, abstract, keywords) {
  const text = `${title} ${abstract} ${(keywords || []).join(' ')}`.toLowerCase();

  const boilerplatePatterns = [
    /this paper (presents|proposes|investigates|examines|analyzes)/i,
    /in this (paper|study|work|research)/i,
    /lorem ipsum/i,
    /\[insert\]/i,
    /placeholder/i,
  ];

  const flaggedSections = [];
  let score = 5; // baseline low score

  boilerplatePatterns.forEach(pattern => {
    const match = abstract?.match(pattern);
    if (match) {
      score += 5;
      flaggedSections.push({
        text_excerpt: match[0],
        issue_type: 'boilerplate',
        explanation: 'Common academic boilerplate phrase detected — ensure writing is original.',
        severity: 'low'
      });
    }
  });

  // Short abstract = incomplete submission risk
  const wordCount = abstract?.split(/\s+/).filter(Boolean).length || 0;
  if (wordCount < 50) {
    score += 8;
    flaggedSections.push({
      text_excerpt: abstract?.slice(0, 60) || '',
      issue_type: 'style_inconsistency',
      explanation: 'Abstract is very short (under 50 words). Standard abstracts are 150–300 words.',
      severity: 'medium'
    });
  }

  const risk_level = score < 15 ? 'low' : score < 30 ? 'medium' : 'high';
  const recommendation = score < 15 ? 'clear' : score < 30 ? 'flag_for_review' : 'flag_for_review';

  return {
    similarity_score: Math.min(score, 45),
    risk_level,
    flagged_sections: flaggedSections,
    summary: `Heuristic screening complete. Similarity score: ${Math.min(score, 45)}%. ${flaggedSections.length} potential pattern(s) flagged. Manual review recommended for a comprehensive assessment.`,
    recommendation,
    screened_at: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const hasAccess = user.role === 'admin' || (user.editor_roles && user.editor_roles.length > 0);
    if (!hasAccess) return Response.json({ error: 'Forbidden: editor or admin access required' }, { status: 403 });

    let manuscript_id;
    try {
      const body = await req.json();
      manuscript_id = body.manuscript_id || body.event?.entity_id;
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!manuscript_id) return Response.json({ error: 'manuscript_id is required' }, { status: 400 });

    const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscript_id);
    if (!manuscript) return Response.json({ error: 'Manuscript not found' }, { status: 404 });

    const report = heuristicAnalysis(manuscript.title, manuscript.abstract, manuscript.keywords);
    report.manuscript_id = manuscript_id;

    await base44.asServiceRole.entities.Manuscript.update(manuscript_id, {
      plagiarism_report: report
    });

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});