import { MenuItemRow } from './menu_item_row';

/**
 * Renders a single category panel (column) on the menu board.
 * It displays the category header and a list of all items in that category.
 *
 * @param {object} props - Component properties.
 * @param {object} props.category - The category object to render.
 * @param {string} props.category.name - The display name of the category.
 * @param {Array<object>} props.category.items - The list of menu items in this category.
 */
export function CategorySection({ category }) {
  return (
    <section className="menu-board-column" style={{ backgroundColor: '#FFFFFF' }}>
      <header className="menu-board-column__header">
        <h2>{category.name}</h2>
        {/* Display the total number of items in this category */}
        <span>{category.items.length} {category.items.length === 1 ? 'item' : 'items'}</span>
      </header>
      <ul className="menu-board-column__list">
        {/* Map over the items and render a row for each one */}
        {category.items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}