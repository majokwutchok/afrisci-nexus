import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildCheckoutSession } from '../../shared/stripeCheckout.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { course_id, user_name, user_email } = body;
    if (!course_id || !user_name || !user_email) {
      return Response.json({ error: 'course_id, user_name and user_email are required' }, { status: 400 });
    }

    let course;
    try { course = await base44.asServiceRole.entities.Course.get(course_id); } catch { return Response.json({ error: 'Course not found' }, { status: 404 }); }
    if (!course.is_active) return Response.json({ error: 'Course is not available' }, { status: 400 });

    const origin = new URL(req.url).origin;
    const enrolment = await base44.asServiceRole.entities.Enrolment.create({
      course_id: course.id, course_code: course.course_code, course_title: course.title,
      user_name, user_email, amount: course.price || 0, currency: course.currency || 'USD',
      status: 'pending_payment', payment_provider: 'stripe', enrolled_at: new Date().toISOString()
    });

    const tx = await base44.asServiceRole.entities.Transaction.create({
      amount: course.price || 0, currency: course.currency || 'USD',
      transaction_type: 'payment', payment_provider: 'stripe', status: 'pending',
      description: `Course enrolment: ${course.title}`
    });

    const session = await buildCheckoutSession({
      plan: { name: course.title, price: course.price, currency: course.currency, billing_interval: 'one_time' },
      customer_email: user_email,
      success_url: `${origin}/Training?stripe=success&enrolment=${enrolment.id}`,
      cancel_url: `${origin}/Training?stripe=canceled`,
      metadata: { product_type: 'course_enrolment', record_id: enrolment.id, transaction_id: tx.id, course_id: course.id }
    });

    await base44.asServiceRole.entities.Enrolment.update(enrolment.id, { stripe_checkout_session_id: session.id });
    await base44.asServiceRole.entities.Transaction.update(tx.id, { provider_transaction_id: session.id });

    return Response.json({ url: session.url, session_id: session.id, enrolment_id: enrolment.id });
  } catch (error) {
    console.error('createCourseEnrolmentCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}