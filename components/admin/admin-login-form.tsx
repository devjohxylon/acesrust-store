'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminAuthMode } from '@/lib/cms-config';
import { siteConfig } from '@/lib/site';

export function AdminLoginForm({ authMode }: { authMode: AdminAuthMode }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError('Invalid password.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  if (authMode === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
          <p className="text-xs uppercase tracking-wider text-primary mb-2">Admin Panel</p>
          <h1 className="text-2xl font-bold text-white mb-4">{siteConfig.name}</h1>
          <p className="text-sm text-muted leading-relaxed">
            Admin login is not configured. Set{' '}
            <code className="text-primary">ADMIN_PASSWORD</code> in your environment
            (Vercel project settings or <code className="text-primary">.env.local</code>),
            then redeploy or restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <p className="text-xs uppercase tracking-wider text-primary mb-2">Admin Panel</p>
        <h1 className="text-2xl font-bold text-white mb-2">{siteConfig.name}</h1>
        <p className="text-sm text-muted mb-8">
          Enter the admin password to manage the leaderboard and wipe schedule.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs text-muted mb-1.5">
              Admin password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
