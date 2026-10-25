import React, { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import '@/lib/pdfWorker';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Highlighter, X, Eye, EyeOff, MessageSquare, Trash2 } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', bg: 'rgba(255, 235, 59, 0.3)', border: '#FBC02D', label: 'Yellow' },
  { name: 'green', bg: 'rgba(76, 175, 80, 0.3)', border: '#4CAF50', label: 'Green' },
  { name: 'blue', bg: 'rgba(33, 150, 243, 0.3)', border: '#2196F3', label: 'Blue' },
  { name: 'red', bg: 'rgba(244, 67, 54, 0.3)', border: '#F44336', label: 'Red' },
  { name: 'pink', bg: 'rgba(233, 30, 99, 0.3)', border: '#E91E63', label: 'Pink' }
];

export default function AnnotatedPDFViewer({ fileUrl, manuscriptId }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pageRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [manuscriptId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me().catch(() => null);
      setCurrentUser(user);

      if (manuscriptId && user) {
        const annots = await base44.entities.Annotation.filter({
          manuscript_id: manuscriptId
        });
        setAnnotations(annots || []);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowNoteForm(true);
    }
  };

  const handleCreateAnnotation = async () => {
    if (!selectedText || !currentUser || !noteContent.trim()) return;

    try {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      await base44.entities.Annotation.create({
        manuscript_id: manuscriptId,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        page_number: currentPage,
        highlighted_text: selectedText,
        note_content: noteContent,
        is_public: isPublic,
        color: highlightColor,
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        }
      });

      // Reload annotations
      const updated = await base44.entities.Annotation.filter({
        manuscript_id: manuscriptId
      });
      setAnnotations(updated || []);

      // Reset form
      setSelectedText('');
      setNoteContent('');
      setShowNoteForm(false);
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.error('Error creating annotation:', error);
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    try {
      await base44.entities.Annotation.delete(annotationId);
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  const toggleAnnotationVisibility = async (annotationId, currentIsPublic) => {
    try {
      await base44.entities.Annotation.update(annotationId, {
        is_public: !currentIsPublic
      });
      setAnnotations(prev =>
        prev.map(a => a.id === annotationId ? { ...a, is_public: !currentIsPublic } : a)
      );
    } catch (error) {
      console.error('Error updating annotation visibility:', error);
    }
  };

  const currentPageAnnotations = annotations.filter(a => a.page_number === currentPage);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
        <p className="text-slate-600">Sign in to use annotation features.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* PDF Viewer */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              −
            </Button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
            >
              +
            </Button>
          </div>
          <div className="text-xs text-slate-600">
            Page {currentPage} of {numPages}
          </div>
        </div>

        <div
          ref={pageRef}
          className="bg-white rounded-lg border border-slate-200 p-6 overflow-auto max-h-[70vh] cursor-text"
          onMouseUp={handleTextSelection}
          style={{ backgroundColor: '#f5f5f5' }}
        >
          <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              pageNumber={currentPage}
              scale={zoom / 100}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>

          {/* Highlight Overlays */}
          {currentPageAnnotations.map(annotation => {
            const color = HIGHLIGHT_COLORS.find(c => c.name === annotation.color);
            return (
              <div
                key={annotation.id}
                className="absolute opacity-40 pointer-events-none"
                style={{
                  left: `${annotation.position?.x}px`,
                  top: `${annotation.position?.y}px`,
                  width: `${annotation.position?.width}px`,
                  height: `${annotation.position?.height}px`,
                  backgroundColor: color?.bg,
                  borderLeft: `3px solid ${color?.border}`
                }}
              />
            );
          })}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage === numPages}
          >
            Next →
          </Button>
        </div>

        {/* Annotation Form */}
        {showNoteForm && selectedText && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Highlighter className="w-4 h-4" />
                Add Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-2">Selected text:</p>
                <p className="text-sm font-mono bg-white p-2 rounded border border-slate-200">
                  "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
                </p>
              </div>

              {/* Color Picker */}
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">Highlight color:</p>
                <div className="flex gap-2">
                  {HIGHLIGHT_COLORS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setHighlightColor(color.name)}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        highlightColor === color.name
                          ? `border-slate-900`
                          : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color.bg }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <Textarea
                placeholder="Write your note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="h-24"
              />

              {/* Public/Private Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs text-slate-700">
                  {isPublic ? '✓ Public - others can see this note' : 'Private - only you can see this note'}
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateAnnotation}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Note
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNoteContent('');
                    window.getSelection().removeAllRanges();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Annotations Sidebar */}
      <div className="space-y-4">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Annotations ({currentPageAnnotations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
            {currentPageAnnotations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No annotations on this page. Select text to add one.
              </p>
            ) : (
              currentPageAnnotations.map(annotation => {
                const color = HIGHLIGHT_COLORS.find(c => c.name === annotation.color);
                const isOwner = currentUser?.email === annotation.user_email;

                return (
                  <div
                    key={annotation.id}
                    className="p-3 rounded-lg border-2"
                    style={{ borderColor: color?.border, backgroundColor: color?.bg }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {annotation.user_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Page {annotation.page_number}
                        </p>
                      </div>
                      {isOwner && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      )}
                    </div>

                    {/* Highlighted Text */}
                    <p className="text-xs font-mono bg-white/50 p-2 rounded mb-2 max-h-12 overflow-hidden text-slate-700">
                      "{annotation.highlighted_text}"
                    </p>

                    {/* Note Content */}
                    <p className="text-sm text-slate-800 mb-2">
                      {annotation.note_content}
                    </p>

                    {/* Visibility Toggle */}
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs w-full"
                        onClick={() => toggleAnnotationVisibility(annotation.id, annotation.is_public)}
                      >
                        {annotation.is_public ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Button>
                    )}

                    {!isOwner && annotation.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600">
              <strong>How to annotate:</strong> Select any text in the PDF to highlight and add a note. Toggle between public/private to control visibility.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}