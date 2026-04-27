import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://afriscinexus.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name, confirmationToken } = await req.json();

    if (!email || !confirmationToken) {
      return Response.json(
        { error: 'Missing email or confirmation token' },
        { status: 400 }
      );
    }

    // Get Gmail connector access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    if (!accessToken) {
      return Response.json(
        { error: 'Gmail connector not configured' },
        { status: 500 }
      );
    }

    // Build confirmation link
    const confirmationLink = `${SITE_URL}/confirm-newsletter?token=${confirmationToken}&email=${encodeURIComponent(email)}`;

    // Build HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0D9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          .benefits { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0D9488; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 AfriSci Nexus</h1>
            <p>Welcome to Our Research Community</p>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>Thank you for subscribing to the AfriSci Nexus newsletter! You're joining thousands of researchers across Africa and globally who stay updated on cutting-edge African research.</p>
            
            <div class="benefits">
              <h3 style="margin-top: 0;">What to Expect:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Twice-Weekly Updates:</strong> Mondays and Thursdays at 9 AM UTC</li>
                <li><strong>Curated Research:</strong> Hand-selected articles from our journals</li>
                <li><strong>Editorial Insights:</strong> Analysis from our editorial board</li>
                <li><strong>Journal Announcements:</strong> New calls for papers and special issues</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${confirmationLink}" class="button">Confirm Your Email</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Or copy this link: <br>
              <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; word-break: break-all;">${confirmationLink}</code>
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              <strong>Questions?</strong> Reply to this email or visit <a href="${SITE_URL}">afriscinexus.com</a>
            </p>
          </div>
          <div class="footer">
            <p>You're receiving this email because you subscribed to the AfriSci Nexus newsletter.</p>
            <p>© 2026 AfriSci Nexus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send via Gmail API
    const message = {
      raw: Buffer.from(
        `From: newsletters@afriscinexus.com\r\nTo: ${email}\r\nSubject: Confirm Your Subscription to AfriSci Nexus Newsletter\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${htmlContent}`
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

    if (!response.ok) {
      const error = await response.text();
      console.error('Gmail API error:', error);
      return Response.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      );
    }

    return Response.json({ success: true, message: 'Confirmation email sent' });
  } catch (error) {
    console.error('Newsletter confirmation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});