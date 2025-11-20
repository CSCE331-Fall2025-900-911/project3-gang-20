import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** The API endpoint to fetch menu items from. */
const MENU_ENDPOINT = 'https://project3-gang-20.onrender.com/api/menu-items/';

/** The default polling interval (in ms) if not specified. */
const POLL_DEFAULT = 30_000;

/**
 * Fallback data structure used for initial state or if the API
 * returns empty content. This ensures the board isn't empty on first load.
 */
export const FALLBACK_DATA = {
  categories: [
    {
      name: 'Signature Milk Tea',
      items: [
        {
          id: 0,
          name: 'Classic Pearl Milk Tea',
          desc: 'Assam black tea, brown sugar pearls, whole milk',
          prices: { regular: 5.8, large: 6.5 },
          badges: ['Best Seller'],
        },
        {
          id: 1,
          name: 'Tiger Boba Latte',
          desc: 'Slow-steeped tea, brûléed sugar drizzle',
          prices: { regular: 6.5, large: 7.25 },
        },
        {
          id: 2,
          name: 'Brown Sugar Oat',
          desc: 'Non-dairy oat milk, house pearls',
          prices: { regular: 6.2, large: 6.95 },
          badges: ['Dairy Free'],
        },
      ],
    },
    {
      name: 'Cold Brew & Fruit',
      items: [
        {
          id: 3,
          name: 'Mango Jasmine Spritz',
          desc: 'Sparkling jasmine tea, mango nectar, basil seeds',
          prices: { regular: 5.75, large: 6.55 },
          badges: ['Seasonal'],
        },
        {
          id: 4,
          name: 'Strawberry Lychee Fizz',
          desc: 'House strawberry jam, lychee jelly, mint',
          prices: { regular: 5.95, large: 6.75 },
        },
        {
          id: 5,
          name: 'Yuzu Cold Brew',
          desc: 'Single-origin cold brew, yuzu peel syrup',
          prices: { regular: 6.25, large: 6.95 },
        },
      ],
    },
    {
      name: 'Blended & Treats',
      items: [
        {
          id: 6,
          name: 'Matcha Cloud',
          desc: 'Ceremonial matcha, vanilla cold foam',
          prices: { regular: 6.75, large: 7.25 },
        },
        {
          id: 7,
          name: 'Ube Soft-Serve Float',
          desc: 'Ube shake, coconut jelly, whipped crema',
          prices: { regular: 6.95, large: 7.65 },
          badges: ['New'],
        },
        {
          id: 8,
          name: 'Cookie Crumble Frappe',
          desc: 'Chocolate cookie crumble, sea salt cream',
          prices: { regular: 6.8, large: 7.4 },
        },
      ],
    },
  ],
  promos: [
    { text: 'Add house pearls +$0.75', tone: 'accent' },
    { text: 'Customize sweetness & ice at the kiosk', tone: 'success' },
    { text: 'New: Yuzu Cold Brew · Limited batch daily', tone: 'warning' },
  ],
  updatedAt: null,
};

/**
 * Normalizes a price value from the API.
 * Ensures the price is a valid number, parsing strings if necessary.
 *
 * @param {*} value - The raw price value (string, number, null).
 * @returns {number | undefined} The numeric price or undefined.
 */
function normalisePrice(value) {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

/**
 * Transforms the raw flat array of menu items from the API into a
 * structured array of categories, with items bucketed and sorted.
 *
 * @param {Array<object>} items - The raw item array from the API response.
 * @returns {Array<object>} A structured array of category objects.
 */
function mapMenu(items) {
  const bucket = new Map();

  items.forEach((raw) => {
    const menu_item_id = raw.id;
    const name = raw.name?.trim();
    if (menu_item_id == null || !name) return; // Skip invalid items

    // Use 'Specialty' as a fallback category name
    const categoryName = (raw.category?.trim() ?? 'Specialty') || 'Specialty';
    if (!bucket.has(categoryName)) {
      bucket.set(categoryName, []);
    }

    // Normalize price data
    const basePrices = {};
    const price = normalisePrice(raw.base_price);
    if (typeof price === 'number') {
      basePrices.regular = price;
    }

    // Add the structured item to its category bucket
    bucket.get(categoryName).push({
      id: menu_item_id,
      name,
      desc: undefined, // Description removed from backend
      prices: basePrices,
      badges: undefined, // Featured status removed from backend
      soldOut: false, // Availability status removed from backend
    });
  });

  // Convert the map into the final sorted array structure
  return Array.from(bucket.entries())
    .map(([name, records]) => ({
      name,
      // Sort items alphabetically within each category
      items: records.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    // Sort categories alphabetically
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Custom React hook to fetch, manage, and poll menu data.
 *
 * @param {number} [pollMs=POLL_DEFAULT] - The interval (in ms) to poll the API.
 * @returns {{data: object, isLoading: boolean, error: string|null}}
 * An object containing the menu data, loading state, and error message.
 */
export function useMenuData(pollMs = POLL_DEFAULT) {
  const [data, setData] = useState(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null); // To manage aborting fetch requests

  /**
   * Fetches and processes menu data from the API.
   * This function is wrapped in useCallback to stabilize it for use in useEffect.
   */
  const fetchData = useCallback(async () => {
    // Abort any pending fetch request to prevent race conditions
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const [menuResponse, addonsResponse] = await Promise.all([
        fetch(MENU_ENDPOINT, { signal: controller.signal }),
        fetch('https://project3-gang-20.onrender.com/api/customization-options/', { signal: controller.signal })
      ]);

      if (!menuResponse.ok || !addonsResponse.ok) {
        throw new Error(`Request failed`);
      }

      const menuPayload = await menuResponse.json();
      const addonsPayload = await addonsResponse.json();

      const categories = mapMenu(menuPayload);

      // Filter for toppings
      const toppings = addonsPayload
        .filter(addon => addon.category === 'Toppings')
        .map(t => ({
          id: t.id,
          name: t.name,
          prices: { regular: parseFloat(t.price) }
        }));

      if (categories.length) {
        // Preserve existing promos if new data is fetched
        const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;
        setData({ categories, toppings, promos, updatedAt: new Date() });
        setError(null);
      }
    } catch (err) {
      // Ignore abort errors, as they are intentional
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Menu board data error:', err);
      setError('Updating menu. Please order at the kiosk.');
    } finally {
      setIsLoading(false);
    }
  }, [data.promos]); // Dependency on data.promos to preserve them across fetches

  // Effect to fetch data on mount and set up the polling interval
  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, pollMs || POLL_DEFAULT);

    // Cleanup function
    return () => {
      clearInterval(interval);
      controllerRef.current?.abort(); // Abort on unmount
    };
  }, [fetchData, pollMs]);

  /**
   * Memoizes the returned state object.
   * This ensures that components consuming this hook do not re-render
   * unnecessarily if the state object is regenerated but its contents are identical.
   */
  return useMemo(
    () => ({
      data,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );
}