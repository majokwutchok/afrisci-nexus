import React, { useEffect, useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPDF } from "@/utils/pdfOpen";

/**
 * Embeds a PDF in a full-screen modal.
 * - HTTP URLs (media.base44.com, etc.): rendered via Google Docs Viewer for maximum compatibility
 * - base64 data URLs: converted to a blob URL and embedded directly
 * - Escape key closes the modal
 */
export default function PDFViewerModal({ url, title, filename, onClose }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [isBase64, setIsBase64] = useState(false);

  useEffect(() => {
    if (!url) return;
    let objectUrl = null;

    if (url.startsWith("data:")) {
      // base64 → Blob URL for direct browser embedding
      setIsBase64(true);
      const [header, base64] = url.split(",");
      const mime = header.match(/:(.*?);/)?.[1] || "application/pdf";
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      objectUrl = URL.createObjectURL(new Blob([arr], { type: mime }));
      setEmbedUrl(objectUrl);
    } else {
      // HTTP URL → Google Docs Viewer (renders reliably without popups or CORS issues)
      setIsBase64(false);
      setEmbedUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOpenInNewTab = () => {
    if (url && !url.startsWith("data:")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (embedUrl) {
      window.open(embedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/85 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 flex-shrink-0 shadow-xl">
        <span className="font-semibold text-sm truncate max-w-lg text-slate-100">{title || "Article"}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:text-emerald-300 hover:bg-white/10"
            onClick={() => downloadPDF(url, filename || "article.pdf")}
          >
            <Download className="w-4 h-4 mr-1" /> Download
          </Button>
          {!isBase64 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-sky-300 hover:bg-white/10"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> Open Tab
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
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={title || "PDF Viewer"}
            allow="fullscreen"
          />
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