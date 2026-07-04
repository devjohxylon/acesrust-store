'use client';

import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import type { Challenge, ChallengeType, Redemption } from '@/lib/engagement/types';

type RedemptionRow = Redemption & { username: string };

const TYPE_LABELS: Record<ChallengeType, string> = {
  checkin_days: 'Check-in days',
  purchases: 'Purchases made',
  points_earned: 'Points earned',
};

type ChallengeForm = {
  title: string;
  description: string;
  type: ChallengeType;
  goal: string;
  points: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

const emptyForm: ChallengeForm = {
  title: '',
  description: '',
  type: 'checkin_days',
  goal: '5',
  points: '75',
  starts_at: '',
  ends_at: '',
  active: true,
};

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EngagementEditor() {
  const [configured, setConfigured] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [form, setForm] = useState<ChallengeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [grant, setGrant] = useState({ discordId: '', amount: '', description: '' });

  async function loadData() {
    const res = await fetch('/api/admin/engagement');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    setConfigured(data.configured !== false);
    setChallenges(data.challenges ?? []);
    setRedemptions(data.redemptions ?? []);
  }

  useEffect(() => {
    loadData()
      .catch(() => setError('Could not load engagement data.'))
      .finally(() => setLoading(false));
  }, []);

  async function post(body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      await loadData();
      setMessage(successMessage);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(challenge: Challenge) {
    setEditingId(challenge.id);
    setForm({
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      goal: String(challenge.goal),
      points: String(challenge.points),
      starts_at: toLocalInputValue(challenge.starts_at),
      ends_at: toLocalInputValue(challenge.ends_at),
      active: challenge.active,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await post(
      {
        action: editingId ? 'update_challenge' : 'create_challenge',
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        description: form.description,
        type: form.type,
        goal: Number(form.goal),
        points: Number(form.points),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        active: form.active,
      },
      editingId ? 'Challenge updated.' : 'Challenge created.'
    );
    if (ok) resetForm();
  }

  async function handleGrant(event: React.FormEvent) {
    event.preventDefault();
    const ok = await post(
      {
        action: 'grant_points',
        discordId: grant.discordId.trim(),
        amount: Number(grant.amount),
        description: grant.description.trim() || 'Manual adjustment',
      },
      'Points adjusted.'
    );
    if (ok) setGrant({ discordId: '', amount: '', description: '' });
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading engagement data…</p>;
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Engagement</h1>
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted">
          Engagement storage is not configured. Set <code className="text-primary">SUPABASE_URL</code>{' '}
          and <code className="text-primary">SUPABASE_SERVICE_ROLE_KEY</code>, then run{' '}
          <code className="text-primary">supabase/schema.sql</code> in the Supabase SQL editor.
        </div>
      </div>
    );
  }

  const pending = redemptions.filter((r) => r.status === 'pending');
  const resolved = redemptions.filter((r) => r.status !== 'pending');
  const inputClass =
    'w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Engagement</h1>
        <p className="text-sm text-muted mt-1">
          Weekly challenges, reward redemptions, and manual point adjustments.
        </p>
      </div>

      {message && <p className="text-sm text-green-400">{message}</p>}
      {error && <p className="text-sm text-primary">{error}</p>}

      {/* Pending redemptions */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white">
          Pending redemptions {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">Nothing to fulfill right now.</p>
        ) : (
          pending.map((r) => (
            <PendingRedemption key={r.id} redemption={r} onResolve={post} saving={saving} />
          ))
        )}
      </div>

      {/* Challenge form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            {editingId ? 'Edit challenge' : 'New challenge'}
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
              placeholder="Check in 5 days this week"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Tracked by</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ChallengeType })}
              className={inputClass}
            >
              {(Object.keys(TYPE_LABELS) as ChallengeType[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Goal</label>
            <input
              type="number"
              min={1}
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Reward points</label>
            <input
              type="number"
              min={1}
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Starts</label>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Ends</label>
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Description (optional)</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Shown under the challenge title on the homepage"
            className={inputClass}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="rounded border-border"
          />
          Active
        </label>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Saving…' : editingId ? 'Update challenge' : 'Create challenge'}
          </button>
        </div>
      </form>

      {/* Challenge list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white">All challenges</h2>
        {challenges.length === 0 ? (
          <p className="text-sm text-muted">No challenges yet.</p>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-xl border border-border bg-background/50 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{challenge.title}</p>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {TYPE_LABELS[challenge.type]}
                  </span>
                  {!challenge.active && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 text-muted border border-border">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted mt-1">
                  Goal {challenge.goal} · +{challenge.points} pts ·{' '}
                  {new Date(challenge.starts_at).toLocaleDateString()} →{' '}
                  {new Date(challenge.ends_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(challenge)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/40 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Delete this challenge?')) return;
                    await post({ action: 'delete_challenge', id: challenge.id }, 'Challenge deleted.');
                    if (editingId === challenge.id) resetForm();
                  }}
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

      {/* Manual point grants */}
      <form onSubmit={handleGrant} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-white">Manual point adjustment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Discord ID</label>
            <input
              value={grant.discordId}
              onChange={(e) => setGrant({ ...grant, discordId: e.target.value })}
              required
              placeholder="123456789012345678"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Amount (negative to deduct)</label>
            <input
              type="number"
              value={grant.amount}
              onChange={(e) => setGrant({ ...grant, amount: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Reason</label>
            <input
              value={grant.description}
              onChange={(e) => setGrant({ ...grant, description: e.target.value })}
              placeholder="Support compensation"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm hover:border-primary/40 disabled:opacity-60 cursor-pointer"
        >
          Apply adjustment
        </button>
      </form>

      {/* Resolved redemptions */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Recent resolved redemptions</h2>
          {resolved.slice(0, 10).map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-background/50 px-4 py-3 flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-muted truncate">
                <span className="text-white font-medium">{r.username}</span> · {r.reward_name} ·{' '}
                {r.cost} pts
              </span>
              <span
                className={`text-xs font-medium ${
                  r.status === 'fulfilled' ? 'text-green-400' : 'text-muted'
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingRedemption({
  redemption,
  onResolve,
  saving,
}: {
  redemption: RedemptionRow;
  onResolve: (body: Record<string, unknown>, message: string) => Promise<boolean>;
  saving: boolean;
}) {
  const [code, setCode] = useState('');

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-white">{redemption.reward_name}</p>
          <p className="text-xs text-muted mt-0.5">
            {redemption.username} · {redemption.cost} pts ·{' '}
            {new Date(redemption.created_at).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted/70 mt-0.5">Discord ID: {redemption.discord_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code (optional)"
            className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs w-44 focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onResolve(
                { action: 'resolve_redemption', id: redemption.id, status: 'fulfilled', code },
                'Redemption fulfilled.'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-background text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Fulfill
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onResolve(
                { action: 'resolve_redemption', id: redemption.id, status: 'refunded', code: null },
                'Redemption refunded.'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/40 disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refund
          </button>
        </div>
      </div>
    </div>
  );
}
