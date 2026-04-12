import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const JOURNALS = [
  "AfriSci STEM Journal",
  "AfriSci Medicine & Health Journal",
  "AfriSci Agriculture & Environment Journal",
  "AfriSci Social Sciences Journal",
  "AfriSci Law & Policy Journal",
  "AfriSci Arts & Humanities Journal",
  "AfriSci Business & Economics Journal",
  "AfriSci Education & Pedagogy Journal",
  "AfriSci Interdisciplinary Research Journal",
  "AfriSci Public Health & Nutrition Journal",
  "AfriSci Engineering & Innovation Journal",
  "AfriSci Indigenous Knowledge & Culture Journal"
];

// Builds a rich context prompt for one prospect
function buildPrompt(prospect, goal, extraContext) {
  const signals = [];
  if (prospect.linkedin_headline) signals.push(`LinkedIn headline: "${prospect.linkedin_headline}"`);
  if (prospect.department) signals.push(`Department: ${prospect.department}`);
  if (prospect.institution) signals.push(`Institution: ${prospect.institution}`);
  if (prospect.google_scholar_url) signals.push(`Has Google Scholar profile (active researcher)`);
  if (prospect.researchgate_url) signals.push(`Has ResearchGate profile`);
  if (prospect.notes) signals.push(`Additional context: ${prospect.notes}`);

  const goalDescriptions = {
    partnership_proposal: "propose an institutional publishing partnership with AfriSci Nexus Discovery — pitch the benefits of their researchers getting global visibility, discounted open-access publication fees across 12 peer-reviewed journals, and co-branding opportunities. Name the most relevant journal(s) for their institution.",
    call_for_submissions: "invite the recipient to submit their research to AfriSci Nexus Discovery — highlight which of our 12 journals best matches their specific research area or department. Be specific and direct.",
    reviewer_recruitment: "recruit this academic as a peer reviewer for AfriSci Nexus Discovery — reference their specific expertise from their headline/department and name which of our 12 journals they should review for.",
    general_outreach: "introduce AfriSci Nexus Discovery (Africa's premier multidisciplinary open-access platform with 12 individual peer-reviewed journals) and explore potential collaboration based on their background."
  };

  return `You are the Senior Partnerships Director at AfriSci Nexus Discovery — Africa's premier multidisciplinary open-access academic publishing platform, home to 12 individual peer-reviewed journals.

OUR 12 JOURNALS under AfriSci Nexus Discovery:
${JOURNALS.map((j, i) => `${i + 1}. ${j}`).join('\n')}

Write a highly personalized, warm, professional email to the following academic/professional. The email must feel hand-written — reference a SPECIFIC journal that matches their field. NOT a mass template blast.

RECIPIENT INFO:
- Name: ${prospect.contact_name || "Dear Colleague"}
- Email: ${prospect.email}
- Institution: ${prospect.institution || "their institution"}
- Country: ${prospect.country}
- Department: ${prospect.department || "unknown"}
${signals.length > 0 ? `\nPERSONALIZATION SIGNALS:\n${signals.map(s => `- ${s}`).join('\n')}` : ''}
${extraContext ? `\nADDITIONAL CONTEXT FROM WEB:\n${extraContext}` : ''}

GOAL: ${goalDescriptions[goal] || goalDescriptions.partnership_proposal}

REQUIREMENTS:
1. Subject line: compelling, specific to their field + mentions AfriSci Nexus Discovery, max 12 words
2. Opening: reference something SPECIFIC about their role, department, or LinkedIn headline
3. Body: 3–4 short paragraphs. Name the SPECIFIC AfriSci Nexus Discovery journal most relevant to their field. Mention their institution and country. Reference their likely research interests.
4. Include naturally: "AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally."
5. CTA: one clear action (reply, visit a link, schedule a call)
6. Tone: warm, collegial, peer-to-peer — NOT salesy
7. Signature: "Majok Wutchok, Founder & CEO" followed by "AfriSci Nexus Discovery" and editorial@afriscinexus.com
8. HTML format with inline styles. Brand header: dark blue (#1e3a8a) to teal (#0d9488) gradient.
9. Do NOT use placeholder brackets like [Name] — use the actual values provided.
10. Footer: "AfriSci Nexus Discovery · 12 Peer-Reviewed Journals · afriscinexus.com"

Also provide:
- personalization_signals: list of signals used (max 5)
- ai_reasoning: 1–2 sentences on your personalization approach

Return JSON only.`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { action, prospect_ids, goal = 'partnership_proposal', outreach_id } = body;

  // ── ACTION: generate drafts for a batch of prospects ──
  if (action === 'generate') {
    if (!prospect_ids?.length) return Response.json({ error: 'prospect_ids required' }, { status: 400 });

    const prospects = await Promise.all(
      prospect_ids.map(id => base44.asServiceRole.entities.ProspectEmail.filter({ id }).then(r => r[0]))
    );
    const valid = prospects.filter(Boolean);

    const results = [];
    for (const prospect of valid) {
      // Use web search to find any recent activity or institution context
      let extraContext = '';
      if (prospect.linkedin_url || prospect.institution) {
        try {
          const searchResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Search the web and find any notable recent publications, research projects, or news about ${prospect.contact_name || ''} at ${prospect.institution || ''} in ${prospect.country}. Return 2-3 sentences of relevant context only. If nothing found, return empty string.`,
            add_context_from_internet: true,
            model: 'gemini_3_flash'
          });
          if (typeof searchResult === 'string' && searchResult.length > 20) extraContext = searchResult;
        } catch (_) { /* skip if search fails */ }
      }

      const draft = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(prospect, goal, extraContext),
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body_html: { type: 'string' },
            personalization_signals: { type: 'array', items: { type: 'string' } },
            ai_reasoning: { type: 'string' }
          }
        }
      });

      const outreach = await base44.asServiceRole.entities.PersonalizedOutreach.create({
        prospect_id: prospect.id,
        prospect_email: prospect.email,
        prospect_name: prospect.contact_name || null,
        institution: prospect.institution || null,
        country: prospect.country,
        linkedin_url: prospect.linkedin_url || null,
        subject: draft.subject,
        body_html: draft.body_html,
        ai_reasoning: draft.ai_reasoning || null,
        personalization_signals: draft.personalization_signals || [],
        campaign_goal: goal,
        status: 'draft'
      });

      results.push({ id: outreach.id, prospect_email: prospect.email, prospect_name: prospect.contact_name, subject: draft.subject });
    }

    return Response.json({ success: true, generated: results.length, drafts: results });
  }

  // ── ACTION: send one approved outreach ──
  if (action === 'send') {
    if (!outreach_id) return Response.json({ error: 'outreach_id required' }, { status: 400 });
    const outreaches = await base44.asServiceRole.entities.PersonalizedOutreach.filter({ id: outreach_id });
    const outreach = outreaches[0];
    if (!outreach) return Response.json({ error: 'Outreach not found' }, { status: 404 });
    if (outreach.status === 'sent') return Response.json({ error: 'Already sent' }, { status: 400 });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: outreach.prospect_email,
      subject: outreach.subject,
      body: outreach.body_html,
      from_name: 'Majok Wutchok, AfriSci Nexus Discovery'
    });

    await base44.asServiceRole.entities.PersonalizedOutreach.update(outreach_id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    if (outreach.prospect_id) {
      await base44.asServiceRole.entities.ProspectEmail.update(outreach.prospect_id, { campaign_status: 'emailed' });
    }

    return Response.json({ success: true, sent_to: outreach.prospect_email });
  }

  // ── ACTION: send all approved drafts in a batch ──
  if (action === 'send_all_approved') {
    const filter = { status: 'approved' };
    const approved = await base44.asServiceRole.entities.PersonalizedOutreach.filter(filter);

    let sent = 0, errors = 0;
    for (const outreach of approved) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: outreach.prospect_email,
          subject: outreach.subject,
          body: outreach.body_html,
          from_name: 'Majok Wutchok, AfriSci Nexus Discovery'
        });
        await base44.asServiceRole.entities.PersonalizedOutreach.update(outreach.id, { status: 'sent', sent_at: new Date().toISOString() });
        if (outreach.prospect_id) {
          await base44.asServiceRole.entities.ProspectEmail.update(outreach.prospect_id, { campaign_status: 'emailed' });
        }
        sent++;
      } catch (_) { errors++; }
    }
    return Response.json({ success: true, sent, errors });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});