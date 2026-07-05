import Link from 'next/link';
import { Calendar, Gift, ShoppingBag, Trophy } from 'lucide-react';

const links = [
  {
    href: '/shop',
    label: 'Shop',
    description: 'Browse kits & VIP',
    icon: ShoppingBag,
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    description: 'In-game stats & points race',
    icon: Trophy,
  },
  {
    href: '/community',
    label: 'Community',
    description: 'Challenges, activity & rewards',
    icon: Gift,
  },
  {
    href: '/wipes',
    label: 'Wipes',
    description: 'Upcoming server wipes',
    icon: Calendar,
  },
] as const;

export function QuickLinks() {
  return (
    <section className="py-10 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {links.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-border bg-card/60 backdrop-blur p-4 hover:border-primary/40 hover:bg-card transition-colors"
            >
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-white group-hover:text-primary transition-colors">
                {label}
              </p>
              <p className="text-xs text-muted mt-0.5 leading-snug">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
