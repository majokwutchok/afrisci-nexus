import React, { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, FileText, Loader2 } from "lucide-react";
import { convertToAfriSciURL } from "@/utils/afrisciLinks";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function InlinePDFViewer({ fileUrl }) {
  const afrisciUrl = convertToAfriSciURL(fileUrl);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollContainerRef = useRef(null);

  const onLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onLoadError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  // Handle scroll wheel to navigate pages
  const handleWheel = useCallback((e) => {
    if (!numPages) return;
    e.preventDefault();
    
    if (e.deltaY > 0 && pageNumber < numPages) {
      setPageNumber(p => p + 1);
    } else if (e.deltaY < 0 && pageNumber > 1) {
      setPageNumber(p => p - 1);
    }
  }, [pageNumber, numPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

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
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white text-sm sticky top-0 z-10">
        <span className="font-medium">
          {loading ? "Loading…" : `Page ${pageNumber} / ${numPages}`}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">Scroll to navigate</span>
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
      <div ref={scrollContainerRef} className="flex-1 overflow-auto max-h-[600px] flex justify-center py-4 bg-slate-200">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading PDF…</p>
          </div>
        )}
        <Document
           file={afrisciUrl}
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