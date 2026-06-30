import Link from 'next/link';
import { Calendar, Trophy } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Manage public site content for Aces Vanilla+.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/leaderboard"
          className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors group"
        >
          <Trophy className="w-8 h-8 text-primary mb-4 group-hover:scale-105 transition-transform" />
          <h2 className="font-semibold text-white mb-2">Leaderboard</h2>
          <p className="text-sm text-muted">
            Update top killers, survivors, victims, and total kills shown on the site.
          </p>
        </Link>

        <Link
          href="/admin/wipes"
          className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors group"
        >
          <Calendar className="w-8 h-8 text-primary mb-4 group-hover:scale-105 transition-transform" />
          <h2 className="font-semibold text-white mb-2">Wipe Schedule</h2>
          <p className="text-sm text-muted">
            Create and publish upcoming map, blueprint, and full wipes.
          </p>
        </Link>
      </div>
    </div>
  );
}
