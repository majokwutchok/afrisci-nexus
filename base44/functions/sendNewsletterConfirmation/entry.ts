import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { email, name, confirmationToken } = await req.json();

    if (!email || !confirmationToken) {
      return Response.json({ error: 'Missing email or confirmation token' }, { status: 400 });
    }

    // Email service is not available. Subscriber is already saved in the database.
    // Auto-confirm the subscription so users don't get stuck waiting for an email.
    const base44 = createClientFromRequest(req);

    const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      email,
      confirmation_token: confirmationToken
    });

    if (subscribers.length > 0) {
      await base44.asServiceRole.entities.NewsletterSubscriber.update(subscribers[0].id, {
        is_confirmed: true
      });
    }

    console.log(`[Newsletter] Subscriber ${email} auto-confirmed (email service temporarily unavailable).`);

    return Response.json({
      success: true,
      message: 'Subscription confirmed automatically (email service temporarily unavailable)',
      auto_confirmed: true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});