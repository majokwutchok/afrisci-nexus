import React, { useEffect, useState } from "react";
import { X, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPDF } from "@/utils/pdfOpen";

/**
 * Embeds a PDF (base64 data URL or HTTP URL) in a full-screen modal overlay.
 * Uses an object/iframe tag so the browser renders it immediately without popups.
 */
export default function PDFViewerModal({ url, title, filename, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!url) return;
    let objectUrl = null;
    if (url.startsWith("data:")) {
      const [header, base64] = url.split(",");
      const mime = header.match(/:(.*?);/)?.[1] || "application/pdf";
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      objectUrl = URL.createObjectURL(new Blob([arr], { type: mime }));
      setBlobUrl(objectUrl);
    } else {
      setBlobUrl(url);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 flex-shrink-0">
        <span className="font-semibold text-sm truncate max-w-lg">{title || "Article"}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {blobUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-emerald-300 hover:bg-white/10"
              onClick={() => downloadPDF(url, filename || "article.pdf")}
            >
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:text-red-300 hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="flex-1 min-h-0 bg-slate-700">
        {blobUrl ? (
          <object
            data={blobUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            {/* Fallback for browsers that block object embeds */}
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={title || "PDF Viewer"}
            />
          </object>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center space-y-3">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm text-white/70">Loading document…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}