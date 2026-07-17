'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import type { WipeSchedule, WipeScheduleInput, WipeType } from '@/lib/cms-types';
import { WIPE_TYPE_LABELS } from '@/lib/cms-types';

const emptyForm: WipeScheduleInput = {
  title: '',
  description: '',
  scheduledAt: '',
  wipeType: 'map',
  isPublished: true,
};

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDisplayDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso));
}

export function WipesEditor() {
  const [wipes, setWipes] = useState<WipeSchedule[]>([]);
  const [form, setForm] = useState<WipeScheduleInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadWipes() {
    const res = await fetch('/api/admin/wipes');
    if (!res.ok) throw new Error('Failed to load');
    const data = (await res.json()) as { wipes: WipeSchedule[] };
    setWipes(data.wipes);
  }

  useEffect(() => {
    loadWipes()
      .catch(() => setError('Could not load wipe schedules.'))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(wipe: WipeSchedule) {
    setEditingId(wipe.id);
    setForm({
      title: wipe.title,
      description: wipe.description ?? '',
      scheduledAt: toLocalInputValue(wipe.scheduledAt),
      wipeType: wipe.wipeType,
      isPublished: wipe.isPublished,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      ...(editingId ? { id: editingId } : {}),
    };

    try {
      const res = await fetch('/api/admin/wipes', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      await loadWipes();
      resetForm();
      setMessage(editingId ? 'Wipe updated.' : 'Wipe created.');
    } catch {
      setError('Could not save wipe schedule.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this wipe schedule?')) return;

    setError('');
    try {
      const res = await fetch(`/api/admin/wipes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadWipes();
      if (editingId === id) resetForm();
      setMessage('Wipe deleted.');
    } catch {
      setError('Could not delete wipe schedule.');
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading wipe schedules…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Wipe Schedule</h1>
        <p className="text-sm text-muted mt-1">
          Create upcoming wipes shown on the site schedule page.
        </p>
      </div>

      {message && <p className="text-sm text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            {editingId ? 'Edit wipe' : 'New wipe'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Monthly Map Wipe"
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Wipe type</label>
            <select
              value={form.wipeType}
              onChange={(e) => setForm({ ...form, wipeType: e.target.value as WipeType })}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            >
              {(Object.keys(WIPE_TYPE_LABELS) as WipeType[]).map((type) => (
                <option key={type} value={type}>
                  {WIPE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Date & time</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-border"
              />
              Published on site
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Description (optional)</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Blueprint wipe at 2pm EST. Server offline 30 minutes before wipe."
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
        >
          {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {saving ? 'Saving…' : editingId ? 'Update wipe' : 'Create wipe'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold text-white">All wipes</h2>
        {wipes.length === 0 ? (
          <p className="text-sm text-muted">No wipe schedules yet.</p>
        ) : (
          wipes.map((wipe) => (
            <div
              key={wipe.id}
              className="rounded-xl border border-border bg-background/50 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{wipe.title}</p>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {WIPE_TYPE_LABELS[wipe.wipeType]}
                  </span>
                  {!wipe.isPublished && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 text-muted border border-border">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-sky-400 mt-1">{formatDisplayDate(wipe.scheduledAt)}</p>
                {wipe.description && (
                  <p className="text-sm text-muted mt-2">{wipe.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(wipe)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/40 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(wipe.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-primary hover:border-primary/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
