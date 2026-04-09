import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Plus, X, ArrowLeft, Eye, Edit3, AlertCircle, CheckCircle, Loader, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ManuscriptEditor() {
  const [activeTab, setActiveTab] = useState('template'); // 'template', 'markdown', 'preview'
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: [{ name: '', affiliation: '', email: '' }],
    keywords: [],
    body: ''
  });
  const [markdownContent, setMarkdownContent] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Convert form data to markdown
  const generateMarkdown = () => {
    const authors = formData.authors.map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ''}`).join(', ');
    const keywords = formData.keywords.join(', ');
    return `# ${formData.title}

**Authors:** ${authors}

**Keywords:** ${keywords}

## Abstract

${formData.abstract}

## Content

${formData.body}`;
  };

  const handleAddAuthor = () => {
    setFormData({
      ...formData,
      authors: [...formData.authors, { name: '', affiliation: '', email: '' }]
    });
  };

  const handleRemoveAuthor = (index) => {
    setFormData({
      ...formData,
      authors: formData.authors.filter((_, i) => i !== index)
    });
  };

  const handleAuthorChange = (index, field, value) => {
    const newAuthors = [...formData.authors];
    newAuthors[index][field] = value;
    setFormData({ ...formData, authors: newAuthors });
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()]
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      // Generate markdown and convert to PDF using html2canvas and jspdf
      const markdown = activeTab === 'template' ? generateMarkdown() : markdownContent;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; line-height: 1.6;">
          ${markdown
            .replace(/^# (.+)$/gm, '<h1 style="font-size: 28px; margin: 20px 0;">$1</h1>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size: 22px; margin: 15px 0; margin-top: 20px;">$1</h2>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')}
        </div>
      `;

      // For now, trigger a simple download message
      const fileName = `${formData.title || 'manuscript'}_${new Date().getTime()}.md`;
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown));
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
    }
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manuscript Editor</h1>
              <p className="text-sm text-slate-600">Create and format your research documents</p>
            </div>
          </div>
          <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Use the <strong>Template</strong> tab for structured form-based editing, or switch to <strong>Markdown</strong> for a more flexible text-based approach. Both formats can be exported.
          </p>
        </div>

        {/* Success message */}
        {exportSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              Document exported successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Tab controls */}
        <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'template' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-4 h-4" /> Template Form
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'markdown' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Markdown Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>

        {/* Template Form Tab */}
        {activeTab === 'template' && (
          <div className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Manuscript Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter manuscript title"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Abstract */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Abstract</label>
                  <textarea
                    value={formData.abstract}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                    placeholder="Summarize your research in 150-250 words"
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Keywords</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (handleAddKeyword(), e.preventDefault())}
                      placeholder="Add keyword and press Enter"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={handleAddKeyword} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <Badge key={keyword} className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        {keyword}
                        <button onClick={() => handleRemoveKeyword(keyword)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Authors */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Authors</CardTitle>
                <Button onClick={handleAddAuthor} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" /> Add Author
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.authors.map((author, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">Author {idx + 1}</span>
                      {formData.authors.length > 1 && (
                        <Button
                          onClick={() => handleRemoveAuthor(idx)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={author.name}
                      onChange={(e) => handleAuthorChange(idx, 'name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="text"
                      value={author.affiliation}
                      onChange={(e) => handleAuthorChange(idx, 'affiliation', e.target.value)}
                      placeholder="Institution/Affiliation"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="email"
                      value={author.email}
                      onChange={(e) => handleAuthorChange(idx, 'email', e.target.value)}
                      placeholder="Email address"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Manuscript Body */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Manuscript Body</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Enter your manuscript content here. Structure it with sections as needed."
                  rows={12}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Markdown Editor Tab */}
        {activeTab === 'markdown' && (
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Markdown Content</CardTitle>
              <p className="text-xs text-slate-600 mt-1">Use standard Markdown syntax. Preview will update automatically.</p>
            </CardHeader>
            <CardContent>
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="# Manuscript Title&#10;&#10;**Author Name**&#10;&#10;## Introduction&#10;&#10;Your content here..."
                rows={16}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none bg-slate-50 p-8 rounded-lg">
                <ReactMarkdown>
                  {activeTab === 'preview' && (activeTab !== 'template' ? markdownContent : generateMarkdown())}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}