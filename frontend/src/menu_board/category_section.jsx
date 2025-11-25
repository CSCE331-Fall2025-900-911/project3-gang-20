/*
  File: category_section.jsx
  Description: Renders a specific category column on the menu board.
  Displays the category title and a list of menu items within that category.
*/

import { MenuItemRow } from './menu_item_row';

// Renders a category column with its items.
export function CategorySection({ category }) {
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