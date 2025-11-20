import './menu-board.css';
import { useEffect, useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { CategorySection } from './category_section';
import { HeaderStrip } from './header_strip';
import { useMenuData, FALLBACK_DATA } from './use_menu_data';

/** The maximum number of items to display in a single category panel before truncating. */
const MAX_ITEMS_PER_PANEL = 13;

/**
 * Defines the static display order of categories on the menu board.
 * This ensures "Freshbrew" always appears before "Fruity", regardless of API order.
 */
const DISPLAY_ORDER = [
  'Freshbrew',
  'Fruity',
  'Ice-Blended',
  'Matcha',
  'Milky',
  'Non-Caffeinated',
  'Seasonal',
];

/**
 * A mapping to normalize variant category names from the API to a standard display name.
 * This allows "milky", "milktea", etc., to all be grouped under the "Milky" panel.
 */
const NAME_SYNONYMS = {
  Freshbrew: ['freshbrew', 'freshbrewed', 'freshbrewcoffee', 'coffee'],
  Fruity: ['fruity', 'fruittea'],
  'Ice-Blended': ['iceblended', 'iceblend', 'blended', 'iceblendedsmoothie'],
  Matcha: ['matcha'],
  Milky: ['milky', 'milktea', 'signaturemilktea'],
  'Non-Caffeinated': ['noncaffeinated', 'noncaffeniated', 'herbal', 'kids'],
  Seasonal: ['seasonal', 'limited', 'specials'],
};


/** Utility function to truncate an item list based on MAX_ITEMS_PER_PANEL. */
function trimItems(items) {
  return items.slice(0, MAX_ITEMS_PER_PANEL);
}

/** Utility function to normalize a string for map lookups (lowercase, no symbols). */
function normaliseName(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * The main application component for the Menu Board.
 *
 * This component orchestrates data fetching, state management (clock, promo ticker),
 * and renders the complete menu board layout, including the header, category panels,
 * and footer.
 *
 * @param {object} props - Component properties.
 * @param {number} props.pollMs - The interval (in ms) to poll the API for updates.
 * @param {boolean} [props.showClock=true] - Whether to display the clock in the header.
 * @param {boolean} [props.showWeather=false] - Whether to display weather (prop passed but not used).
 * @param {function} props.onBack - A callback function to trigger a "back" or "logout" action.
 */
export default function MenuBoardApp({
  pollMs,
  showClock = true,
  showWeather = false,
  onBack,
}) {
  // Fetch menu data using the custom hook
  const { data, isLoading, error } = useMenuData(pollMs);

  // Use fetched data, but fall back to a default structure if the API returns empty arrays
  const categories = data.categories.length ? data.categories : FALLBACK_DATA.categories;
  const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;

  /**
   * Memoized logic to build the final array of panels to be displayed.
   * This logic maps API categories to the fixed DISPLAY_ORDER,
   * normalizes names using NAME_SYNONYMS, and inserts
   * PLACEHOLDER_CATEGORIES for any missing data to maintain the layout.
   */
  const panels = useMemo(() => {
    const categoryMap = new Map();

    // 1. Create a map of all available categories from the API for fast lookup
    categories.forEach((category) => {
      const trimmed = {
        ...category,
        items: trimItems(category.items),
      };
      categoryMap.set(normaliseName(category.name), trimmed);
    });

    // 2. Build the display panels based on the static DISPLAY_ORDER
    const resolved = DISPLAY_ORDER.map((displayName) => {
      const variants = NAME_SYNONYMS[displayName] || [displayName.toLowerCase()];
      let match;
      // Check all synonyms for a matching category in the map
      for (const variant of variants) {
        match = categoryMap.get(normaliseName(variant));
        if (match) break;
      }
      // Return the match if found, otherwise null (will be filtered out)
      return match ?? null;
    }).filter(Boolean); // Filter out nulls (categories not found in API)

    // 3. Append the Toppings panel (dynamic or fallback)
    if (data.toppings && data.toppings.length > 0) {
      resolved.push({
        name: 'Toppings',
        items: data.toppings
      });
    }
    return resolved;
  }, [categories, data.toppings]); // Re-run if categories or toppings change

  // State for the live clock
  const [now, setNow] = useState(() => new Date());
  // State for the cycling promo ticker
  const [promoIndex, setPromoIndex] = useState(0);

  /**
   * Handles the click event for the "Logout" button.
   */
  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };

  // Effect to update the clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  // Effect to cycle through promos on the ticker
  useEffect(() => {
    if (!promos.length) return undefined;
    const ticker = setInterval(() => setPromoIndex((prev) => (prev + 1) % promos.length), 7_000);
    return () => clearInterval(ticker);
  }, [promos.length]);

  return (
    <div className="menu-board-root">
      {/* Conditionally render a logout button if onBack is provided */}
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

        {/* Display an error message if data fetching fails */}
        {error ? <div className="menu-board-alert">{error}</div> : null}

        <div className="menu-board-body">
          {isLoading ? (
            <div className="menu-board-loading">Loading menu…</div>
          ) : (
            // Render the grid of category panels
            <div className="menu-board-panels static-grid">
              {panels.map((category) => (
                <CategorySection key={category.name} category={{ ...category, items: trimItems(category.items) }} />
              ))}
            </div>
          )}
        </div>

        <footer className="menu-board-footer">
          <div className="menu-board-ticker">
            {/* Display the currently active promo message */}
            <span>{promos[promoIndex % promos.length].text ?? promos[promoIndex % promos.length]}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}