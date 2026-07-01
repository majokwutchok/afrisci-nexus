import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { generateLocalNewsPost } from '@/utils/localNewsWriter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Megaphone, Search, Globe, Tag,
  Calendar, ExternalLink, Star, Clock, CheckCircle, Archive, FileText,
  Zap, BookOpen, Award, Handshake, ChevronRight, Sparkles, Wand2
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: Globe, color: 'bg-slate-100 text-slate-700 border-slate-300', activeColor: 'bg-slate-800 text-white' },
  { value: 'call_for_papers', label: 'Call for Papers', icon: FileText, color: 'bg-blue-50 text-blue-700 border-blue-200', activeColor: 'bg-blue-600 text-white', emoji: '📄' },
  { value: 'indexing', label: 'Indexing', icon: Star, color: 'bg-amber-50 text-amber-700 border-amber-200', activeColor: 'bg-amber-500 text-white', emoji: '⭐' },
  { value: 'conference', label: 'Conference', icon: Globe, color: 'bg-green-50 text-green-700 border-green-200', activeColor: 'bg-green-600 text-white', emoji: '🌍' },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: 'bg-purple-50 text-purple-700 border-purple-200', activeColor: 'bg-purple-600 text-white', emoji: '📢' },
  { value: 'award', label: 'Award', icon: Award, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', activeColor: 'bg-yellow-500 text-white', emoji: '🏆' },
  { value: 'partnership', label: 'Partnership', icon: Handshake, color: 'bg-teal-50 text-teal-700 border-teal-200', activeColor: 'bg-teal-600 text-white', emoji: '🤝' },
];

const STATUS_CONFIG = {
  published: { label: 'Published', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  archived: { label: 'Archived', color: 'bg-red-100 text-red-700 border-red-200', icon: Archive },
};

const EMPTY_FORM = {
  title: '', slug: '', category: 'announcement', summary: '', content: '',
  cover_image_url: '', tags: [], external_url: '', deadline: '',
  is_featured: false, status: 'draft',
  published_date: new Date().toISOString().split('T')[0],
  author_name: 'AfriSci Nexus Editorial Team',
};

function generateSlug(title) {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 80);
}

function SEOPreview({ title, summary, slug, tags }) {
  const baseUrl = 'https://afriscinexus.com';
  const url = `${baseUrl}/news/${slug || generateSlug(title || 'untitled')}`;
  const metaDesc = summary?.slice(0, 160) || '';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-sans">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> Google Search Preview</p>
      <div className="space-y-0.5">
        <div className="text-slate-500 text-xs truncate">{url}</div>
        <div className="text-blue-700 font-semibold text-base leading-tight line-clamp-1 hover:underline cursor-pointer">
          {title || 'Your Post Title Here'} | AfriSci Nexus
        </div>
        <div className="text-slate-600 text-xs leading-relaxed line-clamp-2">
          {metaDesc || 'Your summary will appear here as the meta description in Google search results. Keep it between 120–160 characters for best SEO impact.'}
        </div>
        {tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.slice(0, 5).map(t => (
              <span key={t} className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsManager() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setIsLoading(true);
    const data = await base44.entities.NewsPost.list('-published_date', 200);
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categoryCounts = useMemo(() => {
    const counts = { all: posts.length };
    CATEGORIES.slice(1).forEach(c => {
      counts[c.value] = posts.filter(p => p.category === c.value).length;
    });
    return counts;
  }, [posts]);

  const filtered = useMemo(() => posts.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.summary?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [posts, activeCategory, statusFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setTagsInput('');
    setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditing(post);
    setForm({ ...EMPTY_FORM, ...post });
    setTagsInput((post.tags || []).join(', '));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const slug = form.slug || generateSlug(form.title);
    const payload = { ...form, tags, slug };
    if (editing) {
      await base44.entities.NewsPost.update(editing.id, payload);
    } else {
      await base44.entities.NewsPost.create(payload);
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this news post?')) return;
    await base44.entities.NewsPost.delete(id);
    load();
  };

  const togglePublish = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const update = { status: newStatus };
    if (newStatus === 'published' && !post.published_date) update.published_date = new Date().toISOString().split('T')[0];
    await base44.entities.NewsPost.update(post.id, update);
    load();
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAIWrite = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError('');
    try {
      const result = generateLocalNewsPost({ category: form.category, prompt: aiPrompt });
      setForm(f => ({
        ...f,
        title: result.title || f.title,
        summary: result.summary || f.summary,
        content: result.content || f.content,
        slug: generateSlug(result.title || f.title),
      }));
      setTagsInput(result.tags.join(', '));
    } catch (e) {
      setAiError('Generation failed. Please try again.');
    }
    setAiGenerating(false);
  };

  const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

  const catDef = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-teal-600" />
            News & Announcements
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage SEO-optimised content across all news categories. Published posts appear on the homepage and are indexed by Google.</p>
        </div>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700 shadow-lg text-white font-semibold px-6 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {['published', 'draft', 'archived'].map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = posts.filter(p => p.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${statusFilter === s ? 'border-teal-400 bg-teal-50' : 'border-transparent bg-white hover:border-slate-200'} shadow-sm`}>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1 ${cfg.color}`}>
                <cfg.icon className="w-3 h-3" />{cfg.label}
              </div>
              <div className="text-2xl font-bold text-slate-900">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Category filter bar */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.value;
          const count = categoryCounts[cat.value] || 0;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${isActive ? cat.activeColor + ' border-transparent shadow' : cat.color + ' hover:shadow-sm'}`}
            >
              {cat.emoji && <span>{cat.emoji}</span>}
              {cat.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-white/70'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9 bg-white border-slate-200"
          placeholder="Search posts by title or summary..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Post list */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
          Loading news posts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Megaphone className="w-14 h-14 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-400 text-lg">No posts found</p>
          <p className="text-sm text-slate-300 mt-1">Try adjusting your filters or create a new post.</p>
          <Button onClick={openCreate} className="mt-4 bg-teal-600 hover:bg-teal-700"><Plus className="w-4 h-4 mr-1" /> Create Post</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(post => {
            const cat = catDef(post.category);
            const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            return (
              <Card key={post.id} className="border border-slate-200 hover:border-teal-200 hover:shadow-md transition-all bg-white group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Category icon strip */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cat.color} border`}>
                      {cat.emoji || <cat.icon className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusCfg.color}`}>
                          <statusCfg.icon className="w-3 h-3" />{statusCfg.label}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cat.color}`}>{cat.emoji} {cat.label}</span>
                        {post.is_featured && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">📌 Featured</span>}
                        {post.deadline && <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">⏰ {post.deadline}</span>}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-teal-700 transition-colors line-clamp-1">{post.title}</h3>

                      {/* Summary */}
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{post.summary}</p>

                      {/* SEO tags + date row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {post.tags?.slice(0, 4).map(tag => (
                          <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                            <Tag className="w-2.5 h-2.5" />{tag}
                          </span>
                        ))}
                        {post.published_date && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3" />{post.published_date}
                          </span>
                        )}
                      </div>

                      {/* SEO slug */}
                      {post.slug && (
                        <div className="mt-1 text-xs text-slate-300 font-mono truncate">/news/{post.slug}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => togglePublish(post)}
                        title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        className={post.status === 'published' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}
                      >
                        {post.status === 'published'
                          ? <CheckCircle className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(post)} className="hover:bg-blue-50 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog — Full-featured, large */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto p-0 bg-white">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-700 to-teal-600 text-white px-8 py-5 rounded-t-xl">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2 m-0">
              {editing ? <><Edit className="w-5 h-5" /> Edit Post</> : <><Plus className="w-5 h-5" /> Create News Post</>}
            </DialogTitle>
            <p className="text-teal-200 text-sm mt-0.5">All fields contribute to SEO ranking and discoverability on Google.</p>
          </div>

          <div className="p-8 space-y-6">
            {/* AI Writer */}
            <div className="rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 p-5 space-y-3">
              <h3 className="text-sm font-bold text-teal-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI News Writer
              </h3>
              <p className="text-xs text-teal-600">Describe what you want to announce in a sentence or two. Generates the full post instantly — title, summary, body, and SEO tags — no integration credits required.</p>
              <div className="flex gap-2">
                <Textarea
                  className="flex-1 border-teal-200 bg-white resize-none text-sm focus:border-teal-400"
                  rows={2}
                  placeholder='e.g. "Call for papers for the 2026 AfriSci Journal of Medicine. Deadline June 30. Topics: tropical diseases, public health, surgery in low-resource settings."'
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
              </div>
              {aiError && <p className="text-xs text-red-500">{aiError}</p>}
              <Button
                onClick={handleAIWrite}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold w-full"
              >
                {aiGenerating
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Generating post…</>
                  : <><Wand2 className="w-4 h-4 mr-2" />Generate Full Post with AI</>}
              </Button>
            </div>

            {/* Core info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4 text-teal-500" /> Core Content</h3>

              <div>
                <Label className="text-slate-700 font-semibold">Title * <span className="text-slate-400 font-normal text-xs">(Primary H1 — most important for SEO)</span></Label>
                <Input
                  className="mt-1.5 text-base font-medium border-slate-300 focus:border-teal-400 h-11"
                  value={form.title}
                  onChange={e => { set('title', e.target.value); if (!editing) set('slug', generateSlug(e.target.value)); }}
                  placeholder="e.g. Call for Papers: AfriSci Journal of AI Research — Volume 3, 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-semibold">Category *</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger className="mt-1.5 border-slate-300 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.slice(1).map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.emoji} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-700 font-semibold">Publication Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger className="mt-1.5 border-slate-300 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">🕐 Draft — save without publishing</SelectItem>
                      <SelectItem value="published">✅ Published — live on site & indexed</SelectItem>
                      <SelectItem value="archived">📦 Archived — hidden from public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-semibold">Summary / Meta Description *
                  <span className={`ml-2 text-xs font-normal ${form.summary?.length > 160 ? 'text-red-500' : form.summary?.length > 100 ? 'text-green-600' : 'text-slate-400'}`}>
                    {form.summary?.length || 0}/160 chars
                  </span>
                </Label>
                <Textarea
                  className="mt-1.5 border-slate-300 focus:border-teal-400 resize-none"
                  rows={3}
                  value={form.summary}
                  onChange={e => set('summary', e.target.value)}
                  placeholder="1–2 sentence teaser. This appears in Google search results — make it compelling and keyword-rich. Aim for 120–160 characters."
                />
              </div>

              <div>
                <Label className="text-slate-700 font-semibold">Full Content <span className="text-slate-400 font-normal text-xs">(shown on detail page)</span></Label>
                <Textarea
                  className="mt-1.5 border-slate-300 focus:border-teal-400 font-mono text-sm"
                  rows={7}
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  placeholder="Write the full body of the announcement here. Use clear headings, bullet points, and include key terms for search engine discovery..."
                />
              </div>
            </div>

            <Separator />

            {/* SEO fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> SEO & Discoverability</h3>

              <div>
                <Label className="text-slate-700 font-semibold">URL Slug <span className="text-slate-400 font-normal text-xs">(auto-generated from title)</span></Label>
                <div className="flex mt-1.5 items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2 text-xs text-slate-400 rounded-l-md font-mono">/news/</span>
                  <Input
                    className="rounded-l-none border-slate-300 font-mono text-sm"
                    value={form.slug}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s/g, '-'))}
                    placeholder="your-post-slug-here"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-semibold">SEO Tags / Keywords <span className="text-slate-400 font-normal text-xs">(comma separated — include research terms, disciplines, geography)</span></Label>
                <Input
                  className="mt-1.5 border-slate-300"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="African research, call for papers, open access, peer review, 2026, STEM, Ghana, Nigeria"
                />
                {parsedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parsedTags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Google preview */}
              <SEOPreview title={form.title} summary={form.summary} slug={form.slug} tags={parsedTags} />
            </div>

            <Separator />

            {/* Publishing options */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" /> Publishing Options</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-semibold">Published Date</Label>
                  <Input type="date" className="mt-1.5 border-slate-300 h-11" value={form.published_date} onChange={e => set('published_date', e.target.value)} />
                </div>
                <div>
                  <Label className="text-slate-700 font-semibold">Submission Deadline <span className="text-slate-400 font-normal text-xs">(for CFPs etc.)</span></Label>
                  <Input type="date" className="mt-1.5 border-slate-300 h-11" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-semibold">External Link <span className="text-slate-400 font-normal text-xs">(optional — links out from the post)</span></Label>
                <div className="flex mt-1.5 items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2 rounded-l-md"><ExternalLink className="w-4 h-4 text-slate-400" /></span>
                  <Input className="rounded-l-none border-slate-300" value={form.external_url} onChange={e => set('external_url', e.target.value)} placeholder="https://conference.org/submit" />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-semibold">Cover Image URL <span className="text-slate-400 font-normal text-xs">(optional — used in cards and social sharing)</span></Label>
                <Input className="mt-1.5 border-slate-300" value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} placeholder="https://images.unsplash.com/..." />
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="" className="mt-2 h-24 rounded-lg object-cover border border-slate-200" onError={e => e.target.style.display = 'none'} />
                )}
              </div>

              <div>
                <Label className="text-slate-700 font-semibold">Author / Source Name</Label>
                <Input className="mt-1.5 border-slate-300" value={form.author_name} onChange={e => set('author_name', e.target.value)} />
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Switch checked={form.is_featured} onCheckedChange={v => set('is_featured', v)} id="featured" />
                <div>
                  <Label htmlFor="featured" className="cursor-pointer font-semibold text-amber-800">📌 Feature this post</Label>
                  <p className="text-xs text-amber-600 mt-0.5">Featured posts appear prominently at the top of the homepage news section.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between gap-4 rounded-b-xl">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-600">Cancel</Button>
            <div className="flex gap-3">
              {form.status !== 'draft' && (
                <Button variant="outline" onClick={() => { set('status', 'draft'); }} className="border-slate-300">
                  Save as Draft
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !form.title || !form.summary}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 shadow-lg"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Saving...</>
                  : form.status === 'published'
                    ? <><CheckCircle className="w-4 h-4 mr-2" />Publish Post</>
                    : <><Clock className="w-4 h-4 mr-2" />{editing ? 'Update Post' : 'Save Draft'}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}