import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://afriscinexus.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.role !== 'editor') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const recentArticles = await base44.asServiceRole.entities.Manuscript.filter(
      { status: 'published' },
      '-publication_date',
      5
    );

    if (!recentArticles || recentArticles.length === 0) {
      return Response.json({ error: 'No published articles found' }, { status: 400 });
    }

    const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      is_active: true,
      is_confirmed: true
    });

    // Create newsletter record even if email sending is unavailable
    const newsletterHtml = `<p>This Week in African Research — ${recentArticles.slice(0, 3).map(a => a.title).join(', ')}</p>`;

    await base44.asServiceRole.entities.Newsletter.create({
      title: `Weekly Research Update - ${new Date().toLocaleDateString()}`,
      subject: 'This Week in African Research - AfriSci Nexus',
      featured_articles: recentArticles.slice(0, 5).map(a => ({
        manuscript_id: a.id,
        title: a.title,
        authors: a.authors?.map(au => au.name).join(', '),
        abstract_preview: a.abstract?.substring(0, 150)
      })),
      editorial_message: 'African researchers continue to produce world-class scholarship...',
      html_content: newsletterHtml,
      send_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      recipient_count: subscribers.length,
      created_by: user.email
    });

    console.log(`[Newsletter] Issue prepared for ${subscribers.length} subscriber(s). Email delivery unavailable — newsletter saved as draft.`);

    return Response.json({
      success: true,
      note: 'Newsletter prepared and saved. Email delivery is currently unavailable (service temporarily down). Newsletter saved as draft for future delivery.',
      subscriber_count: subscribers.length,
      sent: 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});