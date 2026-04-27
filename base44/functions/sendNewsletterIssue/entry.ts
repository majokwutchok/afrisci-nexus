import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://afriscinexus.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins/editors can trigger newsletters
    if (user?.role !== 'admin' && user?.role !== 'editor') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch recent published articles (limit 5)
    const recentArticles = await base44.asServiceRole.entities.Manuscript.filter(
      { status: 'published' },
      '-publication_date',
      5
    );

    if (!recentArticles || recentArticles.length === 0) {
      return Response.json(
        { error: 'No published articles found' },
        { status: 400 }
      );
    }

    // Get all active subscribers
    const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      is_active: true,
      is_confirmed: true
    });

    if (!subscribers || subscribers.length === 0) {
      return Response.json(
        { message: 'No confirmed subscribers', sent: 0 }
      );
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    if (!accessToken) {
      return Response.json(
        { error: 'Gmail connector not configured' },
        { status: 500 }
      );
    }

    // Generate featured articles section
    const featuredArticlesHtml = recentArticles.slice(0, 3).map((article, idx) => `
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin-top: 0; color: #0F172A; font-size: 18px;">
          ${idx + 1}. ${article.title}
        </h3>
        <p style="color: #666; font-size: 14px; margin: 10px 0;">
          <strong>Authors:</strong> ${article.authors?.map(a => a.name).join(', ') || 'N/A'}
        </p>
        <p style="color: #555; line-height: 1.6; margin: 15px 0;">
          ${article.abstract?.substring(0, 200)}...
        </p>
        <a href="${SITE_URL}/ManuscriptDetail?id=${article.id}" style="color: #0D9488; text-decoration: none; font-weight: bold;">
          Read Full Article →
        </a>
      </div>
    `).join('');

    // Build newsletter HTML
    const newsletterHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0 0 10px 0; font-size: 28px; }
          .header p { margin: 0; opacity: 0.9; }
          .content { background: white; padding: 30px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .divider { height: 2px; background: linear-gradient(90deg, #0D9488 0%, transparent 100%); margin: 20px 0; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; background: #0D9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .highlight { background: #f0fdf4; padding: 20px; border-radius: 6px; border-left: 4px solid #0D9488; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 AfriSci Nexus</h1>
            <p>Research Update</p>
          </div>
          
          <div class="content">
            <p>Hi there,</p>
            <p>This week's must-read research from across Africa:</p>
            
            <div class="divider"></div>
            
            <div>
              ${featuredArticlesHtml}
            </div>
            
            <div class="highlight">
              <p style="margin: 0 0 10px 0;"><strong>💡 Editorial Insights</strong></p>
              <p style="margin: 0;">African researchers continue to produce world-class scholarship addressing critical challenges in STEM, health, environment, and social sciences. Stay connected with the latest breakthroughs from our community.</p>
            </div>
            
            <div class="cta">
              <a href="${SITE_URL}/Publications" class="button">Browse All Articles</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>See something you like?</strong> Share with your network and help amplify African research globally.
            </p>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you subscribed to the AfriSci Nexus newsletter.</p>
            <p><a href="${SITE_URL}" style="color: #0D9488; text-decoration: none;">Visit our website</a> | <a href="#" style="color: #0D9488; text-decoration: none;">Unsubscribe</a></p>
            <p>© 2026 AfriSci Nexus. Advancing African Research Globally.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to each subscriber
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const message = {
          raw: Buffer.from(
            `From: newsletters@afriscinexus.com\r\nTo: ${subscriber.email}\r\nSubject: This Week in African Research - AfriSci Nexus\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${newsletterHtml}`
          ).toString('base64')
        };

        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }

    // Create newsletter record
    await base44.asServiceRole.entities.Newsletter.create({
      title: `Weekly Research Update - ${new Date().toLocaleDateString()}`,
      subject: 'This Week in African Research - AfriSci Nexus',
      featured_articles: recentArticles.slice(0, 5).map(a => ({
        manuscript_id: a.id,
        title: a.title,
        authors: a.authors?.map(a => a.name).join(', '),
        abstract_preview: a.abstract?.substring(0, 150)
      })),
      editorial_message: 'African researchers continue to produce world-class scholarship...',
      html_content: newsletterHtml,
      send_date: new Date().toISOString().split('T')[0],
      status: 'sent',
      recipient_count: sentCount,
      created_by: user.email
    });

    return Response.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: subscribers.length
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});