import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildCheckoutSession } from '../../shared/stripeCheckout.ts';

// Volume discount tiers for institutional cohort purchases.
function pricePerSeat(coursePrice, seats) {
  let discount = 0;
  if (seats >= 20) discount = 0.20;
  else if (seats >= 10) discount = 0.15;
  else if (seats >= 5) discount = 0.10;
  return Math.round((coursePrice || 0) * (1 - discount));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { course_id, institution_name, contact_name, contact_email, seats } = body;
    if (!course_id || !institution_name || !contact_email || !seats) {
      return Response.json({ error: 'course_id, institution_name, contact_email and seats are required' }, { status: 400 });
    }
    const n = parseInt(seats, 10);
    if (!Number.isFinite(n) || n < 5) {
      return Response.json({ error: 'A cohort requires a minimum of 5 seats' }, { status: 400 });
    }

    let course;
    try { course = await base44.asServiceRole.entities.Course.get(course_id); } catch { return Response.json({ error: 'Course not found' }, { status: 404 }); }
    if (!course.is_active) return Response.json({ error: 'Course is not available' }, { status: 400 });

    const perSeat = pricePerSeat(course.price || 0, n);
    const total = perSeat * n;
    const cohortCode = `COHORT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const origin = new URL(req.url).origin;

    const cohort = await base44.asServiceRole.entities.CourseCohort.create({
      course_id: course.id, course_code: course.course_code, course_title: course.title,
      institution_name, contact_name: contact_name || '', contact_email,
      seats_purchased: n, seats_used: 0, price_per_seat: perSeat, total_amount: total,
      currency: course.currency || 'USD', status: 'pending_payment', cohort_code,
      created_at: new Date().toISOString()
    });

    const tx = await base44.asServiceRole.entities.Transaction.create({
      amount: total, currency: course.currency || 'USD',
      transaction_type: 'payment', payment_provider: 'stripe', status: 'pending',
      description: `Cohort enrolment: ${course.title} x${n} (${institution_name})`
    });

    const session = await buildCheckoutSession({
      plan: { name: `Cohort: ${course.title} (${n} seats)`, price: total, currency: course.currency, billing_interval: 'one_time' },
      customer_email: contact_email,
      success_url: `${origin}/Training?cohort=purchased&cohort_id=${cohort.id}`,
      cancel_url: `${origin}/Training?cohort=canceled`,
      metadata: { product_type: 'course_cohort', record_id: cohort.id, transaction_id: tx.id, course_id: course.id }
    });

    await base44.asServiceRole.entities.CourseCohort.update(cohort.id, { stripe_checkout_session_id: session.id });
    await base44.asServiceRole.entities.Transaction.update(tx.id, { provider_transaction_id: session.id });

    return Response.json({ url: session.url, session_id: session.id, cohort_id: cohort.id, cohort_code });
  } catch (error) {
    console.error('createCohortCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}