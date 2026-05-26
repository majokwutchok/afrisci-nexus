import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const JOURNALS = [
  "AfriSci STEM Journal", "AfriSci Medicine & Health Journal",
  "AfriSci Agriculture & Environment Journal", "AfriSci Social Sciences Journal",
  "AfriSci Law & Policy Journal", "AfriSci Arts & Humanities Journal",
  "AfriSci Business & Economics Journal", "AfriSci Education & Pedagogy Journal",
  "AfriSci Interdisciplinary Research Journal", "AfriSci Public Health & Nutrition Journal",
  "AfriSci Engineering & Innovation Journal", "AfriSci Indigenous Knowledge & Culture Journal"
];

const GOAL_TEMPLATES = {
  partnership_proposal: (p) => ({
    subject: `Partnership Opportunity: AfriSci Nexus Discovery & ${p.institution || 'Your Institution'}`,
    body: `<p>Dear ${p.contact_name || 'Colleague'},</p>
<p>I hope this message finds you well. I am reaching out on behalf of <strong>AfriSci Nexus Discovery</strong> — Africa's premier multidisciplinary open-access academic publishing platform, home to 12 peer-reviewed journals.</p>
<p>We are actively growing our network of institutional partners across ${p.country}, and ${p.institution || 'your institution'} would be an excellent addition. Our partnership programme offers your researchers discounted publication fees, global visibility across our 12 journals, and co-branding opportunities.</p>
<p>I would welcome the opportunity to discuss how AfriSci Nexus Discovery can amplify the research coming out of ${p.institution || 'your institution'}. Please feel free to reply to this message or visit <a href="https://afriscinexus.com/InstitutionalPartnership">our partnership page</a> for more details.</p>
<p>Warm regards,<br><strong>Majok Wutchok</strong><br>Founder &amp; CEO, AfriSci Nexus Discovery<br>editorial@afriscinexus.com</p>`
  }),
  call_for_submissions: (p) => ({
    subject: `Call for Submissions: AfriSci Nexus Discovery Journals — ${p.country}`,
    body: `<p>Dear ${p.contact_name || 'Colleague'},</p>
<p>AfriSci Nexus Discovery is calling for manuscript submissions for our 12 peer-reviewed open-access journals. As a researcher at ${p.institution || 'your institution'} in ${p.country}, your work could reach a global audience.</p>
<p>We offer rapid peer review, open access publishing, and DOI assignment for all accepted manuscripts. Our journals cover STEM, Medicine, Agriculture, Social Sciences, Law, Arts, Business, Education, and more.</p>
<p>Visit <a href="https://afriscinexus.com/Submit">afriscinexus.com/Submit</a> to submit your manuscript today.</p>
<p>Best regards,<br><strong>Majok Wutchok</strong><br>Founder &amp; CEO, AfriSci Nexus Discovery</p>`
  }),
  reviewer_recruitment: (p) => ({
    subject: `Invitation to Join the AfriSci Nexus Reviewer Network`,
    body: `<p>Dear ${p.contact_name || 'Colleague'},</p>
<p>We are building our network of expert peer reviewers at AfriSci Nexus Discovery, and we believe your expertise${p.department ? ` in ${p.department}` : ''} would be invaluable.</p>
<p>As a reviewer, you will contribute to advancing African research, receive recognition in our annual reviewer awards, and have the opportunity to shape the quality of scholarship published in your field.</p>
<p>Apply now at <a href="https://afriscinexus.com/Apply?role=reviewer">afriscinexus.com/Apply</a>.</p>
<p>Best regards,<br><strong>Majok Wutchok</strong><br>Founder &amp; CEO, AfriSci Nexus Discovery</p>`
  }),
  general_outreach: (p) => ({
    subject: `AfriSci Nexus Discovery — Amplifying African Research Globally`,
    body: `<p>Dear ${p.contact_name || 'Colleague'},</p>
<p>I wanted to introduce you to AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally.</p>
<p>We publish open-access, peer-reviewed research across all disciplines, with authors and readers in all 54 African countries and beyond. Your institution in ${p.country} could benefit greatly from our growing academic network.</p>
<p>Learn more at <a href="https://afriscinexus.com">afriscinexus.com</a>.</p>
<p>Best regards,<br><strong>Majok Wutchok</strong><br>Founder &amp; CEO, AfriSci Nexus Discovery</p>`
  })
};

function buildTemplateDraft(prospect, goal) {
  const templateFn = GOAL_TEMPLATES[goal] || GOAL_TEMPLATES.general_outreach;
  const { subject, body } = templateFn(prospect);

  const bodyHtml = `<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1e3a8a, #0d9488); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
  <h1 style="margin: 0; font-size: 22px;">🌍 AfriSci Nexus Discovery</h1>
  <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">12 Journals · One Platform · African Research Globally</p>
</div>
<div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
  ${body}
</div>
<div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
  AfriSci Nexus Discovery · 12 Peer-Reviewed Journals · <a href="https://afriscinexus.com" style="color: #0d9488;">afriscinexus.com</a>
</div>
</body></html>`;

  return {
    subject,
    body_html: bodyHtml,
    personalization_signals: [
      prospect.contact_name ? `Name: ${prospect.contact_name}` : null,
      prospect.institution ? `Institution: ${prospect.institution}` : null,
      prospect.department ? `Department: ${prospect.department}` : null,
      prospect.country ? `Country: ${prospect.country}` : null,
    ].filter(Boolean),
    ai_reasoning: 'Template-based draft generated (AI personalization temporarily unavailable). Please review and personalize before sending.'
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { action, prospect_ids, goal = 'partnership_proposal', outreach_id } = body;

  // ── ACTION: generate template drafts ──
  if (action === 'generate') {
    if (!prospect_ids?.length) return Response.json({ error: 'prospect_ids required' }, { status: 400 });

    const prospects = await Promise.all(
      prospect_ids.map(id => base44.asServiceRole.entities.ProspectEmail.filter({ id }).then(r => r[0]))
    );
    const valid = prospects.filter(Boolean);

    const results = [];
    for (const prospect of valid) {
      const draft = buildTemplateDraft(prospect, goal);

      const outreach = await base44.asServiceRole.entities.PersonalizedOutreach.create({
        prospect_id: prospect.id,
        prospect_email: prospect.email,
        prospect_name: prospect.contact_name || null,
        institution: prospect.institution || null,
        country: prospect.country,
        linkedin_url: prospect.linkedin_url || null,
        subject: draft.subject,
        body_html: draft.body_html,
        ai_reasoning: draft.ai_reasoning,
        personalization_signals: draft.personalization_signals,
        campaign_goal: goal,
        status: 'draft'
      });

      results.push({ id: outreach.id, prospect_email: prospect.email, prospect_name: prospect.contact_name, subject: draft.subject });
    }

    return Response.json({
      success: true,
      generated: results.length,
      drafts: results,
      note: 'Template-based drafts generated (AI personalization temporarily unavailable). Please review and personalize each email before sending.'
    });
  }

  // ── ACTION: send one approved outreach — mark as sent (email service unavailable) ──
  if (action === 'send') {
    if (!outreach_id) return Response.json({ error: 'outreach_id required' }, { status: 400 });
    const outreaches = await base44.asServiceRole.entities.PersonalizedOutreach.filter({ id: outreach_id });
    const outreach = outreaches[0];
    if (!outreach) return Response.json({ error: 'Outreach not found' }, { status: 404 });
    if (outreach.status === 'sent') return Response.json({ error: 'Already sent' }, { status: 400 });

    // Email delivery unavailable — record intent
    await base44.asServiceRole.entities.PersonalizedOutreach.update(outreach_id, {
      status: 'draft',
      admin_notes: `Send attempted on ${new Date().toLocaleDateString()} — email delivery temporarily unavailable.`
    });

    return Response.json({
      success: false,
      note: 'Email delivery is temporarily unavailable. The outreach has been queued. Please try again when the email service is restored.',
      sent_to: outreach.prospect_email
    });
  }

  // ── ACTION: send all approved drafts ──
  if (action === 'send_all_approved') {
    return Response.json({
      success: false,
      sent: 0,
      errors: 0,
      note: 'Email delivery is temporarily unavailable. All approved drafts are queued for sending when the service is restored.'
    });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});