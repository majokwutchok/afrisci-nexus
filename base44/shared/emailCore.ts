// @ts-nocheck
// AfriSci Nexus Email Center — generated from the email-center package (shared/emailCore.js).
// AfriSci Nexus — Email Core
// Single source of truth for rendering, branding, sanitising, addressing and
// webhook verification. Plain ES module with no dependencies so the exact same
// code runs in the browser (live preview), in Deno (Base44 backend functions)
// and in Node (tests). scripts/build.mjs inlines this file into each function.

export const DEFAULT_SETTINGS = Object.freeze({
  from_name: "AfriSci Nexus Editorial Office",
  from_email: "editorial@afriscinexus.com",
  inbound_domain: "ulkudelook.resend.app",
  reply_local_part: "reply",
  fallback_reply_to: "",
  bcc_archive: "",
  brand_color: "#1E40AF",
  accent_color: "#F59E0B",
  logo_url: "",
  website_url: "https://afriscinexus.com",
  default_editor_name: "Dr. Majok Wutchok, PhD",
  default_editor_title: "Chief Editor",
  signature_html:
    "<p>Kind regards,</p><p><strong>{{editor_name}}</strong><br>{{editor_title}}<br>AfriSci Nexus Editorial Office</p>",
  footer_address: "Head Office: Perth, Western Australia, Australia",
  staff_roles: "admin",
});

// Every variable the templates understand, with a label for the UI and a
// sample value for previews. `multiline` values keep their line breaks.
export const VARIABLE_CATALOG = Object.freeze({
  recipient_name: { label: "Recipient name", sample: "Dr Amina Hassan" },
  manuscript_title: { label: "Manuscript title", sample: "Climate Resilient Maize Varieties in the Sahel: A Multi Site Field Trial" },
  manuscript_id: { label: "Manuscript ID", sample: "AFS7A9AFDF4" },
  journal_name: { label: "Journal", sample: "AfriSci Journal of Agriculture and Environment" },
  submission_date: { label: "Submission date", sample: "12 September 2026" },
  decision_date: { label: "Decision date", sample: "23 October 2026", auto: "today" },
  revision_deadline: { label: "Revision deadline", sample: "22 November 2026" },
  review_deadline: { label: "Review deadline", sample: "13 November 2026" },
  editor_comments: { label: "Editor comments", sample: "The manuscript is well written and addresses an important question.", multiline: true },
  reviewer_comments: { label: "Reviewer comments", sample: "Reviewer 1: Please clarify the sampling frame in Section 2.\nReviewer 2: The discussion would benefit from comparison with East African trials.", multiline: true },
  rejection_reason: { label: "Reason for decision", sample: "The scope of the study falls outside the aims of the journal.", multiline: true },
  doi: { label: "DOI", sample: "10.67418/afrisci.2026.7a9afdf4" },
  article_url: { label: "Article URL", sample: "https://afriscinexus.com/ManuscriptDetail?id=example" },
  proofs_url: { label: "Proofs URL", sample: "https://afriscinexus.com/MyManuscripts" },
  apc_amount: { label: "APC amount", sample: "USD 250" },
  invoice_number: { label: "Invoice number", sample: "INV20260388" },
  payment_link: { label: "Payment link", sample: "https://afriscinexus.com/MyManuscripts" },
  payment_due_date: { label: "Payment due date", sample: "6 November 2026" },
  amount_paid: { label: "Amount paid", sample: "USD 250" },
  role_name: { label: "Role", sample: "Associate Editor" },
  institution_name: { label: "Institution", sample: "University of Nairobi" },
  custom_message: { label: "Message", sample: "Thank you for getting in touch with AfriSci Nexus.", multiline: true },
  missing_items: { label: "Missing items", sample: "A signed cover letter\nThe completed author declaration form", multiline: true },
  formatting_issues: { label: "Changes needed", sample: "Please add line numbers to the main text.\nPlease supply figures as separate high resolution files.", multiline: true },
  withdrawal_reason: { label: "Withdrawal reason", sample: "The authors wish to include additional field data.", multiline: true },
  waiver_amount: { label: "Waiver granted", sample: "a full waiver (100 percent of the APC)" },
  current_stage: { label: "Current stage", sample: "peer review" },
  expected_timeline: { label: "Expected timeline", sample: "within the next three weeks" },
  call_title: { label: "Call title", sample: "Climate Adaptation and Food Security in Africa" },
  call_deadline: { label: "Submission deadline", sample: "31 January 2027" },
  certificate_url: { label: "Certificate link", sample: "https://afriscinexus.com/VerifyCertificate" },
  editor_name: { label: "Editor name", sample: "Dr. Majok Wutchok, PhD", auto: "editor" },
  editor_title: { label: "Editor title", sample: "Chief Editor", auto: "editor" },
  portal_url: { label: "Portal URL", sample: "https://afriscinexus.com", auto: "website" },
});

// ---------------------------------------------------------------- utilities

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const VAR_RE = /\{\{\s*(?!else\s*\}\})([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
// Matches an innermost if-block only (its body contains no further {{#if), so
// nested blocks resolve inside-out and each {{else}}/{{/if}} pairs correctly.
const NO_IF = "(?:(?!\\{\\{#if\\s)[\\s\\S])*?";
const IF_RE = new RegExp(
  `\\{\\{#if\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\}\\}(${NO_IF})(?:\\{\\{else\\}\\}(${NO_IF}))?\\{\\{\\/if\\}\\}`,
);

/** Names of all {{variables}} used in any of the given strings (incl. #if). */
export function extractVariables(...strings) {
  const found = new Set();
  for (const s of strings) {
    if (!s) continue;
    for (const m of String(s).matchAll(VAR_RE)) found.add(m[1]);
    for (const m of String(s).matchAll(/\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g)) found.add(m[1]);
  }
  return [...found];
}

function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/**
 * Substitute {{vars}} and resolve {{#if var}}…{{else}}…{{/if}} blocks.
 * html=true escapes values and keeps line breaks for multiline content.
 * Unknown/empty variables are left as {{name}} and reported in `missing`.
 */
export function renderString(template, vars = {}, { html = true } = {}) {
  let out = String(template ?? "");
  // Resolve innermost if-blocks repeatedly so simple nesting works.
  for (let guard = 0; guard < 50 && IF_RE.test(out); guard++) {
    out = out.replace(IF_RE, (_m, name, yes, no) => (hasValue(vars[name]) ? yes : no ?? ""));
  }
  const missing = new Set();
  out = out.replace(VAR_RE, (m, name) => {
    if (!hasValue(vars[name])) {
      missing.add(name);
      return m;
    }
    const raw = String(vars[name]);
    if (!html) return raw.replace(/[\r\n]+/g, " ").trim();
    return escapeHtml(raw).replace(/\r?\n/g, "<br>");
  });
  return { output: out, missing: [...missing] };
}

function safeUrl(url) {
  const u = String(url || "").trim().replace(/&amp;/g, "&");
  if (/^(https?:|mailto:)/i.test(u)) return u;
  return "";
}

/** Shortcodes that stay readable in the editor: [button: Label | url] and [box]…[/box]. */
export function applyShortcodes(html, settings = DEFAULT_SETTINGS) {
  const brand = settings.brand_color || DEFAULT_SETTINGS.brand_color;
  const accent = settings.accent_color || DEFAULT_SETTINGS.accent_color;
  let out = String(html ?? "");
  out = out.replace(/\[button:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]/gi, (_m, label, url) => {
    const href = safeUrl(url);
    if (!href) return "";
    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;"><tr>` +
      `<td bgcolor="${brand}" style="border-radius:8px;background:${brand};">` +
      `<a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label.trim()}</a>` +
      `</td></tr></table>`
    );
  });
  out = out.replace(/\[box\]([\s\S]*?)\[\/box\]/gi, (_m, inner) =>
    `<div style="margin:18px 0;padding:16px 18px;background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid ${accent};border-radius:8px;">${inner}</div>`,
  );
  return out;
}

/** Defensive HTML sanitiser for admin-authored bodies (no DOM needed). */
export function sanitizeHtml(html) {
  let out = String(html ?? "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[^>]*\/?>/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/\s+(href|src)\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\2/gi, "");
  out = out.replace(/\s+(href|src)\s*=\s*(javascript|vbscript|data):[^\s>]+/gi, "");
  out = out.replace(/expression\s*\(/gi, "");
  return out;
}

export function htmlToText(html) {
  return String(html ?? "")
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const l = label.replace(/<[^>]+>/g, "").trim();
      return l && l !== href ? `${l} (${href})` : href;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n  • ")
    .replace(/<\/(p|div|h[1-6]|tr|table|ul|ol|blockquote)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------- branding

/** Wrap a rendered body in the AfriSci Nexus branded, email-client-safe layout. */
export function brandedLayout({ bodyHtml, subject = "", preheader = "", headerLabel = "", settings = {} }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const brand = s.brand_color;
  const accent = s.accent_color;
  const site = s.website_url.replace(/\/$/, "");
  const font = "Segoe UI,Helvetica,Arial,sans-serif";
  const logo = safeUrl(s.logo_url)
    ? `<img src="${escapeHtml(s.logo_url)}" alt="AfriSci Nexus" height="40" style="display:block;height:40px;border:0;">`
    : `<div style="font-family:${font};font-size:24px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">✦&nbsp;AfriSci<span style="color:${accent};">Nexus</span></div>` +
      `<div style="font-family:${font};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#BFDBFE;margin-top:4px;">African Scientific Excellence</div>`;
  const label = headerLabel
    ? `<div style="font-family:${font};font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${brand};margin:0 0 14px;">${escapeHtml(headerLabel)}</div>`
    : "";
  const link = (path, text) =>
    `<a href="${escapeHtml(site + path)}" style="color:${brand};text-decoration:none;">${text}</a>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
<style>
  body{margin:0;padding:0;background:#EEF2F7;}
  a{color:${brand};}
  .em-body p{margin:0 0 14px;}
  .em-body h2{font-size:19px;margin:0 0 12px;color:#0F172A;}
  .em-body ul,.em-body ol{margin:0 0 14px;padding-left:22px;}
  @media (max-width:620px){ .em-wrap{width:100%!important;} .em-pad{padding-left:22px!important;padding-right:22px!important;} }
</style>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F7;">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" class="em-wrap" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);">
    <tr><td bgcolor="${brand}" class="em-pad" style="background:${brand};padding:26px 40px 22px;">${logo}</td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${accent};">&nbsp;</td></tr>
    <tr><td class="em-pad em-body" style="padding:34px 40px 10px;font-family:${font};font-size:15px;line-height:1.65;color:#1E293B;">
      ${label}${bodyHtml}
    </td></tr>
    <tr><td class="em-pad" style="padding:6px 40px 30px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #E2E8F0;padding-top:18px;font-family:${font};font-size:12px;line-height:1.7;color:#64748B;">
        <strong style="color:#334155;">AfriSci Nexus</strong> · Open access, peer reviewed African research<br>
        ISSN (Online) 3079-4730 · Crossref DOI prefix 10.67418 · COPE member<br>
        ${escapeHtml(s.footer_address)}<br>
        ${link("/Home", "Website")} &nbsp;·&nbsp; ${link("/Submit", "Submit a manuscript")} &nbsp;·&nbsp; ${link("/MyManuscripts", "Track submission")} &nbsp;·&nbsp; ${link("/Contact", "Contact")}
      </td></tr></table>
    </td></tr>
  </table>
  <div style="font-family:${font};font-size:11px;color:#94A3B8;padding:14px 8px 0;max-width:600px;">
    You are receiving this message from the AfriSci Nexus editorial office in connection with your submission, review or account. Reply directly to this email to reach us.
  </div>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Full pipeline: template strings + variables -> {subject, html, text, missing}.
 * `bodyHtml` / `subject` are the (possibly edited) template strings.
 */
export function composeEmail({ subject, bodyHtml, variables = {}, settings = {}, headerLabel = "", includeSignature = true }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const vars = withAutoVariables(variables, s);
  const subj = renderString(subject, vars, { html: false });
  const cleanBody = sanitizeHtml(bodyHtml);
  const sig = includeSignature ? sanitizeHtml(s.signature_html) : "";
  const body = renderString(cleanBody + (sig ? `\n${sig}` : ""), vars, { html: true });
  const finalBody = applyShortcodes(body.output, s);
  // Inbox preview line: first substantive sentence, skipping the greeting.
  const preheader = htmlToText(finalBody).split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 20 && !/^(dear|hi|hello|greetings)\b/i.test(l))?.slice(0, 140) || "";
  const html = brandedLayout({ bodyHtml: finalBody, subject: subj.output, preheader, headerLabel, settings: s });
  const missing = [...new Set([...subj.missing, ...body.missing])];
  return { subject: subj.output, html, text: htmlToText(finalBody), missing };
}

export function withAutoVariables(variables = {}, settings = {}) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const v = { ...variables };
  if (!hasValue(v.decision_date)) v.decision_date = today;
  if (!hasValue(v.portal_url)) v.portal_url = s.website_url;
  if (!hasValue(v.editor_name)) v.editor_name = s.default_editor_name;
  if (!hasValue(v.editor_title)) v.editor_title = s.default_editor_title;
  return v;
}

// ---------------------------------------------------------------- addresses

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || "").trim());
}

/** "Jane Doe <jane@x.org>" | "jane@x.org" -> { name, email } (email lower-cased). */
export function parseAddress(input) {
  const str = String(input || "").trim();
  const m = str.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: "", email: str.toLowerCase() };
}

export function parseAddressList(input) {
  const arr = Array.isArray(input) ? input : String(input || "").split(/[,;\n]+/);
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    if (!item || !String(item).trim()) continue;
    const a = parseAddress(item);
    if (!a.email || seen.has(a.email)) continue;
    seen.add(a.email);
    out.push(a);
  }
  return out;
}

export function formatAddress({ name, email }) {
  if (!name) return email;
  return `"${String(name).replace(/["\\]/g, "")}" <${email}>`;
}

export function normalizeSubject(subject) {
  let s = String(subject || "").trim();
  for (let i = 0; i < 10; i++) {
    const next = s.replace(/^\s*(re|fw|fwd|aw|tr|sv)\s*(\[\d+\])?\s*:\s*/i, "");
    if (next === s) break;
    s = next;
  }
  return s.replace(/\s+/g, " ").toLowerCase();
}

// ---------------------------------------------------------------- crypto

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function bytesToBase64(buf) {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin);
}
function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmac(keyBytes, message) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Signed per-thread token so replies thread reliably and can't be spoofed into other threads. */
export async function makeThreadToken(threadId, secret) {
  const sig = bytesToHex(await hmac(new TextEncoder().encode(secret || "afrisci"), `thread:${threadId}`)).slice(0, 10);
  return `${threadId}.${sig}`;
}

export async function threadReplyAddress(threadId, settings, secret) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!s.inbound_domain) return s.fallback_reply_to || s.from_email;
  return `${s.reply_local_part}+${await makeThreadToken(threadId, secret)}@${s.inbound_domain}`;
}

/** Find and verify a thread token in any of the given recipient addresses. Returns threadId or null. */
export async function findThreadIdInAddresses(addresses, settings, secret) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const lp = s.reply_local_part.toLowerCase();
  for (const raw of addresses || []) {
    const { email } = parseAddress(raw);
    const m = email.match(new RegExp(`^${lp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\+([a-z0-9_-]+)\\.([a-f0-9]{10})@`, "i"));
    if (!m) continue;
    const expected = await makeThreadToken(m[1], secret);
    if (timingSafeEqual(expected.toLowerCase(), `${m[1]}.${m[2]}`.toLowerCase())) return m[1];
  }
  return null;
}

/**
 * Verify a Svix-signed webhook (used by Resend). headers: plain object or Headers.
 * secret: "whsec_..." string. Returns true/false.
 */
export async function verifySvixSignature(payload, headers, secret, { toleranceSec = 300, now = Date.now() } = {}) {
  const get = (k) => (typeof headers?.get === "function" ? headers.get(k) : headers?.[k] ?? headers?.[k.toLowerCase()]);
  const id = get("svix-id") || get("webhook-id");
  const ts = get("svix-timestamp") || get("webhook-timestamp");
  const sigHeader = get("svix-signature") || get("webhook-signature");
  if (!id || !ts || !sigHeader || !secret) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now / 1000 - tsNum) > toleranceSec) return false;
  const keyBytes = base64ToBytes(String(secret).replace(/^whsec_/, ""));
  const expected = bytesToBase64(await hmac(keyBytes, `${id}.${ts}.${payload}`));
  return sigHeader.split(" ").some((part) => {
    const [ver, sig] = part.split(",");
    return ver === "v1" && sig && timingSafeEqual(sig, expected);
  });
}

/** Test helper / reference implementation of the Svix signer. */
export async function signSvix(payload, secret, id = "msg_test", ts = Math.floor(Date.now() / 1000)) {
  const keyBytes = base64ToBytes(String(secret).replace(/^whsec_/, ""));
  const sig = bytesToBase64(await hmac(keyBytes, `${id}.${ts}.${payload}`));
  return { "svix-id": id, "svix-timestamp": String(ts), "svix-signature": `v1,${sig}` };
}

export function makeMessageId(domain = "afriscinexus.com") {
  const rand = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
  return `<${rand}@${domain}>`;
}

export function snippetFrom(text, len = 160) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, len);
}
