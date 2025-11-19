/**
 * Formats a numeric price into a currency string (e.g., $5.95).
 * Returns a dash '—' if the price is not a valid number.
 *
 * @param {number|*} value - The price value to format.
 * @returns {string} The formatted price string.
 */
function formatPrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `$${value.toFixed(2)}`;
  }
  return '—';
}

/**
 * Renders a single row for a menu item within a category list.
 * It displays the item's name, description, badges, prices, and sold-out status.
 *
 * @param {object} props - Component properties.
 * @param {object} props.item - The menu item data.
 * @param {string} props.item.id - Unique identifier for the item.
 * @param {string} props.item.name - Display name of the item.
 * @param {string} [props.item.desc] - Optional description.
 * @param {Array<string>} [props.item.badges] - Optional list of badges (e.g., "New", "Limited").
 * @param {object} [props.item.prices] - An object of prices (e.g., { regular: 5.95, large: 6.95 }).
 * @param {boolean} [props.item.soldOut] - Whether the item is sold out.
 */
export function MenuItemRow({ item }) {
  // Get all price values from the prices object
  const prices = Object.values(item.prices ?? {});
  
  return (
    <li className={`menu-board-item${item.soldOut ? ' is-sold-out' : ''}`}>
      {/* Left side: Name, Description, Badges */}
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
      
      {/* Right side: Prices and Sold Out status */}
      <div className="menu-board-column__price">
        {prices.length
          ? prices.map((price, idx) => <span key={idx}>{formatPrice(price)}</span>)
          : (
            // Display a dash if no prices are defined
            <span>{formatPrice(undefined)}</span>
            )}
        {item.soldOut ? <small>Sold Out</small> : null}
      </div>
    </li>
  );
}