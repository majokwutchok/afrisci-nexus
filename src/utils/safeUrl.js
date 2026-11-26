/** Returns the URL only if it is an absolute http(s) link; otherwise undefined (blocks javascript:, data: …). */
export function safeHttpUrl(value) {
  if (!value) return undefined;
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}
