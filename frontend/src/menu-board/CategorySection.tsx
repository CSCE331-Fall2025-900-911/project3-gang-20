import type { MenuCategory } from './types';
import { theme } from './theme';
import { MenuItemRow } from './MenuItemRow';

interface CategorySectionProps {
  category: MenuCategory;
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section className="menu-board-column" style={{ backgroundColor: theme.colors.surface }}>
      <header className="menu-board-column__header">
        <div>
          <h2>{category.name}</h2>
          {category.partTotal && category.partTotal > 1 ? (
            <p>
              Part {category.partIndex} of {category.partTotal}
            </p>
          ) : null}
        </div>
        <span>
          {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
        </span>
      </header>
      <ul className="menu-board-column__list">
        {category.items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
