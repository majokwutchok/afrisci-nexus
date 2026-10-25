import React, { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { isValidEmail, parseAddress } from "@/lib/email/emailCore";

export function Button({ variant = "primary", size = "md", loading, icon: Icon, children, className = "", ...props }) {
  const styles = {
    primary: "bg-blue-800 text-white hover:bg-blue-900 shadow-sm disabled:bg-blue-800/50",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50",
    danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-50",
  };
  const sizes = { sm: "h-8 px-2.5 text-xs gap-1.5", md: "h-9 px-3.5 text-sm gap-2" };
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

const BADGE = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-800",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
};
export function Badge({ color = "slate", children, className = "" }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE[color]} ${className}`}>{children}</span>;
}

export const DELIVERY = {
  draft: ["slate", "Draft"],
  sending: ["amber", "Sending"],
  sent: ["blue", "Sent"],
  delivered: ["green", "Delivered"],
  delivery_delayed: ["amber", "Delayed"],
  opened: ["green", "Opened"],
  clicked: ["green", "Clicked"],
  bounced: ["red", "Bounced"],
  complained: ["red", "Marked as spam"],
  failed: ["red", "Failed"],
  received: ["slate", "Received"],
};
export function StatusBadge({ message }) {
  const key = message.status === "failed" || message.status === "bounced" ? message.delivery_status || message.status : message.delivery_status || message.status;
  const [color, label] = DELIVERY[key] || ["slate", key];
  return <Badge color={color}>{label}</Badge>;
}

/** Renders a full HTML email safely: no scripts, links open in a new tab, auto height. */
export function EmailFrame({ html, title = "Email", className = "" }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(200);
  const doc = /<html[\s>]/i.test(html || "")
    ? String(html).replace(/<head>/i, '<head><base target="_blank">')
    : `<!doctype html><html><head><base target="_blank"><meta charset="utf-8"><style>body{font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;margin:0;padding:4px 2px;word-wrap:break-word}img{max-width:100%;height:auto}blockquote{border-left:3px solid #cbd5e1;margin:8px 0;padding-left:12px;color:#64748b}</style></head><body>${html || ""}</body></html>`;
  const measure = () => {
    try {
      const d = ref.current?.contentDocument;
      if (d?.body) setHeight(Math.max(60, d.documentElement.scrollHeight, d.body.scrollHeight));
    } catch { /* cross-origin */ }
  };
  useEffect(() => {
    const t = setTimeout(measure, 150);
    return () => clearTimeout(t);
  }, [html]);
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={doc}
      onLoad={measure}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className={`w-full border-0 bg-transparent ${className}`}
      style={{ height }}
    />
  );
}

/** Chip-style recipient input with suggestions and validation. */
export function RecipientInput({ label, value, onChange, suggestions = [], autoFocus, id }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const add = (raw) => {
    const parts = String(raw)
      .split(/[,;\n]+/)
      .flatMap((p) => (p.includes("<") ? [p] : p.split(/\s+/)))
      .map((s) => s.trim())
      .filter(Boolean);
    const next = [...value];
    for (const p of parts) {
      const { email } = parseAddress(p);
      if (email && !next.some((v) => parseAddress(v).email === email)) next.push(p);
    }
    onChange(next);
    setText("");
  };
  const q = text.trim().toLowerCase();
  const matches = q.length >= 2
    ? suggestions.filter((s) => s.toLowerCase().includes(q) && !value.includes(s)).slice(0, 6)
    : [];
  return (
    <div className="flex items-start gap-2 border-b border-slate-200 py-1.5">
      <label htmlFor={id} className="w-10 shrink-0 pt-1.5 text-sm text-slate-500">{label}</label>
      <div className="relative flex flex-1 flex-wrap items-center gap-1.5">
        {value.map((v) => {
          const ok = isValidEmail(parseAddress(v).email);
          return (
            <span key={v} className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs ${ok ? "bg-blue-50 text-blue-900" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`} title={ok ? v : "Invalid email address"}>
              <span className="truncate">{v}</span>
              <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
            </span>
          );
        })}
        <input
          id={id}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (["Enter", ",", ";", "Tab"].includes(e.key) && text.trim()) { e.preventDefault(); add(text); }
            if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => { setTimeout(() => setOpen(false), 150); if (text.trim()) add(text); }}
          onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[,;\n]/.test(t)) { e.preventDefault(); add(t); } }}
          placeholder={value.length ? "" : "name@example.org"}
          className="min-w-[160px] flex-1 bg-transparent py-1 text-sm outline-none"
        />
        {open && matches.length > 0 && (
          <div className="absolute left-0 top-full z-30 mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {matches.map((m) => (
              <button key={m} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(m)} className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-blue-50">{m}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.kind === "error" ? 7000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div role="status" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg ${toast.kind === "error" ? "bg-red-700 text-white" : "bg-slate-900 text-white"}`}>
      {toast.text}
    </div>
  );
}
