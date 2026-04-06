import React, { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function InlinePDFViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onLoadError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  if (!fileUrl) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        <FileText className="w-12 h-12 mb-3 text-slate-300" />
        <p className="font-medium">Unable to load PDF preview</p>
        <p className="text-sm mt-1">Please use the Download button to access the file.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white text-sm">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-slate-700"
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 min-w-[80px] text-center">
            {loading ? "…" : `${pageNumber} / ${numPages}`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-slate-700"
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-slate-700"
            onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-slate-700"
            onClick={() => setScale(s => Math.min(2.5, +(s + 0.2).toFixed(1)))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Render Area */}
      <div className="overflow-auto max-h-[600px] flex justify-center py-4 bg-slate-200">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading PDF…</p>
          </div>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={null}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-xl"
          />
        </Document>
      </div>
    </div>
  );
}