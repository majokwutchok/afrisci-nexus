import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const manuscript = data;
    if (!manuscript || !manuscript.id) {
      return Response.json({ error: 'No manuscript data' }, { status: 400 });
    }

    if (manuscript.status !== 'submitted') {
      return Response.json({ skipped: true, reason: 'Not a submitted manuscript' });
    }

    // Email sending is not available (integration credits exhausted).
    // Confirmation is recorded in the submission timeline instead.
    console.log(`[Submission Confirmation] Manuscript ${manuscript.id} submitted. Author notification skipped — email service unavailable.`);

    // Log confirmation in manuscript timeline
    const existingTimeline = manuscript.timeline || [];
    const alreadyLogged = existingTimeline.some(t => t.status === 'submitted' && t.comment?.includes('confirmed'));
    if (!alreadyLogged) {
      await base44.asServiceRole.entities.Manuscript.update(manuscript.id, {
        timeline: [
          ...existingTimeline,
          {
            status: 'submitted',
            date: new Date().toISOString().split('T')[0],
            actor: 'system',
            comment: 'Submission confirmed. Author notification pending (email service temporarily unavailable).'
          }
        ]
      });
    }

    return Response.json({ success: true, note: 'Submission recorded. Email notification skipped.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});