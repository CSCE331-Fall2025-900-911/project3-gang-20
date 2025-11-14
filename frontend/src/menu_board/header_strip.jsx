import { useMemo } from 'react';

export function HeaderStrip({ categories, showClock = true, showWeather = false, currentTime }) {
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
