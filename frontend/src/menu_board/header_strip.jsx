/*
  File: header_strip.jsx
  Description: Header component for the menu board.
  Displays the list of available categories and a live clock/date widget.
*/

import { useMemo } from 'react';

// Header component displaying category chips and a live clock.
export function HeaderStrip({ categories, showClock = true, showWeather = false, currentTime }) {
  // Memoize chip names to avoid re-mapping on every second tick
  const chips = useMemo(() => categories.map((cat) => cat.name), [categories]);

  return (
    <header className="menu-board-header">
      <div className="menu-board-header__chips">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

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