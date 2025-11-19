import { useMemo } from 'react';

/**
 * Renders the header bar for the menu board.
 * This includes a dynamic list of category "chips" and an optional live clock.
 *
 * @param {object} props - Component properties.
 * @param {Array<object>} props.categories - The array of category panels to display as chips.
 * @param {boolean} [props.showClock=true] - Whether to display the clock.
 * @param {boolean} [props.showWeather=false] - Whether to display weather (prop passed but not used).
 * @param {Date} props.currentTime - The current time, passed from the parent state.
 */
export function HeaderStrip({ categories, showClock = true, showWeather = false, currentTime }) {
  /**
   * Memoizes the list of category names (chips).
   * This prevents the array from being recalculated on every render
   * (e.g., when `currentTime` updates every second).
   */
  const chips = useMemo(() => categories.map((cat) => cat.name), [categories]);

  return (
    <header className="menu-board-header">
      <div className="menu-board-header__chips">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

      {/* Conditionally render the clock */}
      {showClock ? (
        <div className="menu-board-clock">
          <span className="menu-board-clock__date">
            {currentTime.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <time className="menu-board-clock__time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
      ) : null}
    </header>
  );
}