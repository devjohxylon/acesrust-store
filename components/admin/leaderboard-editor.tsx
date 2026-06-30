'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { LeaderboardData, LeaderboardEntry } from '@/lib/leaderboard-data';

type CategoryKey = 'topKillers' | 'topSurvivors' | 'topVictims';

const categoryLabels: Record<CategoryKey, string> = {
  topKillers: 'Top Killers',
  topSurvivors: 'Top Survivors (K/D)',
  topVictims: 'Top Victims',
};

function emptyRow(rank: number): LeaderboardEntry {
  return { rank, player: '', value: 0 };
}

function reindex(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function EntryEditor({
  title,
  entries,
  onChange,
}: {
  title: string;
  entries: LeaderboardEntry[];
  onChange: (entries: LeaderboardEntry[]) => void;
}) {
  function updateRow(index: number, patch: Partial<LeaderboardEntry>) {
    const next = entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
    onChange(reindex(next));
  }

  function removeRow(index: number) {
    onChange(reindex(entries.filter((_, i) => i !== index)));
  }

  function addRow() {
    onChange(reindex([...entries, emptyRow(entries.length + 1)]));
  }

  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add row
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted mb-3">No entries yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={index} className="grid grid-cols-[2rem_1fr_5rem_auto] gap-2 items-center">
              <span className="text-xs font-mono text-muted">{index + 1}</span>
              <input
                value={entry.player}
                onChange={(e) => updateRow(index, { player: e.target.value })}
                placeholder="Player name"
                className="px-2 py-1.5 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={entry.value}
                onChange={(e) => updateRow(index, { value: Number(e.target.value) || 0 })}
                className="px-2 py-1.5 rounded-md bg-card border border-border text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-1.5 text-muted hover:text-primary cursor-pointer"
                aria-label="Remove row"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeaderboardEditor() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/leaderboard')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json() as Promise<LeaderboardData>;
      })
      .then(setData)
      .catch(() => setError('Could not load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/leaderboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Save failed');
      const saved = (await res.json()) as LeaderboardData;
      setData(saved);
      setMessage('Leaderboard saved.');
    } catch {
      setError('Could not save leaderboard.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading leaderboard…</p>;
  }

  if (!data) {
    return <p className="text-sm text-primary">{error || 'Leaderboard unavailable.'}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-muted mt-1">
            Manual tables are used when no KAOS image is synced. Run /aces-leaderboard in Discord to
            pull the live KAOS screenshot.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {message && <p className="text-sm text-green-400">{message}</p>}
      {error && <p className="text-sm text-primary">{error}</p>}

      {data.kaosImageUrl ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
          <p className="text-sm text-sky-200 font-medium">KAOS image synced from Discord</p>
          <p className="text-xs text-muted">Last update: {data.updatedAt}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.kaosImageUrl}
            alt="Synced KAOS leaderboard"
            className="max-h-48 w-auto rounded border border-white/10"
          />
        </div>
      ) : (
        <p className="text-xs text-muted rounded-lg border border-border bg-background/40 px-4 py-3">
          No KAOS image yet. Use /aces-leaderboard in Discord after deploying the ingest API.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted mb-1.5">Server name</label>
          <input
            value={data.serverName}
            onChange={(e) => setData({ ...data, serverName: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Total kills</label>
          <input
            type="number"
            min={0}
            value={data.totalKills}
            onChange={(e) => setData({ ...data, totalKills: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-4">
        {(Object.keys(categoryLabels) as CategoryKey[]).map((key) => (
          <EntryEditor
            key={key}
            title={categoryLabels[key]}
            entries={data[key]}
            onChange={(entries) => setData({ ...data, [key]: entries })}
          />
        ))}
      </div>
    </div>
  );
}
