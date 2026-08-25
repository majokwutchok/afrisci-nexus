// Sends a course-completion certificate notification to a learner through the
// app builder's linked Gmail account (gmail.send OAuth scope). Credit-free:
// uses the Gmail connector, not a Core integration. Always non-blocking on
// failure so certificate issuance never depends on email delivery.

const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toBase64UrlUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendCertificateEmail(base44, cert) {
  try {
    const { user_name, user_email, course_title, course_code, certificate_code, issue_date } = cert;
    if (!user_email) return { sent: false, reason: 'no recipient email' };

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    if (!accessToken) return { sent: false, reason: 'Gmail not connected' };

    const verifyUrl = `https://afriscinexus.base44.app/VerifyCertificate?code=${encodeURIComponent(certificate_code)}`;
    const dateStr = new Date(issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const subject = `Your certificate for ${course_title} is ready`;

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#1e3a8a,#0d9488);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">AfriSci Nexus Discovery</h1>
      <p style="color:#dbeafe;margin:6px 0 0;font-size:13px;">Advancing African Scientific Research Globally</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Your certificate is ready</h2>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Congratulations, <strong>${esc(user_name)}</strong>. You have successfully completed the training course and your verifiable certificate has been issued.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Course</p>
        <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:bold;">${esc(course_title)}</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Course ID</p>
        <p style="margin:0 0 16px;color:#0f172a;font-size:14px;font-family:monospace;">${esc(course_code)}</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Certificate ID</p>
        <p style="margin:0 0 16px;color:#0f172a;font-size:14px;font-family:monospace;">${esc(certificate_code)}</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Issued</p>
        <p style="margin:0;color:#0f172a;font-size:14px;">${dateStr}</p>
      </div>
      <p style="text-align:center;margin:24px 0;">
        <a href="${verifyUrl}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;display:inline-block;">Download your certificate</a>
      </p>
      <p style="color:#64748b;font-size:13px;line-height:1.6;">If the button does not work, copy this link into your browser: ${verifyUrl}</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">This certificate can be independently verified at the link above. AfriSci Nexus Discovery is an initiative of AfriSci Nexus.</p>
    </div>
  </div>
</body></html>`;

    const raw = `To: ${user_email}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}`;
    const b64 = toBase64UrlUtf8(raw);

    const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: b64 })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('Gmail send failed:', err?.error?.message || resp.status);
      return { sent: false, reason: err?.error?.message || String(resp.status) };
    }
    return { sent: true };
  } catch (error) {
    console.error('sendCertificateEmail error:', error?.message || error);
    return { sent: false, reason: error?.message || 'unknown' };
  }
}