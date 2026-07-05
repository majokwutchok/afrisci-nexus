/**
 * Central engagement tracking utility.
 * Increments the appropriate counter on the Manuscript entity
 * AND writes a detailed ReadershipStats record for analytics.
 */
import { base44 } from "@/api/base44Client";

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function getReferrerSource() {
  const ref = document.referrer || "";
  if (!ref) return "direct";
  if (/google\./i.test(ref)) return "google";
  if (/scholar\.google/i.test(ref)) return "scholar";
  if (/twitter|linkedin|facebook|instagram/i.test(ref)) return "social_media";
  return "institutional";
}

/**
 * @param {string} manuscriptId
 * @param {"abstract"|"full_text"|"pdf_download"} viewType
 * @param {object} [manuscript]  - optional current manuscript object to optimistically bump counts
 */
export async function trackView(manuscriptId, viewType, manuscript) {
  const today = new Date().toISOString().split("T")[0];

  // Write ReadershipStats record (fire and forget)
  base44.entities.ReadershipStats.create({
    manuscript_id: manuscriptId,
    page_title: manuscript?.title || "Untitled Article",
    journal_id: manuscript?.journal_id || null,
    country: "Unknown",       // geo not available client-side without IP lookup
    view_date: today,
    view_type: viewType,
    device_type: getDeviceType(),
    referrer_source: getReferrerSource(),
  }).catch(() => {});

  // Increment the right counter on Manuscript
  if (viewType === "pdf_download") {
    const newCount = (manuscript?.download_count || 0) + 1;
    base44.entities.Manuscript.update(manuscriptId, { download_count: newCount }).catch(() => {});
    return { download_count: newCount };
  } else {
    const newCount = (manuscript?.view_count || 0) + 1;
    base44.entities.Manuscript.update(manuscriptId, { view_count: newCount }).catch(() => {});
    return { view_count: newCount };
  }
}