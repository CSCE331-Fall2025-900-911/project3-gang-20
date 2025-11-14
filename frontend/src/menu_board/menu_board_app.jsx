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

const PLACEHOLDER_CATEGORIES = {
  Freshbrew: {
    name: 'Freshbrew',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `fresh-${idx}`,
      name: `Single-Origin Brew #${idx + 1}`,
      desc: idx % 2 === 0 ? 'Slow-dripped over ice' : 'Pour-over, served hot',
      prices: { regular: 4.95 + idx * 0.1 },
    })),
  },
  Fruity: {
    name: 'Fruity',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `fruit-${idx}`,
      name: `Fruit Tea ${idx + 1}`,
      desc: idx % 2 === 0 ? 'Refreshing tea with real fruit' : 'Sparkling fruit infusion',
      prices: { regular: 5.75 + idx * 0.1 },
    })),
  },
  'Ice-Blended': {
    name: 'Ice-Blended',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `blend-${idx}`,
      name: `Ice-Blended Treat ${idx + 1}`,
      desc: idx % 2 === 0 ? 'Creamy blended drink' : 'Frosty smoothie',
      prices: { regular: 6.25 + idx * 0.1 },
    })),
  },
  Matcha: {
    name: 'Matcha',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `matcha-${idx}`,
      name: `Matcha Creation ${idx + 1}`,
      desc: idx % 2 === 0 ? 'Ceremonial grade matcha' : 'Matcha with house cream',
      prices: { regular: 6.45 + idx * 0.12 },
    })),
  },
  Milky: {
    name: 'Milky',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `milky-${idx}`,
      name: `Milky Favorite ${idx + 1}`,
      desc: idx % 2 === 0 ? 'Traditional milk tea' : 'Creamy latte style',
      prices: { regular: 5.95 + idx * 0.1 },
    })),
  },
  'Non-Caffeinated': {
    name: 'Non-Caffeinated',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `noncaf-${idx}`,
      name: `Caffeine-Free Sip ${idx + 1}`,
      desc: idx % 2 === 0 ? 'Herbal infusion' : 'Kid-friendly smoothie',
      prices: { regular: 5.45 + idx * 0.1 },
    })),
  },
  Seasonal: {
    name: 'Seasonal',
    items: Array.from({ length: MAX_ITEMS_PER_PANEL }).map((_, idx) => ({
      id: `seasonal-${idx}`,
      name: `Seasonal Feature ${idx + 1}`,
      desc: idx % 2 === 0 ? 'Limited batch flavor' : 'Chef-curated special',
      prices: { regular: 6.75 + idx * 0.15 },
      badges: idx % 3 === 0 ? ['Limited'] : undefined,
    })),
  },
};

const TOPPINGS_PANEL = {
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

function trimItems(items) {
  return items.slice(0, MAX_ITEMS_PER_PANEL);
}

function normaliseName(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

export default function MenuBoardApp({
  pollMs,
  showClock = true,
  showWeather = false,
  onBack,
}) {
  const { data, isLoading, error } = useMenuData(pollMs);

  const categories = data.categories.length ? data.categories : FALLBACK_DATA.categories;
  const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;

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
      return match ?? PLACEHOLDER_CATEGORIES[displayName];
    });

    resolved.push(TOPPINGS_PANEL);
    return resolved;
  }, [categories]);

  const [now, setNow] = useState(() => new Date());
  const [promoIndex, setPromoIndex] = useState(0);

  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };

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
      {onBack && (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000 }}
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
