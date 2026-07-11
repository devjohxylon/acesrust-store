'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ServerStatusWidget } from '@/components/server/server-status';

type HeroProps = {
  title: string;
  descriptionHtml: string;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero({ title, descriptionHtml }: HeroProps) {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-48 bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div variants={item} className="flex justify-center mb-5">
            <ServerStatusWidget variant="pill" />
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight"
          >
            <span className="text-glow">{title}</span>
          </motion.h1>

          <motion.div
            variants={item}
            className="text-base md:text-lg text-muted mb-8 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="btn-primary-glow inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition-all"
            >
              Browse Shop
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center justify-center px-7 py-3 rounded-lg border border-primary/30 bg-card/80 text-white font-medium hover:border-primary/60 hover:bg-card transition-all"
            >
              Community Hub
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
