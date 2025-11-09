import './menu-board.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategorySection } from './CategorySection';
import { HeaderStrip } from './HeaderStrip';
import { buildSegments } from './layout';
import { useMenuData, FALLBACK_DATA } from './useMenuData';
import type { MenuBoardAppProps, MenuCategory } from './types';

const SEGMENT_SIZE = 15;
const MAX_COLUMNS = 3;
const COLUMN_CYCLE_MS = 5_000;
const PROMO_DURATION_MS = 7_000;

function SkeletonColumn() {
  return (
    <section className="menu-board-column skeleton-shimmer">
      <header className="menu-board-column__header">
        <div>
          <div className="skeleton-block" style={{ width: '160px', height: '24px' }} />
          <div className="skeleton-block" style={{ width: '120px', height: '12px', marginTop: '6px' }} />
        </div>
        <div className="skeleton-block" style={{ width: '60px', height: '12px' }} />
      </header>
      <ul className="menu-board-column__list">
        {Array.from({ length: 6 }).map((_, idx) => (
          <li key={idx} className="menu-board-item">
            <div>
              <div className="skeleton-block" style={{ width: '200px', height: '20px' }} />
              <div className="skeleton-block" style={{ width: '160px', height: '14px', marginTop: '6px' }} />
            </div>
            <div className="menu-board-column__price">
              <div className="skeleton-block" style={{ width: '50px', height: '18px' }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkeletonBoard() {
  return (
    <div className="menu-board-panels count-3">
      <SkeletonColumn />
      <SkeletonColumn />
      <SkeletonColumn />
    </div>
  );
}

export default function MenuBoardApp({
  pageDurationMs = COLUMN_CYCLE_MS,
  pollMs,
  showClock = true,
  showWeather = false,
}: MenuBoardAppProps) {
  const { data, isLoading, error } = useMenuData(pollMs);

  const categories = data.categories.length ? data.categories : FALLBACK_DATA.categories;
  const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;

  const segments = useMemo(() => buildSegments(categories, SEGMENT_SIZE), [categories]);
  const columnCount = segments.length ? Math.min(MAX_COLUMNS, segments.length) : segments.length;

  const [now, setNow] = useState(() => new Date());
  const [promoIndex, setPromoIndex] = useState(0);
  const [columns, setColumns] = useState<MenuCategory[]>([]);
  const [animatedColumn, setAnimatedColumn] = useState<number | null>(null);

  const slotIndexRef = useRef(0);
  const nextIndexRef = useRef(0);
  const currentIndicesRef = useRef<number[]>([]);
const prevSegmentsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!promos.length) return undefined;
    const ticker = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promos.length);
    }, PROMO_DURATION_MS);
    return () => clearInterval(ticker);
  }, [promos.length]);

const segmentsKey = useMemo(
  () => segments.map((segment) => `${segment.name}-${segment.partIndex ?? 0}`).join('|'),
  [segments]
);

  useEffect(() => {
    if (!segments.length) {
      setColumns([]);
      currentIndicesRef.current = [];
      slotIndexRef.current = 0;
      nextIndexRef.current = 0;
    prevSegmentsKeyRef.current = null;
      return;
    }

  if (prevSegmentsKeyRef.current === segmentsKey && columns.length) {
    return;
  }

  prevSegmentsKeyRef.current = segmentsKey;

    const visibleCount = columnCount || 1;
    const initialIndices = Array.from({ length: visibleCount }, (_, idx) => idx % segments.length);

    setColumns(initialIndices.map((index) => segments[index]));
    currentIndicesRef.current = initialIndices;
    slotIndexRef.current = 0;
    nextIndexRef.current = segments.length > visibleCount ? visibleCount % segments.length : 0;
}, [segments, columnCount, segmentsKey, columns.length]);

  useEffect(() => {
    if (!segments.length || !columnCount) return undefined;

    const interval = setInterval(() => {
      const visible = columnCount || 1;
      if (!visible) return;

      const current = currentIndicesRef.current;
      if (!current.length) return;

      const slot = slotIndexRef.current % visible;
      const nextIdx = nextIndexRef.current % segments.length;

      if (segments.length <= visible && current[slot] === nextIdx) {
        slotIndexRef.current = (slot + 1) % visible;
        nextIndexRef.current = (nextIdx + 1) % segments.length;
        return;
      }

      const updated = [...current];
      updated[slot] = nextIdx;
      currentIndicesRef.current = updated;
      setColumns(updated.map((index) => segments[index]));
      setAnimatedColumn(slot);
      slotIndexRef.current = (slot + 1) % visible;
      nextIndexRef.current = (nextIdx + 1) % segments.length;
    }, pageDurationMs);

    return () => clearInterval(interval);
  }, [segments, columnCount, pageDurationMs]);

  useEffect(() => {
    if (animatedColumn === null) return undefined;
    const timeout = setTimeout(() => setAnimatedColumn(null), 320);
    return () => clearTimeout(timeout);
  }, [animatedColumn]);

  return (
    <div className="menu-board-root">
      <div className="menu-board-frame">
        <HeaderStrip categories={categories} showClock={showClock} showWeather={showWeather} currentTime={now} />

        {error ? <div className="menu-board-alert">{error}</div> : null}

        <div className="menu-board-body">
          {isLoading && !columns.length ? (
            <SkeletonBoard />
          ) : columns.length ? (
            <div className={`menu-board-panels count-${columns.length || 1}`}>
              {columns.map((category, idx) => (
                <AnimatePresence key={`slot-${idx}`} initial={false} mode="wait">
                  <motion.div
                    key={`${category.uid ?? category.name}-${category.partIndex ?? 0}`}
                    initial={animatedColumn === idx ? { x: 30, opacity: 0 } : { x: 0, opacity: 1 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
                  >
                    <CategorySection category={category} />
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>
          ) : (
            <SkeletonBoard />
          )}
        </div>

        <footer className="menu-board-footer">
          <div className="menu-board-ticker">
            <span>{promos[promoIndex % promos.length].text ?? promos[promoIndex % promos.length]}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
