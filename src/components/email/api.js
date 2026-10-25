// Thin data layer for the Email Center. Reads go straight to entities (admin RLS);
// anything that sends or needs secrets goes through the backend functions.
import { base44 } from "@/api/base44Client";

export const ENTITY = {
  thread: "EmailThread",
  message: "EmailMessage",
  template: "EmailTemplate",
  settings: "EmailSettings",
};

// Manuscript linking, matched to the AfriSci Nexus Manuscript/Journal entities:
// authors[] (name, email, is_corresponding), journal_id -> Journal.title, submission_date, doi.
export const MANUSCRIPT = { entity: "Manuscript", journalEntity: "Journal" };

export function pick(record, fields) {
  for (const f of fields) {
    const v = record?.[f];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

export function correspondingAuthor(m) {
  const authors = Array.isArray(m?.authors) ? m.authors : [];
  const a = authors.find((x) => x?.is_corresponding && x?.email) || authors.find((x) => x?.email) || authors[0] || {};
  return { name: a.name || "", email: a.email || m?.created_by || "" };
}

/** Short reference used in subjects, e.g. AFS-7A9AFDF4 (same id suffix the DOIs use). */
export function manuscriptRef(m) {
  return `AFS-${String(m?.id || "").slice(-8).toUpperCase()}`;
}

export function manuscriptVars(m, journalTitle = "", origin = "") {
  const author = correspondingAuthor(m);
  const date = m?.submission_date ? new Date(m.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const vars = {
    recipient_name: author.name,
    manuscript_title: m?.title || "",
    manuscript_id: manuscriptRef(m),
    journal_name: journalTitle,
    doi: String(m?.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""),
    submission_date: date,
    article_url: origin && m?.id ? `${origin}/ManuscriptDetail?id=${m.id}` : "",
  };
  Object.keys(vars).forEach((k) => !vars[k] && delete vars[k]);
  return vars;
}

const rows = (res) => (Array.isArray(res) ? res : res?.items ?? []);

export async function list(entity, sort = "-created_date", limit = 200) {
  return rows(await base44.entities[entity].list(sort, limit));
}
export async function filter(entity, query, sort = "-created_date", limit = 200) {
  return rows(await base44.entities[entity].filter(query, sort, limit));
}
export const create = (entity, data) => base44.entities[entity].create(data);
export const update = (entity, id, data) => base44.entities[entity].update(id, data);
export const remove = (entity, id) => base44.entities[entity].delete(id);

/** Call a backend function and normalise success/error shapes across SDK versions. */
export async function invoke(name, payload) {
  try {
    const res = await base44.functions.invoke(name, payload);
    const data = res?.data ?? res;
    if (data && data.ok === false) {
      const err = new Error(data.error || "Request failed");
      err.data = data;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.data) throw e;
    const data = e?.response?.data || e?.data;
    const err = new Error(data?.error || data?.message || e.message || "Request failed");
    err.data = data;
    throw err;
  }
}

export async function currentUser() {
  try { return await base44.auth.me(); } catch { return null; }
}

export function subscribe(entity, cb) {
  try {
    const fn = base44.entities[entity]?.subscribe;
    if (typeof fn === "function") return fn.call(base44.entities[entity], cb);
  } catch { /* realtime not available */ }
  return () => {};
}

export async function loadSettingsRecord() {
  try { return (await list(ENTITY.settings, "-updated_date", 1))[0] || null; } catch { return null; }
}

export function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(",")[1] || "";
      resolve({ filename: file.name, content: b64, content_type: file.type || "application/octet-stream", size: file.size });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 6) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function fullDate(iso) {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
}

export function displayName(addr) {
  const m = String(addr || "").match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  return m ? m[1] || m[2] : String(addr || "");
}
