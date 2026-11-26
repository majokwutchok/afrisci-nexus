// @ts-nocheck
// Accept only absolute http(s) URLs (no javascript:, data:, vbscript: or relative links).
export function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
