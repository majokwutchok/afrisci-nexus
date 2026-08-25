import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Marks an enrolment completed and issues a verifiable certificate with a
// unique code. Credit-free: only entity operations, no integration calls.
// The branded PDF itself is generated client-side by the frontend.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { enrolment_id } = body;
    if (!enrolment_id) return Response.json({ error: 'enrolment_id is required' }, { status: 400 });

    let enrolment;
    try { enrolment = await base44.asServiceRole.entities.Enrolment.get(enrolment_id); } catch { return Response.json({ error: 'Enrolment not found' }, { status: 404 }); }
    if (enrolment.status !== 'active' && enrolment.status !== 'completed') {
      return Response.json({ error: 'Enrolment is not active (payment may still be processing)' }, { status: 400 });
    }

    // Idempotent: return the existing certificate if already issued.
    if (enrolment.certificate_id) {
      let existing;
      try { existing = await base44.asServiceRole.entities.Certificate.get(enrolment.certificate_id); } catch {}
      if (existing && existing.status === 'active') {
        return Response.json({
          certificate_code: existing.certificate_code, course_title: existing.course_title,
          course_code: existing.course_code, user_name: existing.user_name,
          issue_date: existing.issue_date, already_issued: true
        });
      }
    }

    const code = `ASN-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const today = new Date().toISOString().slice(0, 10);

    const cert = await base44.asServiceRole.entities.Certificate.create({
      certificate_code: code, enrolment_id: enrolment.id, course_id: enrolment.course_id,
      course_code: enrolment.course_code, course_title: enrolment.course_title,
      user_name: enrolment.user_name, user_email: enrolment.user_email,
      issue_date: today, status: 'active'
    });

    await base44.asServiceRole.entities.Enrolment.update(enrolment.id, {
      status: 'completed', completed_at: new Date().toISOString(),
      certificate_id: cert.id, certificate_code: code
    });

    return Response.json({
      certificate_code: code, course_title: enrolment.course_title,
      course_code: enrolment.course_code, user_name: enrolment.user_name, issue_date: today
    });
  } catch (error) {
    console.error('issueCertificate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}