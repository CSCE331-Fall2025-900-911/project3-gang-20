import type { MenuCategory } from './types';

const DEFAULT_SINGLE_SEGMENT_SIZE = 15;
const MULTI_SEGMENT_SIZE = 8;
const MAX_PER_DISPLAY = 3;

export interface SegmentedCategory extends MenuCategory {
  uid: string;
  partIndex: number;
  partTotal: number;
}

function segmentCategory(category: MenuCategory, size: number): SegmentedCategory[] {
  const totalParts = Math.ceil(category.items.length / size) || 1;
  return Array.from({ length: totalParts }, (_, part) => {
    const items = category.items.slice(part * size, (part + 1) * size);
    if (!items.length) return null;
    return {
      ...category,
      items,
      uid: `${category.name}::${part + 1}`,
      partIndex: part + 1,
      partTotal: totalParts,
    } as SegmentedCategory;
  }).filter(Boolean) as SegmentedCategory[];
}

export function buildSegments(categories: MenuCategory[], size = DEFAULT_SINGLE_SEGMENT_SIZE): SegmentedCategory[] {
  return categories.flatMap((category) => segmentCategory(category, size));
}

function buildSingleDisplayPages(categories: MenuCategory[]): LayoutPage[] {
  const segments = buildSegments(categories, DEFAULT_SINGLE_SEGMENT_SIZE);
  if (!segments.length) return [];
  if (segments.length === 1) return [{ displays: [[segments[0]]] }];

  const pages: LayoutPage[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    const next = segments[(i + 1) % segments.length];
    pages.push({ displays: [[segments[i], next]] });
  }
  return pages;
}

function chunk<T>(input: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    result.push(input.slice(i, i + size));
  }
  return result;
}

export interface LayoutPage {
  displays: MenuCategory[][];
}

export function buildPages(categories: MenuCategory[], displayCount: number): LayoutPage[] {
  if (displayCount <= 1) {
    return buildSingleDisplayPages(categories);
  }

  const expanded = buildSegments(categories, MULTI_SEGMENT_SIZE);
  const columnsPerPage = MAX_PER_DISPLAY * Math.max(1, displayCount);
  const pageChunks = chunk(expanded, columnsPerPage);

  return pageChunks.map((chunked) => {
    const perDisplay = chunk(chunked, MAX_PER_DISPLAY);
    while (perDisplay.length < displayCount) {
      perDisplay.push([]);
    }
    return { displays: perDisplay.slice(0, displayCount) };
  });
}
