/**
 * Reader engagement tracking.
 * Sends each view / full text read / PDF download to the trackEngagement backend function,
 * which records it (country, device, source), ignores bots and repeat refreshes, and increments
 * the article's counters atomically on the server. No Base44 integrations, so no credits.
 *
 * trackView(manuscriptId, viewType, manuscript) keeps its original signature:
 * viewType is "abstract" | "full_text" | "pdf_download". Returns optimistic counts at once.
 */
import { base44 } from "@/api/base44Client";

const TYPE = { abstract: "view", full_text: "read", pdf_download: "download" };
const WINDOW_MS = 30 * 60 * 1000; // same as the server: one count per reader, action and article per 30 min

function visitorId() {
  try {
    let id = localStorage.getItem("afs_visitor");
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("afs_visitor", id);
    }
    return id;
  } catch {
    return "";
  }
}
function recentlySent(key) {
  try {
    const t = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - t < WINDOW_MS) return true;
    sessionStorage.setItem(key, String(Date.now()));
  } catch { /* storage unavailable: let the server de-duplicate */ }
  return false;
}

export function trackView(manuscriptId, viewType, manuscript) {
  const type = TYPE[viewType];
  if (!manuscriptId || !type) return {};
  const optimistic =
    type === "download" ? { download_count: (manuscript?.download_count || 0) + 1 } :
    type === "read" ? { view_count: (manuscript?.view_count || 0) + 1, read_count: (manuscript?.read_count || 0) + 1 } :
    { view_count: (manuscript?.view_count || 0) + 1 };

  if (recentlySent(`afs_t_${type}_${manuscriptId}`)) return optimistic;
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { /* old browser */ }
  base44.functions
    .invoke("trackEngagement", { manuscript_id: manuscriptId, type, visitor: visitorId(), tz, referrer: document.referrer || "" })
    .catch(() => {});
  return optimistic;
}
