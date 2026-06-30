'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Calendar } from 'lucide-react';
import { ServerStatusWidget } from '@/components/server/server-status';

type HeroProps = {
  title: string;
  descriptionHtml: string;
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero({ title, descriptionHtml }: HeroProps) {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={item} className="flex justify-center mb-6">
            <ServerStatusWidget variant="pill" />
          </motion.div>

          <motion.h1
            variants={item}
            className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight"
          >
            <span className="text-white text-glow">{title}</span>
          </motion.h1>

          <motion.div
            variants={item}
            className="text-xl md:text-2xl text-muted mb-10 max-w-2xl mx-auto"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <button className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-background font-semibold text-lg transition-all glow-primary hover:scale-105 flex items-center gap-2 justify-center w-full sm:w-auto cursor-pointer">
                Browse Shop
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/leaderboard">
              <button className="px-8 py-4 rounded-xl border border-primary/30 bg-card/60 backdrop-blur text-white font-semibold text-lg transition-all hover:border-primary/60 hover:scale-105 flex items-center gap-2 justify-center w-full sm:w-auto cursor-pointer">
                <Trophy className="w-5 h-5 text-primary" />
                Leaderboard
              </button>
            </Link>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm"
          >
            <Link
              href="/wipes"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-muted hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <Calendar className="w-4 h-4 text-primary" />
              Wipe schedule
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
