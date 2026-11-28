import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Plus, Loader2, Trash2, Upload, Users, ChevronLeft, Download, Search, RefreshCw } from "lucide-react";

async function call(action, payload = {}) {
  const res = await base44.functions.invoke("newsletterAdmin", { action, ...payload });
  const data = res?.data ?? res;
  if (data?.error) throw new Error(data.error);
  return data;
}

const SEGMENTS = [
  ["subscribers", "Newsletter subscribers"],
  ["users", "Registered platform users"],
  ["authors", "Authors who have submitted"],
];

function ListDetail({ list, onBack, flash }) {
  const [members, setMembers] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [sel, setSel] = useState(new Set());
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try { setMembers((await call("list_members", { list_id: list.id })).members); } catch (e) { flash("error", e.message); }
  }, [list.id]);
  useEffect(() => { load(); }, [load]);

  const add = async (source, body) => {
    setBusy(source);
    try {
      const r = await call("list_add", { list_id: list.id, text: body, source });
      flash("ok", `Added ${r.added}${r.skipped ? `, ${r.skipped} already on the list` : ""}.`);
      setText(""); load();
    } catch (e) { flash("error", e.message); }
    setBusy("");
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { flash("error", "File is larger than 3 MB"); return; }
    const r = new FileReader();
    r.onload = () => add("csv", String(r.result || ""));
    r.readAsText(f);
    e.target.value = "";
  };
  const remove = async () => {
    if (!sel.size || !window.confirm(`Remove ${sel.size} address(es) from ${list.name}?`)) return;
    setBusy("remove");
    try { await call("list_remove", { list_id: list.id, member_ids: [...sel] }); setSel(new Set()); load(); } catch (e) { flash("error", e.message); }
    setBusy("");
  };
  const exportCsv = () => {
    const q2 = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = ["email,name,source", ...(members || []).map((m) => [m.email, m.name, m.source].map(q2).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${list.name.replace(/[^\w]+/g, "-")}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const shown = (members || []).filter((m) => !q || m.email.includes(q.toLowerCase()) || (m.name || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" />All lists</Button>
        <div>
          <div className="font-bold text-slate-900">{list.name}</div>
          <div className="text-xs text-slate-500">{members ? `${members.length} members` : "Loading…"}{list.description ? ` · ${list.description}` : ""}</div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="font-semibold text-sm text-slate-900">Add addresses</div>
          <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={"One per line, for example\nDr Amina Bello <amina@uni.edu.ng>\nresearch.office@uon.ac.ke"} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-blue-800 hover:bg-blue-900" disabled={!text.trim() || !!busy} onClick={() => add("manual", text)}>{busy === "manual" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}Add to list</Button>
            <label className="inline-flex items-center gap-1 text-sm px-3 h-8 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-50">
              {busy === "csv" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}Import CSV
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={onFile} />
            </label>
          </div>
          <p className="text-xs text-slate-500">CSV files need an email column; a name column is picked up when present. Duplicates are skipped.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="font-semibold text-sm text-slate-900">Add a whole group</div>
          <p className="text-xs text-slate-500">Copies everyone currently in the group into this list. Unsubscribed readers are left out.</p>
          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map(([k, l]) => (
              <Button key={k} size="sm" variant="outline" disabled={!!busy} onClick={async () => {
                setBusy(k);
                try { const r = await call("list_build", { list_id: list.id, source: k }); flash("ok", `Added ${r.added} from ${l.toLowerCase()}.`); load(); } catch (e) { flash("error", e.message); }
                setBusy("");
              }}>{busy === k ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Users className="w-3.5 h-3.5 mr-1" />}{l}</Button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-8 pl-7 w-56" /></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!members?.length}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            <Button size="sm" variant="outline" className="text-red-600" disabled={!sel.size || !!busy} onClick={remove}><Trash2 className="w-3.5 h-3.5 mr-1" />Remove {sel.size || ""}</Button>
          </div>
        </div>
        <div className="max-h-[460px] overflow-auto">
          {!members ? <div className="p-6 text-sm text-slate-400 flex gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : shown.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No members yet.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-white sticky top-0 text-xs text-slate-500 uppercase shadow-sm"><tr>
                <th className="px-4 py-2 w-8"><input type="checkbox" className="accent-blue-800" checked={shown.length > 0 && shown.every((m) => sel.has(m.id))} onChange={(e) => setSel(e.target.checked ? new Set(shown.map((m) => m.id)) : new Set())} /></th>
                <th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Source</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {shown.slice(0, 2000).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2"><input type="checkbox" className="accent-blue-800" checked={sel.has(m.id)} onChange={(e) => { const n = new Set(sel); e.target.checked ? n.add(m.id) : n.delete(m.id); setSel(n); }} /></td>
                    <td className="px-4 py-2 text-slate-800">{m.email}{m.unsubscribed && <Badge variant="outline" className="ml-2 text-red-600 border-red-200">unsubscribed, will be skipped</Badge>}</td>
                    <td className="px-4 py-2 text-slate-600">{m.name}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{String(m.source || "").replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MailingLists() {
  const [lists, setLists] = useState(null);
  const [open, setOpen] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const flash = (kind, text) => { setToast({ kind, text }); setTimeout(() => setToast(null), 5000); };

  const load = useCallback(async () => {
    try { setLists((await call("lists")).lists); } catch (e) { flash("error", e.message); setLists([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    try { const r = await call("list_create", { name, description: desc }); setName(""); setDesc(""); await load(); setOpen(r.list); } catch (e) { flash("error", e.message); }
    setBusy(false);
  };
  const del = async (l) => {
    if (!window.confirm(`Delete the list "${l.name}" and its ${l.member_count || 0} members? Issues already sent are not affected.`)) return;
    try { await call("list_delete", { list_id: l.id }); load(); } catch (e) { flash("error", e.message); }
  };

  const Toast = toast && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.kind === "error" ? "bg-red-600" : "bg-emerald-600"}`}>{toast.text}</div>;
  if (open) return <><ListDetail list={open} onBack={() => { setOpen(null); load(); }} flash={flash} />{Toast}</>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-800 px-6 py-5">
        <div className="text-white text-xl font-bold flex items-center gap-2"><ListChecks className="w-5 h-5 text-amber-500" />Mailing lists</div>
        <div className="text-xs text-blue-200 mt-1">Build your own audiences: partner universities, reviewers, a conference contact list, or everyone who has not opened recent issues. Pick lists in any issue's Audience section.</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="font-semibold text-sm text-slate-900 mb-2">New list</div>
        <div className="flex flex-wrap gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="List name, for example Partner universities" className="max-w-xs" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="max-w-sm" />
          <Button className="bg-blue-800 hover:bg-blue-900" disabled={!name.trim() || busy} onClick={create}>{busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Create list</Button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><div className="font-semibold text-sm text-slate-900">Your lists</div><Button variant="ghost" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button></div>
        {!lists ? <div className="p-6 text-sm text-slate-400 flex gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : lists.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No lists yet. Create one above, or save non openers from the Analytics tab.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-2">List</th><th className="text-right px-4 py-2">Members</th><th className="text-left px-4 py-2">Created</th><th className="px-4 py-2" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {lists.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5"><div className="font-semibold text-slate-900">{l.name}</div>{(l.description || l.source_note) && <div className="text-xs text-slate-500">{l.description || l.source_note}</div>}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{l.member_count || 0}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{l.created_date ? new Date(l.created_date).toLocaleDateString() : ""}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" className="mr-1" onClick={() => setOpen(l)}>Manage</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(l)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {Toast}
    </div>
  );
}
