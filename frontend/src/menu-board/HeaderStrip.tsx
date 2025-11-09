import { useMemo } from 'react';
import type { MenuCategory } from './types';
import { theme } from './theme';

interface HeaderStripProps {
  categories: MenuCategory[];
  showClock?: boolean;
  showWeather?: boolean;
  currentTime: Date;
}

export function HeaderStrip({ categories, showClock = true, showWeather = false, currentTime }: HeaderStripProps) {
  const chips = useMemo(() => categories.map((cat) => cat.name), [categories]);

  return (
    <header className="menu-board-header">
      <div className="menu-board-brand">
        <div className="menu-board-logo">🧋</div>
        <div>
          <p>Monkey Business Tea House</p>
          <h1>Signature Menu Boards</h1>
          {chips.length ? (
            <div className="menu-board-header__chips">
              {chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {showClock ? (
        <div className="menu-board-clock">
          <time>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          <span>
            {currentTime.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      ) : null}
    </header>
  );
}
