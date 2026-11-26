// Inline files editors upload (PDF/Word/images) are stored as data: URLs; those types are allowed.
// data:text/html, data:image/svg+xml and any other type that can run script are not.
const SAFE_DATA_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

/**
 * Returns the URL only if it is safe to open or link to (http, https, blob, mailto, or a data: URL
 * of a document/image type); otherwise undefined. Blocks javascript:, vbscript:, data:text/html, etc.
 */
export function safeHttpUrl(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (/^data:/i.test(raw)) {
    const mime = raw.slice(5).split(/[;,]/)[0].trim().toLowerCase();
    return SAFE_DATA_TYPES.includes(mime) ? raw : undefined;
  }
  try {
    const u = new URL(raw, window.location.origin);
    return ["http:", "https:", "blob:", "mailto:"].includes(u.protocol) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** window.open that refuses unsafe URL schemes. */
export function safeOpen(value, target = "_blank", features) {
  const url = safeHttpUrl(value);
  if (!url) return null;
  return window.open(url, target, features);
}
