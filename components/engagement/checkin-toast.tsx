'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { useCheckin, useMe } from '@/hooks/use-engagement';
import type { CheckinOutcome } from '@/lib/engagement/service';

/**
 * Fires the daily check-in automatically on the first authenticated page view
 * of the day and celebrates with a toast. Renders nothing when logged out.
 */
export function CheckinToast() {
  const { data } = useMe();
  const checkin = useCheckin();
  const [outcome, setOutcome] = useState<CheckinOutcome | null>(null);
  const [visible, setVisible] = useState(false);
  const attempted = useRef(false);

  const loggedIn = Boolean(data?.user && data?.profile);

  useEffect(() => {
    if (!loggedIn || attempted.current) return;
    attempted.current = true;

    checkin
      .mutateAsync()
      .then((result) => {
        if (result.status === 'checked_in') {
          setOutcome(result);
          setVisible(true);
        }
      })
      .catch(() => {
        // Silent — check-in retries on next page view.
      });
  }, [loggedIn, checkin]);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && outcome && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          className="fixed bottom-6 right-6 z-50 max-w-xs"
        >
          <div className="rounded-xl bg-card border border-primary/40 shadow-2xl glow-primary p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm">
                  +{outcome.points} points!
                </p>
                <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Day {outcome.streak} check-in streak
                </p>
                {outcome.unlocked.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {outcome.unlocked.map((a) => (
                      <p key={a.id} className="text-xs text-primary font-medium">
                        {a.icon} Achievement unlocked: {a.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
