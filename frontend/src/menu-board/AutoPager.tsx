import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AutoPagerProps<T> {
  pages: T[];
  durationMs: number;
  renderPage: (page: T, index: number) => React.ReactNode;
}

const TRANSITION_MS = 0.32;

export function AutoPager<T>({ pages, durationMs, renderPage }: AutoPagerProps<T>) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (pages.length ? (prev + 1) % pages.length : prev));
    }, durationMs);
    return () => clearInterval(timer);
  }, [pages.length, durationMs]);

  useEffect(() => {
    if (index >= pages.length) {
      setIndex(0);
    }
  }, [index, pages.length]);

  const active = pages[index];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ x: 120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -120, opacity: 0 }}
        transition={{ duration: TRANSITION_MS, ease: [0.33, 1, 0.68, 1] }}
        className="h-full w-full"
      >
        {active ? renderPage(active, index) : null}
      </motion.div>
    </AnimatePresence>
  );
}
