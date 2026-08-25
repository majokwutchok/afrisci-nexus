import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { activateSubscription } from '../../shared/subscriptionLifecycle.ts';
import { fulfillJobPost, fulfillAdPlacement, fulfillCourseEnrolment, fulfillCourseCohort } from '../../shared/orderFulfillment.ts';

function timingSafeEqual(a, b) {
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) return Response.json({ error: 'Webhook secret not configured' }, { status: 503 });

    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature') || '';
    const ts = sig.split(',').find(p => p.startsWith('t='))?.split('=')[1];
    const v1 = sig.split(',').find(p => p.startsWith('v1='))?.split('=')[1];
    if (!ts || !v1) return Response.json({ error: 'Invalid signature format' }, { status: 400 });

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${rawBody}`));
    const sigHex = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');

    if (sigHex.length !== v1.length || !timingSafeEqual(sigHex, v1)) {
      return Response.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const md = session?.metadata || {};
      if (md.subscription_id) {
        await activateSubscription(base44, md.subscription_id);
      } else if (md.product_type === 'job_post' && md.record_id) {
        await fulfillJobPost(base44, md.record_id, md.transaction_id);
      } else if (md.product_type === 'ad_placement' && md.record_id) {
        await fulfillAdPlacement(base44, md.record_id, md.transaction_id);
      } else if (md.product_type === 'course_enrolment' && md.record_id) {
        await fulfillCourseEnrolment(base44, md.record_id, md.transaction_id);
      } else if (md.product_type === 'course_cohort' && md.record_id) {
        await fulfillCourseCohort(base44, md.record_id, md.transaction_id);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}