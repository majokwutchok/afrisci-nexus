import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, FileType2, Download, Eye, Wand2, Search, RefreshCw, Loader2, Archive, Paperclip, History, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  GROUPS, STATUS_LABEL, fromManuscript, fromSubmission, matches, mainPdf, fileBase, fileBytes, csvIndex, fmtDate,
} from "@/lib/articles/articleFiles";

const rows = (r) => (Array.isArray(r) ? r : r?.items ?? []);
const OPTS_KEY = "afs_pdf_format_options";
const STATUS_TONE = {
  published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  accepted: "bg-blue-50 text-blue-800 ring-blue-200",
  review: "bg-amber-50 text-amber-900 ring-amber-200",
  rejected: "bg-slate-100 text-slate-600 ring-slate-200",
  draft: "bg-slate-50 text-slate-500 ring-slate-200",
};

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
async function blobOf(file) {
  const bytes = await fileBytes(file.url);
  return new Blob([bytes], { type: file.type === "pdf" ? "application/pdf" : "application/octet-stream" });
}
const ext = (file) => (file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : file.type === "pdf" ? "pdf" : "bin");

/** Admin tab: every submitted and published article file in one place. */
export default function ArticleFilesLibrary() {
  const [items, setItems] = useState(null);
  const [journals, setJournals] = useState([]);
  const [error, setError] = useState("");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [journal, setJournal] = useState("");
  const [onlyPdf, setOnlyPdf] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(null); // { id, label } or { bulk: true, done, total }
  const [toast, setToast] = useState(null);
  const [opts, setOpts] = useState(() => {
    try { return { cover: true, headerFooter: true, ...JSON.parse(localStorage.getItem(OPTS_KEY) || "{}") }; } catch { return { cover: true, headerFooter: true }; }
  });
  const reloadTimer = useRef(null);

  useEffect(() => { try { localStorage.setItem(OPTS_KEY, JSON.stringify(opts)); } catch { /* private mode */ } }, [opts]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), toast.kind === "error" ? 8000 : 4000); return () => clearTimeout(t); }, [toast]);

  const load = useCallback(async () => {
    try {
      const [ms, subs, js] = await Promise.all([
        base44.entities.Manuscript.list("-updated_date", 2000).then(rows),
        base44.entities.Submission.list("-created_date", 1000).then(rows).catch(() => []),
        base44.entities.Journal.list("title", 500).then(rows).catch(() => []),
      ]);
      const byId = Object.fromEntries(js.map((j) => [j.id, j.title]));
      setJournals(js.map((j) => ({ id: j.id, title: j.title })).sort((a, b) => String(a.title).localeCompare(String(b.title))));
      const list = [...ms.map((m) => fromManuscript(m, byId)), ...subs.map(fromSubmission)];
      list.sort((a, b) => String(b.updated || b.submitted).localeCompare(String(a.updated || a.submitted)));
      setItems(list);
      setError("");
    } catch (e) {
      setError(`Could not load articles: ${e.message}`);
      setItems((cur) => cur || []);
    }
  }, []);

  // New submissions and status changes appear automatically.
  useEffect(() => {
    load();
    const schedule = () => { clearTimeout(reloadTimer.current); reloadTimer.current = setTimeout(load, 800); };
    const unsubs = [];
    for (const e of ["Manuscript", "Submission"]) {
      try { const u = base44.entities[e].subscribe(schedule); if (typeof u === "function") unsubs.push(u); } catch { /* realtime unavailable */ }
    }
    const poll = setInterval(load, 120_000);
    return () => { unsubs.forEach((u) => u()); clearInterval(poll); clearTimeout(reloadTimer.current); };
  }, [load]);

  const shown = useMemo(() => (items || []).filter((it) => matches(it, { group, query, journal, onlyPdf })), [items, group, query, journal, onlyPdf]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(GROUPS.map((g) => [g.key, 0]));
    for (const it of items || []) { if (it.group !== "draft") c.all++; c[it.group] = (c[it.group] || 0) + 1; }
    return c;
  }, [items]);
  const withPdf = shown.filter((it) => mainPdf(it));
  const selectedItems = shown.filter((it) => selected.has(it.id));
  const allChecked = withPdf.length > 0 && withPdf.every((it) => selected.has(it.id));

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(withPdf.map((it) => it.id)));

  async function preview(file) {
    if (file.url.startsWith("data:")) {
      const url = URL.createObjectURL(await blobOf(file));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } else window.open(file.url, "_blank", "noopener");
  }

  async function downloadOriginal(item, file) {
    setBusy({ id: item.id, label: "Downloading" });
    try {
      const name = file.role === "main" ? `${fileBase(item)}.${ext(file)}` : `${fileBase(item)}_${file.label.replace(/\s+/g, "_")}.${ext(file)}`;
      saveBlob(await blobOf(file), name);
    } catch (e) {
      setToast({ kind: "error", text: e.message });
    } finally { setBusy(null); }
  }

  async function downloadFormatted(item) {
    const file = mainPdf(item);
    if (!file) return;
    setBusy({ id: item.id, label: "Formatting" });
    try {
      const { formatArticlePdf } = await import("@/lib/articles/pdfFormat");
      const bytes = await formatArticlePdf(await fileBytes(file.url), item, opts);
      saveBlob(new Blob([bytes], { type: "application/pdf" }), `${fileBase(item)}_AfriSci.pdf`);
      setToast({ kind: "ok", text: "Formatted PDF downloaded" });
    } catch (e) {
      setToast({ kind: "error", text: e.message });
    } finally { setBusy(null); }
  }

  async function downloadZip(formatted) {
    const list = selectedItems.filter((it) => mainPdf(it));
    if (!list.length) return;
    setBusy({ bulk: true, done: 0, total: list.length, formatted });
    try {
      const [{ default: JSZip }, fmt] = await Promise.all([import("jszip"), formatted ? import("@/lib/articles/pdfFormat") : Promise.resolve(null)]);
      const zip = new JSZip();
      const names = new Map();
      const problems = [];
      for (const [i, it] of list.entries()) {
        const file = mainPdf(it);
        try {
          let bytes = await fileBytes(file.url);
          let suffix = formatted ? "_AfriSci" : "";
          if (formatted) {
            try { bytes = await fmt.formatArticlePdf(bytes, it, opts); }
            catch (e) { problems.push(`${it.ref} ${it.title}: ${e.message} The original is included instead.`); suffix = ""; }
          }
          const used = new Set(names.values());
          let name = `${fileBase(it)}${suffix}.pdf`;
          for (let n = 2; used.has(name); n++) name = `${fileBase(it)}${suffix}_${n}.pdf`;
          zip.file(name, bytes);
          names.set(it.id, name);
        } catch (e) {
          problems.push(`${it.ref} ${it.title}: ${e.message}`);
        }
        setBusy((b) => (b ? { ...b, done: i + 1 } : b));
      }
      zip.file("index.csv", csvIndex(list, names));
      if (problems.length) zip.file("problems.txt", problems.join("\r\n"));
      const blob = await zip.generateAsync({ type: "blob" });
      const stamp = new Date().toISOString().slice(0, 10);
      saveBlob(blob, `AfriSci_articles_${formatted ? "formatted_" : ""}${stamp}.zip`);
      setToast(problems.length ? { kind: "error", text: `${names.size} files downloaded. ${problems.length} need attention, see problems.txt in the ZIP.` } : { kind: "ok", text: `${names.size} files downloaded as a ZIP` });
    } catch (e) {
      setToast({ kind: "error", text: e.message });
    } finally { setBusy(null); }
  }

  return (
    <section className="space-y-5" aria-labelledby="afl-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="afl-title" className="text-2xl font-bold tracking-tight text-slate-900">Article files</h2>
          <p className="mt-1 text-sm text-slate-600">Every submitted and published manuscript file, including new submissions as they arrive.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status">
        {GROUPS.map((g) => (
          <button key={g.key} type="button" role="tab" aria-selected={group === g.key} onClick={() => setGroup(g.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm ring-1 ring-inset transition-colors ${group === g.key ? "bg-blue-800 text-white ring-blue-800" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}>
            {g.label} <span className={`ml-1 tabular-nums ${group === g.key ? "text-white/80" : "text-slate-400"}`}>{items ? counts[g.key] || 0 : ""}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, author, DOI or reference"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <select value={journal} onChange={(e) => setJournal(e.target.value)} aria-label="Journal"
          className="h-9 max-w-[260px] rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700">
          <option value="">All journals</option>
          {journals.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={onlyPdf} onChange={(e) => setOnlyPdf(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Only with a PDF
        </label>
      </div>

      {/* format options + bulk */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
          <legend className="sr-only">Formatted PDF options</legend>
          <span className="font-medium text-slate-900">Formatted PDF adds</span>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={opts.cover} onChange={(e) => setOpts((o) => ({ ...o, cover: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />AfriSci cover page</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={opts.headerFooter} onChange={(e) => setOpts((o) => ({ ...o, headerFooter: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />Header, DOI footer and page numbers</label>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">{selectedItems.length ? `${selectedItems.length} selected` : "Select articles to download together"}</span>
          <button type="button" disabled={!selectedItems.length || !!busy} onClick={() => downloadZip(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <Archive className="h-4 w-4" aria-hidden="true" /> Originals (ZIP)
          </button>
          <button type="button" disabled={!selectedItems.length || !!busy || (!opts.cover && !opts.headerFooter)} onClick={() => downloadZip(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">
            <Wand2 className="h-4 w-4" aria-hidden="true" /> Formatted (ZIP)
          </button>
        </div>
      </div>
      {busy?.bulk && (
        <div role="status" className="flex items-center gap-3 text-sm text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {busy.formatted ? "Formatting" : "Collecting"} {busy.done} of {busy.total}
          <div className="h-1.5 w-48 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-blue-800 transition-all" style={{ width: `${(busy.done / busy.total) * 100}%` }} /></div>
        </div>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {/* list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_9rem_9rem_21rem] items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 lg:grid">
          <input type="checkbox" aria-label="Select all with a PDF" checked={allChecked} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300" />
          <span>Article</span><span>Status</span><span>Date</span><span>Files</span>
        </div>
        {items === null ? (
          <p className="flex items-center gap-2 px-4 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Loading article files…</p>
        ) : shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">{query || journal || onlyPdf ? "No articles match these filters." : "No articles here yet. New submissions will appear automatically."}</p>
        ) : (
          <ul>
            {shown.map((it) => {
              const pdf = mainPdf(it);
              const others = it.files.filter((f) => f !== pdf);
              const isBusy = busy && busy.id === it.id;
              const date = it.group === "published" ? it.published : it.submitted;
              return (
                <li key={`${it.source}-${it.id}`} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-slate-100 px-4 py-4 last:border-b-0 lg:grid-cols-[2.5rem_minmax(0,1fr)_9rem_9rem_21rem] lg:items-center">
                  <input type="checkbox" aria-label={`Select ${it.title}`} checked={selected.has(it.id)} disabled={!pdf} onChange={() => toggle(it.id)} className="mt-1 h-4 w-4 rounded border-slate-300 disabled:opacity-30 lg:mt-0" />
                  <div className="min-w-0">
                    <p className="font-medium leading-snug text-slate-900">{it.title}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-600">{it.authors.map((a) => a.name).join(", ") || "Author not given"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {[it.ref, it.journal || (it.source === "submission" ? "Quick submission form" : ""), it.doi && `DOI ${it.doi}`].filter(Boolean).join("   ")}
                    </p>
                  </div>
                  <div className="col-start-2 flex flex-wrap items-center gap-2 lg:col-start-auto">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONE[it.group] || STATUS_TONE.review}`}>{STATUS_LABEL[it.status] || it.status}</span>
                    <span className="text-xs text-slate-500 lg:hidden">{fmtDate(date)}</span>
                  </div>
                  <span className="hidden text-sm text-slate-600 lg:block">{fmtDate(date) || "-"}</span>

                  <div className="col-start-2 flex flex-col gap-2 lg:col-start-auto">
                    {pdf ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-slate-700"><FileText className="h-4 w-4 text-red-600" aria-hidden="true" />PDF</span>
                        <button type="button" onClick={() => preview(pdf)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50" aria-label={`Preview ${it.title}`}>
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />Preview
                        </button>
                        <button type="button" disabled={!!busy} onClick={() => downloadOriginal(it, pdf)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-50" aria-label={`Download original PDF of ${it.title}`}>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />Original
                        </button>
                        <button type="button" disabled={!!busy || (!opts.cover && !opts.headerFooter)} onClick={() => downloadFormatted(it)} className="inline-flex items-center gap-1 rounded-md bg-blue-800 px-2 py-1 text-xs font-medium text-white hover:bg-blue-900 disabled:opacity-50" aria-label={`Download formatted PDF of ${it.title}`}>
                          {isBusy && busy.label === "Formatting" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />}Formatted
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No PDF uploaded{others.length ? "" : " yet"}</p>
                    )}
                    {others.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {others.map((f, i) => (
                          <li key={i}>
                            <button type="button" disabled={!!busy} onClick={() => downloadOriginal(it, f)} title={f.name}
                              className="inline-flex max-w-[16rem] items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 disabled:opacity-50">
                              {f.role === "version" ? <History className="h-3.5 w-3.5" aria-hidden="true" /> : f.type === "word" ? <FileType2 className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" /> : <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />}
                              <span className="truncate">{f.label}: {f.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Formatting runs in your browser: the author's pages are kept exactly as uploaded, with an AfriSci cover page and a header and footer added. Word documents and password protected PDFs can be downloaded but not reformatted.
      </p>

      {toast && (
        <div role="status" className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${toast.kind === "error" ? "bg-red-700" : "bg-slate-900"}`}>
          <span className="flex-1">{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}
    </section>
  );
}
