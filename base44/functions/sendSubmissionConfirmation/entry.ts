import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Only process newly created manuscripts
    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const manuscript = data;
    if (!manuscript || !manuscript.id) {
      return Response.json({ error: 'No manuscript data' }, { status: 400 });
    }

    // Only send for submitted manuscripts (not drafts)
    if (manuscript.status !== 'submitted') {
      return Response.json({ skipped: true, reason: 'Not a submitted manuscript' });
    }

    // Find corresponding author
    const correspondingAuthor = manuscript.authors?.find(a => a.is_corresponding) || manuscript.authors?.[0];
    if (!correspondingAuthor?.email) {
      return Response.json({ skipped: true, reason: 'No corresponding author email found' });
    }

    const submissionDate = manuscript.submission_date || new Date().toISOString().split('T')[0];
    const formattedDate = new Date(submissionDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Estimated timeline
    const initialReviewEnd = new Date(submissionDate);
    initialReviewEnd.setDate(initialReviewEnd.getDate() + 7);
    const peerReviewEnd = new Date(submissionDate);
    peerReviewEnd.setDate(peerReviewEnd.getDate() + 60);
    const decisionEnd = new Date(submissionDate);
    decisionEnd.setDate(decisionEnd.getDate() + 75);

    const fmt = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const allAuthors = manuscript.authors?.map(a => a.name).filter(Boolean).join(', ') || 'N/A';

    const emailBody = `Dear ${correspondingAuthor.name},

Thank you for submitting your manuscript to AfriSci Nexus. We are pleased to confirm that your submission has been successfully received.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SUBMISSION CONFIRMATION RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Submission ID:    ${manuscript.id}
Manuscript Title: ${manuscript.title}
Authors:          ${allAuthors}
Submitted:        ${formattedDate}
Status:           Under Editorial Review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 ESTIMATED REVIEW TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Initial Editorial Screening
   ✓ Expected by: ${fmt(initialReviewEnd)}
   The editorial team will check your manuscript for scope, formatting,
   and completeness. You will be notified if any issues are found.

2. Peer Review Process
   ✓ Expected by: ${fmt(peerReviewEnd)}
   Your manuscript will be sent to 2–3 expert reviewers in your field.
   Our double-blind review process typically takes 6–8 weeks.

3. Editorial Decision
   ✓ Expected by: ${fmt(decisionEnd)}
   After peer review, the editor will make a decision:
   Accept / Minor Revision / Major Revision / Reject.

Please note these are estimated timelines and may vary depending on
reviewer availability and the complexity of your manuscript.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 TRACK YOUR SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can track the real-time status of your manuscript by visiting your
Author Dashboard at: https://afrisco-nexus.base44.app/MyManuscripts

Use your Submission ID for reference in any correspondence:
👉 ${manuscript.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions, please contact us at editorial@afrisco-nexus.org,
quoting your Submission ID.

We look forward to working with you.

Best regards,
The AfriSci Nexus Editorial Team
https://afrisco-nexus.base44.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated confirmation. Please do not reply to this email.`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: correspondingAuthor.email,
      subject: `[AfriSci Nexus] Submission Confirmed — ${manuscript.title.slice(0, 60)}${manuscript.title.length > 60 ? '...' : ''}`,
      body: emailBody,
      from_name: 'AfriSci Nexus Editorial Office'
    });

    return Response.json({ success: true, sent_to: correspondingAuthor.email });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});