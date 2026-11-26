/**
 * Returns the URL only if its scheme is safe to open or link to (http, https, blob, mailto);
 * otherwise undefined. Blocks javascript:, data:, vbscript: and similar from stored user input.
 */
export function safeHttpUrl(value) {
  if (!value) return undefined;
  try {
    const u = new URL(String(value).trim(), window.location.origin);
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
