/*
  File: use_menu_data.js
  Description: Custom hook for fetching and managing menu data.
  Handles polling, error states, and data transformation for the menu board.
  Includes fallback data for offline or error scenarios.
*/

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MENU_ENDPOINT = 'https://project3-gang-20.onrender.com/api/menu-items/';
const POLL_DEFAULT = 30_000;

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

// Hook to fetch and poll menu data. Handles data transformation and error states.
export function useMenuData(pollMs = POLL_DEFAULT) {
  const [data, setData] = useState(FALLBACK_DATA);
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
        fetch('https://project3-gang-20.onrender.com/api/customization-options/', { signal: controller.signal })
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
        const promos = data.promos.length ? data.promos : FALLBACK_DATA.promos;
        setData({ categories, toppings, promos, updatedAt: new Date() });
        setError(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Menu board data error:', err);
      setError('Updating menu. Please order at the kiosk.');
    } finally {
      setIsLoading(false);
    }
  }, [data.promos]);

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