import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, EyeOff, Megaphone } from 'lucide-react';

const CATEGORIES = [
  { value: 'call_for_papers', label: '📄 Call for Papers' },
  { value: 'indexing', label: '⭐ Indexing Achievement' },
  { value: 'conference', label: '🌍 Conference' },
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'award', label: '🏆 Award' },
  { value: 'partnership', label: '🤝 Partnership' },
];

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-slate-100 text-slate-600',
  archived: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  title: '', slug: '', category: 'announcement', summary: '', content: '',
  cover_image_url: '', tags: [], external_url: '', deadline: '',
  is_featured: false, status: 'draft', published_date: new Date().toISOString().split('T')[0],
  author_name: 'AfriSci Nexus Editorial Team',
};

export default function NewsManager() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const data = await base44.entities.NewsPost.list('-published_date', 100);
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

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
    const payload = {
      ...form,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };
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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-teal-600" />
              News & Announcements Manager
            </CardTitle>
            <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" /> New Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-slate-400 py-8">Loading...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No news posts yet.</p>
              <p className="text-sm mt-1">Create your first post to display it on the homepage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status] || STATUS_COLORS.draft}`}>
                        {post.status}
                      </span>
                      {post.is_featured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">📌 Featured</span>}
                      <span className="text-xs text-slate-400">{CATEGORIES.find(c => c.value === post.category)?.label}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 truncate">{post.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{post.summary}</p>
                    {post.deadline && <p className="text-xs text-red-600 mt-1 font-medium">⏰ Deadline: {post.deadline}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(post)} title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                      {post.status === 'published' ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-teal-600" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                      <Edit className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit News Post' : 'Create News Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Call for Papers: AfriSci Journal of AI — Vol 2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Summary * <span className="text-slate-400 font-normal">(shown on homepage card)</span></Label>
              <Textarea className="mt-1" rows={2} value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="1–2 sentence teaser shown on the homepage..." />
            </div>
            <div>
              <Label>Full Content <span className="text-slate-400 font-normal">(optional — for detail page)</span></Label>
              <Textarea className="mt-1" rows={4} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write full article content here..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Published Date</Label>
                <Input type="date" className="mt-1" value={form.published_date} onChange={e => set('published_date', e.target.value)} />
              </div>
              <div>
                <Label>Deadline <span className="text-slate-400 font-normal">(for CFPs etc.)</span></Label>
                <Input type="date" className="mt-1" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>External URL <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input className="mt-1" value={form.external_url} onChange={e => set('external_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Cover Image URL <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input className="mt-1" value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </div>
            <div>
              <Label>SEO Tags <span className="text-slate-400 font-normal">(comma separated)</span></Label>
              <Input className="mt-1" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="call for papers, AI, Africa, 2026" />
            </div>
            <div>
              <Label>Author / Source</Label>
              <Input className="mt-1" value={form.author_name} onChange={e => set('author_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={form.is_featured} onCheckedChange={v => set('is_featured', v)} id="featured" />
              <Label htmlFor="featured" className="cursor-pointer">📌 Pin as Featured (appears prominently at top)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.summary} className="bg-teal-600 hover:bg-teal-700">
              {saving ? 'Saving...' : (editing ? 'Update Post' : 'Publish Post')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}