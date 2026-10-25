import React, { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Link2, Unlink, Code2, Braces, MousePointerClick, SquareStack, Eraser } from "lucide-react";
import { VARIABLE_CATALOG } from "@/lib/email/emailCore";

/**
 * Dependency-free rich text editor for email bodies.
 * Shows {{variables}} and [button]/[box] shortcodes as plain text so admins can edit them freely.
 */
export default function RichTextEditor({ value, onChange, minHeight = 260, placeholder = "Write your message…" }) {
  const ref = useRef(null);
  const lastEmitted = useRef(null);
  const [source, setSource] = useState(false);
  const [varsOpen, setVarsOpen] = useState(false);

  // Sync external value changes (e.g. template chosen) into the editable area.
  useEffect(() => {
    if (source || !ref.current) return;
    if (value !== lastEmitted.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
      lastEmitted.current = value;
    }
  }, [value, source]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastEmitted.current = html;
    onChange?.(html);
  };

  const exec = (cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const insertText = (text) => {
    if (source) {
      onChange?.((value || "") + text);
      return;
    }
    ref.current?.focus();
    document.execCommand("insertText", false, text);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (url && /^(https?:|mailto:)/i.test(url.trim())) exec("createLink", url.trim());
  };
  const addButton = () => {
    const label = window.prompt("Button label", "View submission");
    if (!label) return;
    const url = window.prompt("Button link (you can use variables, e.g. {{portal_url}}/MyManuscripts)", "{{portal_url}}/MyManuscripts");
    if (url) insertText(`[button: ${label} | ${url}]`);
  };

  const Tool = ({ icon: Icon, title, onClick, active }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${active ? "bg-slate-200 text-slate-900" : ""}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-500">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 px-1.5 py-1 relative">
        {!source && (
          <>
            <Tool icon={Bold} title="Bold" onClick={() => exec("bold")} />
            <Tool icon={Italic} title="Italic" onClick={() => exec("italic")} />
            <Tool icon={Underline} title="Underline" onClick={() => exec("underline")} />
            <Tool icon={Heading2} title="Heading" onClick={() => exec("formatBlock", "<h2>")} />
            <Tool icon={List} title="Bulleted list" onClick={() => exec("insertUnorderedList")} />
            <Tool icon={ListOrdered} title="Numbered list" onClick={() => exec("insertOrderedList")} />
            <Tool icon={Link2} title="Insert link" onClick={addLink} />
            <Tool icon={Unlink} title="Remove link" onClick={() => exec("unlink")} />
            <Tool icon={Eraser} title="Clear formatting" onClick={() => exec("removeFormat")} />
            <span className="mx-1 h-5 w-px bg-slate-200" />
          </>
        )}
        <Tool icon={MousePointerClick} title="Insert branded button" onClick={addButton} />
        <Tool icon={SquareStack} title="Insert highlighted box" onClick={() => insertText("[box]Details here[/box]")} />
        <div className="relative">
          <Tool icon={Braces} title="Insert variable" onClick={() => setVarsOpen((o) => !o)} active={varsOpen} />
          {varsOpen && (
            <div className="absolute z-30 left-0 top-9 w-64 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
              {Object.entries(VARIABLE_CATALOG).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { insertText(`{{${key}}}`); setVarsOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50"
                >
                  <span className="text-slate-800">{meta.label}</span>
                  <span className="block font-mono text-[11px] text-slate-400">{`{{${key}}}`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto">
          <Tool icon={Code2} title={source ? "Back to visual editor" : "Edit HTML source"} onClick={() => setSource((s) => !s)} active={source} />
        </div>
      </div>
      {source ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          spellCheck={false}
          className="block w-full resize-y rounded-b-lg p-3 font-mono text-xs text-slate-800 outline-none"
          style={{ minHeight }}
          aria-label="HTML source"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Message body"
          data-placeholder={placeholder}
          onInput={emit}
          onBlur={emit}
          className="email-rte prose-sm max-w-none p-4 text-[15px] leading-relaxed text-slate-800 outline-none overflow-auto [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-blue-700 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
