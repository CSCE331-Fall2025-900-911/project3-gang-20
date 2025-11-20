// Format price to currency string
function formatPrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `$${value.toFixed(2)}`;
  }
  return '—';
}

/**
 * Renders a single menu item row.
 */
export function MenuItemRow({ item }) {
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