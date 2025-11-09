import './menu-board.css';
import { useEffect, useMemo, useState } from 'react';
import { CategorySection } from './CategorySection';
import { HeaderStrip } from './HeaderStrip';
import { useMenuData, FALLBACK_DATA } from './useMenuData';
import type { MenuBoardAppProps, MenuCategory, MenuItem } from './types';

const MAX_ITEMS_PER_PANEL = 13;
const STATIC_PANEL_COUNT = 8;

const TOPPINGS_PANEL: MenuCategory = {
  name: 'Toppings',
  items: [
    { id: 't1', name: 'Classic Boba', prices: { regular: 0.75 } },
    { id: 't2', name: 'Mini Boba', prices: { regular: 0.75 } },
    { id: 't3', name: 'Crystal Boba', prices: { regular: 0.75 } },
    { id: 't4', name: 'Lychee Jelly', prices: { regular: 0.75 } },
    { id: 't5', name: 'Rainbow Jelly', prices: { regular: 0.75 } },
    { id: 't6', name: 'Grass Jelly', prices: { regular: 0.75 } },
    { id: 't7', name: 'Herbal Jelly', prices: { regular: 0.75 } },
    { id: 't8', name: 'Egg Pudding', prices: { regular: 0.75 } },
    { id: 't9', name: 'Cheese Foam', prices: { regular: 0.95 } },
    { id: 't10', name: 'Sea Salt Cream', prices: { regular: 0.95 } },
    { id: 't11', name: 'Whipped Cream', prices: { regular: 0.75 } },
    { id: 't12', name: 'Red Bean', prices: { regular: 0.75 } },
    { id: 't13', name: 'Chia Seeds', prices: { regular: 0.5 } },
  ],
};

function trimItems(items: MenuItem[]): MenuItem[] {
  return items.slice(0, MAX_ITEMS_PER_PANEL);
}

export default function MenuBoardApp({
  pollMs,
  showClock = true,
  showWeather = false,
}: MenuBoardAppProps) {
  const { data, isLoading, error } = useMenuData(pollMs);

  const categories = data.categories.length ? data.categories : FALLBACK_DATA.categories;
  const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;

  const panels = useMemo(() => {
    const base = categories.map((category) => ({
      ...category,
      items: trimItems(category.items),
    }));

    const filled: MenuCategory[] = [];
    let index = 0;

    while (filled.length < 7) {
      const source = base[index] ?? FALLBACK_DATA.categories[index % FALLBACK_DATA.categories.length];
      filled.push({
        ...source,
        items: trimItems(source.items),
      });
      index += 1;
    }

    filled.push(TOPPINGS_PANEL);
    return filled.slice(0, STATIC_PANEL_COUNT);
  }, [categories]);

  const [now, setNow] = useState(() => new Date());
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!promos.length) return undefined;
    const ticker = setInterval(() => setPromoIndex((prev) => (prev + 1) % promos.length), 7_000);
    return () => clearInterval(ticker);
  }, [promos.length]);

  return (
    <div className="menu-board-root">
      <div className="menu-board-frame">
        <HeaderStrip categories={panels} showClock={showClock} showWeather={showWeather} currentTime={now} />

        {error ? <div className="menu-board-alert">{error}</div> : null}

        <div className="menu-board-body">
          {isLoading ? (
            <div className="menu-board-loading">Loading menu…</div>
          ) : (
            <div className="menu-board-panels static-grid">
              {panels.map((category) => (
                <CategorySection key={category.name} category={{ ...category, items: trimItems(category.items) }} />
              ))}
            </div>
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
