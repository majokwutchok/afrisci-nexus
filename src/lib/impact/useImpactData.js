// One shared, lightweight source of impact data for the homepage (map, stats bar, reach list).
// Fetches the cached getImpactMap function once, refreshes every 60 s, and applies new reader
// events the moment they are recorded (real time subscription to ReadershipStats).
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

let state = { data: null, error: null, live: false, pulses: [] };
const listeners = new Set();
let started = false;
let timer = null;

function emit(patch) {
  state = { ...state, ...patch };
  for (const l of listeners) l(state);
}

async function refresh() {
  try {
    const res = await base44.functions.invoke("getImpactMap", {});
    const data = res?.data ?? res;
    if (data?.ok === false) throw new Error(data.error || "unavailable");
    emit({ data, error: null });
  } catch (e) {
    if (!state.data) emit({ error: e?.message || "unavailable" });
  }
}

function onReaderEvent(event) {
  if (event?.type !== "create") return;
  const ev = event.data || {};
  const code = ev.country_code;
  if (!state.data || !code) return;
  const d = state.data;
  const readers = [...d.readers];
  const i = readers.findIndex((r) => r.code === code);
  if (i >= 0) readers[i] = { ...readers[i], count: readers[i].count + 1 };
  else readers.push({ code, count: 1 });
  readers.sort((a, b) => b.count - a.count);
  const totals = { ...d.totals };
  if (ev.view_type === "pdf_download") totals.downloads += 1;
  else totals.views += 1;
  if (ev.view_type === "full_text") totals.reads += 1;
  totals.located_readers += 1;
  totals.countries_reached = new Set([...readers.map((r) => r.code), ...d.citations.map((c) => c.from)]).size;
  const recent = [{ country_code: code, view_type: ev.view_type, manuscript_id: ev.manuscript_id, title: ev.page_title, at: ev.created_date || new Date().toISOString() }, ...d.recent].slice(0, 12);
  const pulse = { id: event.id || Math.random().toString(36), code, at: Date.now() };
  emit({ data: { ...d, readers, totals, recent }, pulses: [...state.pulses.filter((p) => Date.now() - p.at < 4000), pulse] });
}

function start() {
  if (started) return;
  started = true;
  refresh();
  timer = setInterval(refresh, 60_000);
  try {
    const unsub = base44.entities.ReadershipStats.subscribe(onReaderEvent);
    emit({ live: typeof unsub === "function" });
  } catch (_) {
    emit({ live: false });
  }
}

export function useImpactData() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    start();
    setS(state);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}

// test hook
export function __resetImpactData() { state = { data: null, error: null, live: false, pulses: [] }; started = false; clearInterval(timer); }
