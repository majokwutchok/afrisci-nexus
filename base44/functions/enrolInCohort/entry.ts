import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Lets a learner claim a prepaid seat in an institutional cohort using the
// cohort code. Credit-free: only entity operations. Creates an active
// enrolment so the existing issueCertificate flow can issue the certificate.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { cohort_code, user_name, user_email } = body;
    if (!cohort_code || !user_name || !user_email) {
      return Response.json({ error: 'cohort_code, user_name and user_email are required' }, { status: 400 });
    }

    const cohorts = await base44.asServiceRole.entities.CourseCohort.filter({ cohort_code }, '-created_date', 5);
    const cohort = (cohorts || [])[0];
    if (!cohort) return Response.json({ error: 'Cohort code not found' }, { status: 404 });
    if (cohort.status !== 'active') return Response.json({ error: 'This cohort is not active yet' }, { status: 400 });
    if (cohort.seats_used >= cohort.seats_purchased) return Response.json({ error: 'All seats in this cohort have been claimed' }, { status: 400 });

    // Prevent the same learner claiming two seats in the same cohort.
    const existing = await base44.asServiceRole.entities.Enrolment.filter({ cohort_id: cohort.id, user_email }, '-created_date', 5);
    if (existing && existing.length) {
      return Response.json({ error: 'You are already enrolled in this cohort', enrolment_id: existing[0].id, already_enrolled: true }, { status: 409 });
    }

    const enrolment = await base44.asServiceRole.entities.Enrolment.create({
      course_id: cohort.course_id, course_code: cohort.course_code, course_title: cohort.course_title,
      user_name, user_email, amount: 0, currency: cohort.currency || 'USD',
      status: 'active', payment_provider: 'cohort', enrolled_at: new Date().toISOString(),
      cohort_id: cohort.id, cohort_code: cohort.cohort_code
    });

    await base44.asServiceRole.entities.CourseCohort.updateMany({ id: cohort.id }, { $inc: { seats_used: 1 } });

    return Response.json({ enrolment_id: enrolment.id, course_title: cohort.course_title, course_code: cohort.course_code });
  } catch (error) {
    console.error('enrolInCohort error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}