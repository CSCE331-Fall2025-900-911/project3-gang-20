export interface MenuItemPriceMap {
  regular?: number;
  large?: number;
  [size: string]: number | undefined;
}

export interface MenuItem {
  id: number | string;
  name: string;
  desc?: string;
  prices: MenuItemPriceMap;
  badges?: string[];
  soldOut?: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
  uid?: string;
  partIndex?: number;
  partTotal?: number;
}

export interface PromoMessage {
  text: string;
  tone?: 'accent' | 'success' | 'warning';
}

export interface MenuBoardData {
  categories: MenuCategory[];
  promos: PromoMessage[];
  updatedAt: Date | null;
}

export interface MenuBoardAppProps {
  displayIndex?: number;
  displayCount?: number;
  pageDurationMs?: number;
  pollMs?: number;
  showWeather?: boolean;
  showClock?: boolean;
}
