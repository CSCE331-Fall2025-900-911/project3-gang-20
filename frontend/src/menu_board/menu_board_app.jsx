import './menu-board.css';
import { useEffect, useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { CategorySection } from './category_section';
import { HeaderStrip } from './header_strip';
import { useMenuData, FALLBACK_DATA } from './use_menu_data';

const MAX_ITEMS_PER_PANEL = 13;

const DISPLAY_ORDER = [
  'Freshbrew',
  'Fruity',
  'Ice-Blended',
  'Matcha',
  'Milky',
  'Non-Caffeinated',
  'Seasonal',
];

const NAME_SYNONYMS = {
  Freshbrew: ['freshbrew', 'freshbrewed', 'freshbrewcoffee', 'coffee'],
  Fruity: ['fruity', 'fruittea'],
  'Ice-Blended': ['iceblended', 'iceblend', 'blended', 'iceblendedsmoothie'],
  Matcha: ['matcha'],
  Milky: ['milky', 'milktea', 'signaturemilktea'],
  'Non-Caffeinated': ['noncaffeinated', 'noncaffeniated', 'herbal', 'kids'],
  Seasonal: ['seasonal', 'limited', 'specials'],
};

// Truncate items to fit the panel
function trimItems(items) {
  return items.slice(0, MAX_ITEMS_PER_PANEL);
}

// Normalize category names for consistent lookup
function normaliseName(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Main Menu Board Application Component.
 * Orchestrates data fetching and layout rendering.
 */
export default function MenuBoardApp({
  pollMs,
  showClock = true,
  showWeather = false,
  onBack,
}) {
  const { data, isLoading, error } = useMenuData(pollMs);

  const categories = data.categories.length ? data.categories : FALLBACK_DATA.categories;
  const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;

  // Construct the display panels based on fetched data and display order
  const panels = useMemo(() => {
    const categoryMap = new Map();

    categories.forEach((category) => {
      const trimmed = {
        ...category,
        items: trimItems(category.items),
      };
      categoryMap.set(normaliseName(category.name), trimmed);
    });

    const resolved = DISPLAY_ORDER.map((displayName) => {
      const variants = NAME_SYNONYMS[displayName] || [displayName.toLowerCase()];
      let match;
      for (const variant of variants) {
        match = categoryMap.get(normaliseName(variant));
        if (match) break;
      }
      return match ?? null;
    }).filter(Boolean);

    if (data.toppings && data.toppings.length > 0) {
      resolved.push({
        name: 'Toppings',
        items: data.toppings
      });
    }
    return resolved;
  }, [categories, data.toppings]);

  const [now, setNow] = useState(() => new Date());
  const [promoIndex, setPromoIndex] = useState(0);

  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  // Cycle through promos
  useEffect(() => {
    if (!promos.length) return undefined;
    const ticker = setInterval(() => setPromoIndex((prev) => (prev + 1) % promos.length), 7_000);
    return () => clearInterval(ticker);
  }, [promos.length]);

  return (
    <div className="menu-board-root">
      {onBack && (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
          style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1000 }}
        >
          <LogOut size={20} />
          Logout
        </button>
      )}
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