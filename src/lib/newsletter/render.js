// AfriSci Newsletter: branded, email-client-safe renderer.
// The SAME code runs in the browser (live preview) and on the server (sending):
// base44/shared/newsletterRender.ts is an exact copy. Edit both together.
// Brand matches the Email Center templates (shared/emailCore brandedLayout).
// House style: no dashes in wording.

export const NEWSLETTER_NAME = "AfriSci Newsletter";

export const BRAND = Object.freeze({
  brand: "#1E40AF",
  brandDark: "#1E3A8A",
  accent: "#F59E0B",
  page: "#EEF2F7",
  ink: "#0F172A",
  text: "#1E293B",
  muted: "#64748B",
  line: "#E2E8F0",
  panel: "#F8FAFC",
  sky: "#BFDBFE",
  font: "Segoe UI,Helvetica,Arial,sans-serif",
  site: "https://afriscinexus.com",
  footerAddress: "Head Office: Perth, Western Australia, Australia",
});

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only absolute http(s) links make it into the email. */
export function safeLink(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function clip(text, n) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(" ") > n * 0.6 ? cut.lastIndexOf(" ") : n).replace(/[,;:.]$/, "") + "…";
}

/** Plain text paragraphs (blank line separated) -> escaped <p> blocks. */
function paragraphs(text, style = "") {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;${style}">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const F = BRAND.font;

function button(label, url, { color = BRAND.brand, small = false } = {}) {
  const href = safeLink(url);
  if (!href || !label) return "";
  const pad = small ? "9px 18px" : "12px 26px";
  const size = small ? "14px" : "15px";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 6px;"><tr><td bgcolor="${color}" style="border-radius:8px;background:${color};"><a href="${esc(href)}" target="_blank" style="display:inline-block;padding:${pad};font-family:${F};font-size:${size};font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a></td></tr></table>`;
}

function sectionTitle(kicker, title) {
  return `<tr><td class="nl-pad" style="padding:30px 40px 6px;">
    <div style="font-family:${F};font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.accent};margin:0 0 4px;">${esc(kicker)}</div>
    <div style="font-family:${F};font-size:21px;font-weight:700;color:${BRAND.ink};line-height:1.3;">${esc(title)}</div>
    <div style="width:44px;height:3px;background:${BRAND.brand};margin-top:10px;font-size:0;line-height:3px;">&nbsp;</div>
  </td></tr>`;
}

function journalTag(a) {
  return a.journal ? `<div style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${BRAND.brand};margin:0 0 6px;">${esc(a.journal)}</div>` : "";
}

function metaLine(a, { forthcoming = false } = {}) {
  const bits = [];
  if (forthcoming) bits.push("Forthcoming");
  else if (a.date) bits.push(`Published ${esc(formatDate(a.date))}`);
  if (a.doi && !forthcoming) bits.push(`DOI <a href="https://doi.org/${esc(a.doi)}" style="color:${BRAND.muted};text-decoration:underline;">${esc(a.doi)}</a>`);
  return bits.length ? `<div style="font-family:${F};font-size:12px;color:${BRAND.muted};margin-top:8px;">${bits.join(" &nbsp;·&nbsp; ")}</div>` : "";
}

function leadArticle(a) {
  const url = safeLink(a.url);
  const cover = safeLink(a.cover);
  const title = url ? `<a href="${esc(url)}" style="color:${BRAND.ink};text-decoration:none;">${esc(a.title)}</a>` : esc(a.title);
  const visual = cover
    ? `<img src="${esc(cover)}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:10px 10px 0 0;">`
    : `<div style="background:${BRAND.brand};background-image:linear-gradient(135deg,${BRAND.brandDark},${BRAND.brand});border-radius:10px 10px 0 0;padding:22px 24px;">
         <div style="font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.accent};">Lead article</div>
         <div style="font-family:${F};font-size:14px;color:${BRAND.sky};margin-top:4px;">${esc(a.journal || "AfriSci Nexus")}</div>
       </div>`;
  return `<tr><td class="nl-pad" style="padding:14px 40px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.line};border-radius:10px;">
      <tr><td style="padding:0;">${visual}</td></tr>
      <tr><td style="padding:18px 22px 20px;font-family:${F};">
        ${cover ? journalTag(a) : ""}
        <div style="font-size:19px;font-weight:700;line-height:1.35;color:${BRAND.ink};">${title}</div>
        ${a.authors ? `<div style="font-size:13px;color:${BRAND.muted};margin-top:6px;">${esc(clip(a.authors, 140))}</div>` : ""}
        ${a.abstract ? `<div style="font-size:14px;line-height:1.6;color:${BRAND.text};margin-top:10px;">${esc(clip(a.abstract, 320))}</div>` : ""}
        ${metaLine(a)}
        ${button("Read the article", url, { small: true })}
      </td></tr>
    </table>
  </td></tr>`;
}

function articleCard(a, { forthcoming = false, compact = false } = {}) {
  const url = forthcoming ? "" : safeLink(a.url);
  const title = url ? `<a href="${esc(url)}" style="color:${BRAND.ink};text-decoration:none;">${esc(a.title)}</a>` : esc(a.title);
  const badge = forthcoming
    ? `<span style="display:inline-block;font-family:${F};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#92400E;background:#FEF3C7;border-radius:999px;padding:3px 9px;margin-bottom:6px;">Coming soon</span>`
    : "";
  return `<tr><td class="nl-pad" style="padding:8px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.panel};border:1px solid ${BRAND.line};border-left:4px solid ${forthcoming ? BRAND.accent : BRAND.brand};border-radius:8px;">
      <tr><td style="padding:14px 18px;font-family:${F};">
        ${badge}${journalTag(a)}
        <div style="font-size:16px;font-weight:700;line-height:1.4;color:${BRAND.ink};">${title}</div>
        ${a.authors ? `<div style="font-size:13px;color:${BRAND.muted};margin-top:4px;">${esc(clip(a.authors, 120))}</div>` : ""}
        ${!compact && a.abstract ? `<div style="font-size:14px;line-height:1.6;color:${BRAND.text};margin-top:8px;">${esc(clip(a.abstract, 220))}</div>` : ""}
        ${metaLine(a, { forthcoming })}
        ${url ? `<div style="margin-top:8px;"><a href="${esc(url)}" style="font-family:${F};font-size:14px;font-weight:600;color:${BRAND.brand};text-decoration:none;">Read article &rarr;</a></div>` : ""}
      </td></tr>
    </table>
  </td></tr>`;
}

function spotlight(sol) {
  if (!sol || !sol.title) return "";
  const points = (sol.points || []).filter(Boolean);
  return `${sectionTitle(sol.series_label || "Publishing Solutions Series", sol.title)}
  <tr><td class="nl-pad" style="padding:12px 40px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-left:4px solid ${BRAND.accent};border-radius:10px;">
      <tr><td style="padding:18px 22px;font-family:${F};font-size:15px;line-height:1.65;color:${BRAND.text};">
        ${paragraphs(sol.body)}
        ${points.length ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px;">${points
          .map((pt) => `<tr><td valign="top" style="padding:3px 10px 3px 0;font-family:${F};font-size:15px;color:${BRAND.accent};font-weight:700;">✦</td><td style="padding:3px 0;font-family:${F};font-size:14px;line-height:1.55;color:${BRAND.text};">${esc(pt)}</td></tr>`)
          .join("")}</table>` : ""}
        ${button(sol.cta_label, sol.cta_url, { small: true })}
      </td></tr>
    </table>
  </td></tr>`;
}

function ideaBlocks(ideas) {
  const list = (ideas || []).filter((i) => i && i.title);
  if (!list.length) return "";
  return `${sectionTitle("From the editorial desk", "This week at AfriSci Nexus")}
  ${list.map((i) => `<tr><td class="nl-pad" style="padding:10px 40px;font-family:${F};">
      <div style="font-size:16px;font-weight:700;color:${BRAND.ink};margin:0 0 4px;">${esc(i.title)}</div>
      <div style="font-size:15px;line-height:1.65;color:${BRAND.text};">${paragraphs(i.body, "margin-bottom:6px;")}</div>
      ${i.cta_url && safeLink(i.cta_url) ? `<a href="${esc(safeLink(i.cta_url))}" style="font-family:${F};font-size:14px;font-weight:600;color:${BRAND.brand};text-decoration:none;">${esc(i.cta_label || "Find out more")} &rarr;</a>` : ""}
    </td></tr>`).join("")}`;
}

/**
 * issue: { issue_number, issue_date, headline, editorial_message, journal_title, subject,
 *          sections: { new_articles[], highlight_articles[], upcoming_articles[], solution, ideas[], cta },
 *          articles: { [id]: { title, authors, journal, abstract, url, doi, date, cover } } }
 * opts:  { site, unsubscribeUrl, recipientNote }
 */
export function renderNewsletter(issue = {}, opts = {}) {
  const site = String(opts.site || BRAND.site).replace(/\/$/, "");
  const S = issue.sections || {};
  const A = issue.articles || {};
  const pickList = (ids) => (ids || []).map((id) => A[id] ? { id, ...A[id] } : null).filter(Boolean);
  const fresh = pickList(S.new_articles);
  const picks = pickList(S.highlight_articles);
  const upcoming = pickList(S.upcoming_articles);
  const dateText = formatDate(issue.issue_date || new Date().toISOString());
  const issueBits = [issue.issue_number ? `Issue ${issue.issue_number}` : "", dateText, issue.journal_title ? `${issue.journal_title} edition` : "Weekly"].filter(Boolean);
  const subject = issue.subject || `${NEWSLETTER_NAME}${issue.issue_number ? ` · Issue ${issue.issue_number}` : ""}`;
  const preheader = issue.headline || (fresh[0] ? `New research: ${fresh[0].title}` : "This week in African research");
  const cta = S.cta && S.cta.label ? S.cta : { label: "Submit your manuscript", url: `${site}/Submit` };
  const unsub = safeLink(opts.unsubscribeUrl);
  const link = (path, text) => `<a href="${esc(site + path)}" style="color:${BRAND.brand};text-decoration:none;">${text}</a>`;

  let body = "";
  // Editor's note
  if (issue.editorial_message) {
    body += `<tr><td class="nl-pad" style="padding:26px 40px 0;font-family:${F};font-size:15px;line-height:1.7;color:${BRAND.text};">${paragraphs(issue.editorial_message)}</td></tr>`;
  }
  // Newly published
  if (fresh.length) {
    body += sectionTitle("Newly published", fresh.length === 1 ? "Fresh off the press" : `${fresh.length} new articles this week`);
    body += leadArticle(fresh[0]);
    fresh.slice(1).forEach((a) => (body += articleCard(a)));
  }
  // Archive picks
  if (picks.length) {
    body += sectionTitle("From the archive", "Editor's picks worth reading");
    picks.forEach((a) => (body += articleCard(a, { compact: true })));
  }
  // Coming soon
  if (upcoming.length) {
    body += sectionTitle("Future publications", "Coming soon to AfriSci Nexus");
    upcoming.forEach((a) => (body += articleCard(a, { forthcoming: true, compact: true })));
  }
  body += spotlight(S.solution);
  body += ideaBlocks(S.ideas);
  // Closing call to action
  body += `<tr><td class="nl-pad" style="padding:30px 40px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.brand};border-radius:12px;">
      <tr><td style="padding:24px 26px;font-family:${F};">
        <div style="font-size:19px;font-weight:700;color:#ffffff;">Publish your next paper with AfriSci Nexus</div>
        <div style="font-size:14px;line-height:1.6;color:${BRAND.sky};margin-top:6px;">Open access, rigorous peer review and permanent DOIs across twelve journals.</div>
        ${button(cta.label, safeLink(cta.url) || `${site}/Submit`, { color: BRAND.accent })}
      </td></tr>
    </table>
  </td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<style>
  body{margin:0;padding:0;background:${BRAND.page};}
  a{color:${BRAND.brand};}
  @media (max-width:620px){ .nl-wrap{width:100%!important;} .nl-pad{padding-left:20px!important;padding-right:20px!important;} }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.page};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" class="nl-wrap" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);">
    <tr><td bgcolor="${BRAND.brand}" class="nl-pad" style="background:${BRAND.brand};padding:26px 40px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="bottom">
          <div style="font-family:${F};font-size:24px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">✦&nbsp;AfriSci<span style="color:${BRAND.accent};">Nexus</span></div>
          <div style="font-family:${F};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.sky};margin-top:4px;">African Scientific Excellence</div>
        </td>
        <td valign="bottom" align="right" style="font-family:${F};font-size:12px;color:${BRAND.sky};white-space:nowrap;">${esc(issueBits[0] || "")}</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${BRAND.accent};">&nbsp;</td></tr>
    <tr><td class="nl-pad" style="padding:30px 40px 0;">
      <div style="font-family:${F};font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.brand};">${esc(NEWSLETTER_NAME)}</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:700;color:${BRAND.ink};margin:8px 0 8px;">${esc(issue.headline || "This week in African research")}</div>
      <div style="font-family:${F};font-size:13px;color:${BRAND.muted};">${esc(issueBits.join(" · "))}</div>
      <div style="height:1px;background:${BRAND.line};margin-top:18px;font-size:0;line-height:1px;">&nbsp;</div>
    </td></tr>
    ${body}
    <tr><td class="nl-pad" style="padding:22px 40px 30px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${BRAND.line};padding-top:18px;font-family:${F};font-size:12px;line-height:1.7;color:${BRAND.muted};">
        <strong style="color:#334155;">AfriSci Nexus</strong> · Open access, peer reviewed African research<br>
        ISSN (Online) 3079-4730 · Crossref DOI prefix 10.67418 · COPE member<br>
        ${esc(BRAND.footerAddress)}<br>
        ${link("/Home", "Website")} &nbsp;·&nbsp; ${link("/Publications", "All articles")} &nbsp;·&nbsp; ${link("/Journals", "Journals")} &nbsp;·&nbsp; ${link("/Submit", "Submit a manuscript")} &nbsp;·&nbsp; ${link("/Contact", "Contact")}
      </td></tr></table>
    </td></tr>
  </table>
  <div style="font-family:${F};font-size:11px;line-height:1.6;color:#94A3B8;padding:14px 8px 0;max-width:600px;">
    You are receiving ${esc(NEWSLETTER_NAME)} ${esc(opts.recipientNote || "because you subscribed to updates or publish with AfriSci Nexus")}.
    ${unsub ? `<a href="${esc(unsub)}" style="color:#64748B;text-decoration:underline;">Unsubscribe</a> at any time.` : ""}
  </div>
</td></tr>
</table>
</body>
</html>`;

  // Plain text alternative
  const lines = [`${NEWSLETTER_NAME}`, issueBits.join(" · "), "", issue.headline || "", ""];
  if (issue.editorial_message) lines.push(String(issue.editorial_message).trim(), "");
  const addList = (label, list, forthcoming) => {
    if (!list.length) return;
    lines.push(label.toUpperCase());
    list.forEach((a) => {
      lines.push(`* ${a.title}${a.journal ? ` (${a.journal})` : ""}`);
      if (a.authors) lines.push(`  ${clip(a.authors, 120)}`);
      if (!forthcoming && safeLink(a.url)) lines.push(`  ${safeLink(a.url)}`);
    });
    lines.push("");
  };
  addList("Newly published", fresh);
  addList("From the archive", picks);
  addList("Coming soon", upcoming, true);
  if (S.solution && S.solution.title) {
    lines.push(`${(S.solution.series_label || "Publishing Solutions Series").toUpperCase()}: ${S.solution.title}`, String(S.solution.body || "").trim());
    (S.solution.points || []).forEach((p) => lines.push(`* ${p}`));
    if (safeLink(S.solution.cta_url)) lines.push(safeLink(S.solution.cta_url));
    lines.push("");
  }
  (S.ideas || []).filter((i) => i && i.title).forEach((i) => {
    lines.push(i.title, String(i.body || "").trim());
    if (safeLink(i.cta_url)) lines.push(safeLink(i.cta_url));
    lines.push("");
  });
  lines.push(`${cta.label}: ${safeLink(cta.url) || site + "/Submit"}`, "", `AfriSci Nexus · ${site}`);
  if (unsub) lines.push(`Unsubscribe: ${unsub}`);

  return { subject, preheader, html, text: lines.join("\n").replace(/\n{3,}/g, "\n\n") };
}
