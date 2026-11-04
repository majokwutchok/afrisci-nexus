// AfriSci Nexus — article file library helpers (pure, no React; shared by the admin tab and tests).
// Collects every PDF / document attached to manuscripts and quick submissions into one list.

export const ISSN = "3079-4730";
export const SITE = "https://afriscinexus.com";

// Manuscript.status -> group shown in the admin tab
export const STATUS_GROUP = {
  draft: "draft",
  submitted: "review",
  editor_assigned: "review",
  under_review: "review",
  revision_requested: "review",
  revised: "review",
  accepted: "accepted",
  rejected: "rejected",
  online_first: "published",
  published: "published",
  // quick submissions (Submission entity)
  pending: "review",
};
export const GROUPS = [
  { key: "all", label: "All" },
  { key: "review", label: "Submitted and in review" },
  { key: "accepted", label: "Accepted" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
];
export const STATUS_LABEL = {
  draft: "Draft", submitted: "Submitted", editor_assigned: "Editor assigned", under_review: "Under review",
  revision_requested: "Revision requested", revised: "Revised", accepted: "Accepted", rejected: "Rejected",
  online_first: "Online first", published: "Published", pending: "Quick submission",
};

const EXT_TYPE = { pdf: "pdf", doc: "word", docx: "word", odt: "word", rtf: "word", tex: "latex", zip: "archive", xlsx: "data", csv: "data", png: "image", jpg: "image", jpeg: "image" };

export function fileTypeOf(url) {
  const u = String(url || "");
  if (u.startsWith("data:")) {
    const mime = u.slice(5, u.indexOf(";")).toLowerCase();
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("word") || mime.includes("officedocument.wordprocessing")) return "word";
    return "other";
  }
  const ext = u.split("?")[0].split("#")[0].split(".").pop().toLowerCase();
  return EXT_TYPE[ext] || "other";
}

/** Original file name from a storage URL (Base44 prefixes uploads with an id and underscore). */
export function originalName(url, fallback = "file") {
  const u = String(url || "");
  if (!u || u.startsWith("data:")) return fallback;
  let last = decodeURIComponent(u.split("?")[0].split("/").pop() || "");
  last = last.replace(/^[0-9a-f]{6,12}_/i, "");
  return last || fallback;
}

function year(...dates) {
  for (const d of dates) {
    const t = d ? new Date(d) : null;
    if (t && !Number.isNaN(t.getTime())) return t.getFullYear();
  }
  return new Date().getFullYear();
}

export function manuscriptRef(id) {
  return `AFS${String(id || "").slice(-8).toUpperCase()}`;
}

function cleanAuthorName(name) {
  // "Majok Wutchok, PhD Scholar (Thesis Submitted) | MPH | GPH" -> "Majok Wutchok"
  return String(name || "").split(/[,|(]/)[0].replace(/\s+/g, " ").trim();
}

/** One entry per manuscript, with all of its files. */
export function fromManuscript(m, journalsById = {}) {
  const authors = (Array.isArray(m.authors) ? m.authors : []).map((a) => ({ ...a, name: cleanAuthorName(a?.name) })).filter((a) => a.name);
  const files = [];
  if (m.manuscript_file_url) {
    files.push({ role: "main", label: m.status === "published" || m.status === "online_first" ? "Article PDF" : "Manuscript", url: m.manuscript_file_url, type: fileTypeOf(m.manuscript_file_url), name: originalName(m.manuscript_file_url, "manuscript.pdf") });
  }
  for (const v of Array.isArray(m.version_history) ? m.version_history : []) {
    if (!v?.file_url || v.file_url === m.manuscript_file_url) continue;
    files.push({ role: "version", label: v.label || `Version ${v.version || ""}`.trim(), url: v.file_url, type: fileTypeOf(v.file_url), name: originalName(v.file_url, `version_${v.version || ""}.pdf`), date: v.uploaded_at || v.date || "" });
  }
  for (const [i, url] of (Array.isArray(m.supplementary_files) ? m.supplementary_files : []).entries()) {
    if (!url) continue;
    files.push({ role: "supplementary", label: `Supplementary ${i + 1}`, url, type: fileTypeOf(url), name: originalName(url, `supplementary_${i + 1}`) });
  }
  return {
    source: "manuscript",
    id: m.id,
    ref: manuscriptRef(m.id),
    title: m.title || "Untitled manuscript",
    abstract: m.abstract || "",
    keywords: Array.isArray(m.keywords) ? m.keywords : [],
    authors,
    journal: journalsById[m.journal_id] || "",
    journal_id: m.journal_id || "",
    status: m.status || "draft",
    group: STATUS_GROUP[m.status] || "review",
    doi: String(m.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""),
    submitted: m.submission_date || m.created_date || "",
    published: m.publication_date || m.online_first_date || "",
    updated: m.updated_date || m.created_date || "",
    year: year(m.publication_date, m.online_first_date, m.submission_date, m.created_date),
    files,
  };
}

/** Quick submissions (Submission entity) appear alongside manuscripts. */
export function fromSubmission(s) {
  const files = s.pdf_url ? [{ role: "main", label: "Submitted PDF", url: s.pdf_url, type: fileTypeOf(s.pdf_url), name: originalName(s.pdf_url, "submission.pdf") }] : [];
  return {
    source: "submission",
    id: s.id,
    ref: `QS${String(s.id || "").slice(-8).toUpperCase()}`,
    title: s.title || "Untitled submission",
    abstract: s.abstract || "",
    keywords: Array.isArray(s.keywords) ? s.keywords : String(s.keywords || "").split(/[,;]/).map((k) => k.trim()).filter(Boolean),
    authors: s.author_name ? [{ name: cleanAuthorName(s.author_name), email: s.author_email || "" }] : [],
    journal: "",
    journal_id: "",
    status: s.status === "pending" ? "pending" : s.status || "pending",
    group: s.status === "accepted" ? "accepted" : s.status === "rejected" ? "rejected" : "review",
    doi: "",
    submitted: s.submitted_date || s.created_date || "",
    published: "",
    updated: s.updated_date || s.created_date || "",
    year: year(s.submitted_date, s.created_date),
    files,
  };
}

export function mainPdf(item) {
  return item.files.find((f) => f.role === "main" && f.type === "pdf") || item.files.find((f) => f.type === "pdf") || null;
}

export function matches(item, { group = "all", query = "", journal = "", onlyPdf = false } = {}) {
  if (group !== "all" && item.group !== group) return false;
  if (group === "all" && item.group === "draft") return false; // drafts only on their own filter
  if (journal && item.journal_id !== journal) return false;
  if (onlyPdf && !mainPdf(item)) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [item.title, item.ref, item.doi, item.journal, ...item.authors.flatMap((a) => [a.name, a.email, a.affiliation])].join(" ").toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

/** "Wutchok_2026_From_First_Contact_to_Custody" */
export function fileBase(item) {
  const first = item.authors[0]?.name?.split(/\s+/).pop() || "Author";
  const words = String(item.title || "Article").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 6);
  const ascii = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "");
  return [ascii(first) || "Author", item.year, ...words.map(ascii).filter(Boolean)].join("_").slice(0, 90);
}

/** APA style citation. */
export function citation(item) {
  const names = item.authors.map((a) => {
    const parts = a.name.split(/\s+/);
    const last = parts.pop();
    const initials = parts.map((p) => `${p[0]}.`).join(" ");
    return initials ? `${last}, ${initials}` : last;
  });
  const who = names.length === 0 ? "AfriSci Nexus" : names.length === 1 ? names[0] : names.length === 2 ? `${names[0]}, & ${names[1]}` : `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  const journal = item.journal || "AfriSci Nexus";
  const tail = item.doi ? ` https://doi.org/${item.doi}` : "";
  return `${who} (${item.year}). ${String(item.title).replace(/\.$/, "")}. ${journal}.${tail}`;
}

export function fmtDate(d) {
  if (!d) return "";
  const t = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00` : d);
  return Number.isNaN(t.getTime()) ? "" : t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Bytes of a file from a URL or a data: URL. */
export async function fileBytes(url, fetchImpl = globalThis.fetch) {
  const u = String(url || "");
  if (u.startsWith("data:")) {
    const b64 = u.slice(u.indexOf(",") + 1);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const res = await fetchImpl(u);
  if (!res.ok) throw new Error(`Could not download the file (HTTP ${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export function csvIndex(items, fileNames) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Reference", "Title", "Authors", "Journal", "Status", "DOI", "Submitted", "Published", "File in ZIP", "Original link"];
  const rows = items.map((it) => [
    it.ref, it.title, it.authors.map((a) => a.name).join("; "), it.journal, STATUS_LABEL[it.status] || it.status,
    it.doi ? `https://doi.org/${it.doi}` : "", it.submitted, it.published, fileNames.get(it.id) || "",
    mainPdf(it)?.url?.startsWith("data:") ? "(stored in record)" : mainPdf(it)?.url || "",
  ]);
  return "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}
