import type { MenuCategory } from './types';
import { theme } from './theme';
import { MenuItemRow } from './menu_item_row';

interface CategorySectionProps {
  category: MenuCategory;
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section className="menu-board-column" style={{ backgroundColor: theme.colors.surface }}>
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
