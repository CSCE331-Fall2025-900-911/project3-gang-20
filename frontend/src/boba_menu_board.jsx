import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { LogOut } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = `
.menu-board-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column; /* Stack vertically */
  align-items: center;
  justify-content: flex-start; /* Align to top */
  padding: 0 2vw 24px; /* Remove top padding, keep side/bottom */
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  font-family: 'Inter', sans-serif;
  color: #78350f;
  position: relative; /* For absolute positioning of clock/logout */
}

.menu-board-frame {
  width: 96vw;
  margin-top: 110px; /* Push down to clear the floating clock */
  height: calc(100vh - 134px); /* Fill space: 100vh - (110px top + 24px bottom padding) */
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.88) 100%);
  border: 1px solid #fbd38d;
  border-radius: 32px;
  box-shadow: 0 50px 120px -60px rgba(217, 119, 6, 0.55);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* New Floating Clock Styles */
.menu-board-floating-clock {
  position: absolute;
  top: 24px;
  right: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #9a3412;
  text-align: right;
  z-index: 50;
}

.menu-board-floating-clock__time {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  font-feature-settings: "tnum";
}

.menu-board-floating-clock__date {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

.menu-board-alert {
  margin: 0 48px 16px;
  padding: 12px 20px;
  border: 1px solid #f9731644;
  border-radius: 18px;
  background: #f973161a;
  color: #b45309;
  font-size: 0.95rem;
}

.menu-board-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  padding: 32px 36px 24px; /* Added top padding since header is gone */
}

.menu-board-panels {
  width: 100%;
  display: grid;
  gap: 12px;
}

.menu-board-panels.static-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.menu-board-column {
  border: 1px solid #fbd38d;
  border-radius: 14px;
  padding: 12px 18px;
  background: #ffffff;
  box-shadow: 0 18px 28px -26px rgba(217, 119, 6, 0.4);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
  overflow: hidden;
}

.menu-board-column__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #fbd38d55;
  padding-bottom: 8px;
}

.menu-board-column__header h2 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: #b45309;
}

.menu-board-column__header span {
  font-size: 0.5rem;
  letter-spacing: 0.3em;
  color: #b4530999;
}

.menu-board-column__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
}

.menu-board-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  border-bottom: 1px solid #fbd38d33;
  padding-bottom: 4px;
}

.menu-board-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.menu-board-item h3 {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.menu-board-item p {
  margin: 2px 0 0;
  font-size: 0.58rem;
  color: #b45309cc;
  line-height: 1.15;
}

.menu-board-item.is-sold-out h3 {
  color: #b4530999;
  text-decoration: line-through;
}

.menu-board-column__badges {
  display: flex;
  gap: 4px;
  margin-top: 3px;
}

.menu-board-column__badges span {
  padding: 2px 5px;
  font-size: 0.45rem;
  letter-spacing: 0.26em;
}

.menu-board-column__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.75rem;
  gap: 2px;
}

.menu-board-column__price small {
  font-size: 0.42rem;
  letter-spacing: 0.24em;
}

.menu-board-footer {
  border-top: 1px solid #fbd38d;
  padding: 8px 36px;
  background: #fff3dc;
  box-shadow: 0 -24px 36px -36px rgba(217, 119, 6, 0.5);
}

.menu-board-ticker {
  overflow: hidden;
  text-align: center;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  color: #d97706;
}

.menu-board-ticker span {
  display: inline-block;
  animation: ticker-fade 600ms ease;
}

@keyframes ticker-fade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-board-loading {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  color: #b45309;
}
`;

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & HELPERS                             */
/* -------------------------------------------------------------------------- */

const MENU_ENDPOINT = 'https://project3-gang-20-810838872032.us-south1.run.app/api/menu-items/';
const ADDONS_ENDPOINT = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customization-options/';
const POLL_DEFAULT = 30_000;
const MAX_ITEMS_PER_PANEL = 13;

const INITIAL_STATE = {
    categories: [],
    toppings: [],
    promos: [
        { text: 'Loading menu updates...', tone: 'accent' }
    ],
    updatedAt: null,
};

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

// Ensure price is a valid number
function normalisePrice(value) {
    if (value == null) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const numeric = Number.parseFloat(value);
        return Number.isFinite(numeric) ? numeric : undefined;
    }
    return undefined;
}

// Transform flat API data into structured categories
function mapMenu(items) {
    const bucket = new Map();

    items.forEach((raw) => {
        const menu_item_id = raw.id;
        const name = raw.name?.trim();
        if (menu_item_id == null || !name) return;

        const categoryName = (raw.category?.trim() ?? 'Specialty') || 'Specialty';
        if (!bucket.has(categoryName)) {
            bucket.set(categoryName, []);
        }

        const basePrices = {};
        const price = normalisePrice(raw.base_price);
        if (typeof price === 'number') {
            basePrices.regular = price;
        }

        bucket.get(categoryName).push({
            id: menu_item_id,
            name,
            desc: undefined,
            prices: basePrices,
            badges: undefined,
            soldOut: false,
        });
    });

    return Array.from(bucket.entries())
        .map(([name, records]) => ({
            name,
            items: records.sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Format price to currency string
function formatPrice(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `$${value.toFixed(2)}`;
    }
    return '—';
}

function trimItems(items) {
    return items.slice(0, MAX_ITEMS_PER_PANEL);
}

function normaliseName(name) {
    return name.toLowerCase().replace(/[^a-z]/g, '');
}

/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

// Renders a single menu item row.
function MenuItemRow({ item }) {
    const prices = Object.values(item.prices ?? {});

    return (
        <li className={`menu-board-item${item.soldOut ? ' is-sold-out' : ''}`}>
            <div>
                <h3>{item.name}</h3>
                {item.desc ? <p>{item.desc}</p> : null}
                {item.badges?.length ? (
                    <div className="menu-board-column__badges">
                        {item.badges.map((badge) => (
                            <span key={`${item.id}-${badge}`}>{badge}</span>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="menu-board-column__price">
                {prices.length
                    ? prices.map((price, idx) => <span key={idx}>{formatPrice(price)}</span>)
                    : (
                        <span>{formatPrice(undefined)}</span>
                    )}
                {item.soldOut ? <small>Sold Out</small> : null}
            </div>
        </li>
    );
}

// Renders a category column with its items.
function CategorySection({ category }) {
    return (
        <section className="menu-board-column" style={{ backgroundColor: '#FFFFFF' }}>
            <header className="menu-board-column__header">
                <h2>{category.name}</h2>
                <span>{category.items.length} {category.items.length === 1 ? 'item' : 'items'}</span>
            </header>
            <ul className="menu-board-column__list">
                {category.items.map((item) => (
                    <MenuItemRow key={item.id} item={item} />
                ))}
            </ul>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*                                 DATA HOOK                                  */
/* -------------------------------------------------------------------------- */

function useMenuData(pollMs = POLL_DEFAULT) {
    const [data, setData] = useState(INITIAL_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const controllerRef = useRef(null);

    const fetchData = useCallback(async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const [menuResponse, addonsResponse] = await Promise.all([
                fetch(MENU_ENDPOINT, { signal: controller.signal }),
                fetch(ADDONS_ENDPOINT, { signal: controller.signal })
            ]);

            if (!menuResponse.ok || !addonsResponse.ok) {
                throw new Error(`Request failed`);
            }

            const menuPayload = await menuResponse.json();
            const addonsPayload = await addonsResponse.json();

            const categories = mapMenu(menuPayload);

            // Filter for toppings from addons
            const toppings = addonsPayload
                .filter(addon => addon.category === 'Toppings')
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    prices: { regular: parseFloat(t.price) }
                }));

            if (categories.length) {
                // Successful data fetch
                setData({
                    categories,
                    toppings,
                    promos: [
                        { text: 'Add house pearls +$0.75', tone: 'accent' },
                        { text: 'Customize sweetness & ice at the kiosk', tone: 'success' },
                        { text: 'Limited batch daily', tone: 'warning' },
                    ],
                    updatedAt: new Date()
                });
                setError(null);
                setIsLoading(false); // Only stop loading on success
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }
            console.error('Menu board data error:', err);
            // Do NOT turn off loading state on error, per user request.
            setError('Connecting to server...');
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, pollMs || POLL_DEFAULT);

        return () => {
            clearInterval(interval);
            controllerRef.current?.abort();
        };
    }, [fetchData, pollMs]);

    return useMemo(
        () => ({
            data,
            isLoading,
            error,
        }),
        [data, isLoading, error]
    );
}

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function BobaMenuBoard({ pollMs, onBack }) {
    const { data, isLoading, error } = useMenuData(pollMs);
    const categories = data.categories;
    const promos = data.promos;

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
        <>
            {/* Inject CSS */}
            <style>{styles}</style>

            <div className="menu-board-root">
                {onBack && (
                    <button
                        onClick={handleLogout}
                        style={{
                            position: 'fixed', // Changed to fixed to match Kiosk
                            top: '24px',
                            left: '24px',
                            backgroundColor: '#dc2626', // theme.danger
                            color: 'white',
                            borderRadius: '12px',
                            padding: '16px 24px', // Increased padding to match Kiosk
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // theme.shadow
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px', // Increased gap to match Kiosk
                            zIndex: 1000, // Kept high z-index
                            fontSize: '1.1em', // Matched font size
                            fontWeight: 'bold'
                        }}
                    >
                        <LogOut size={24} />
                        Exit
                    </button>
                )}
                <div className="menu-board-floating-clock">
                    <time className="menu-board-floating-clock__time">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                    <span className="menu-board-floating-clock__date">
                        {now.toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>

                <div className="menu-board-frame">
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
        </>
    );
}
