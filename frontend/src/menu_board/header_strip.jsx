/*
  File: header_strip.jsx
  Description: Header component for the menu board.
  Displays the list of available categories and a live clock/date widget.
*/

import { useMemo, useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

// Header component displaying category chips and a live clock.
export function HeaderStrip({ categories, showClock = true, showWeather = false, currentTime }) {
  // Memoize chip names to avoid re-mapping on every second tick
  const chips = useMemo(() => categories.map((cat) => cat.name), [categories]);

  // Weather State
  const [temperature, setTemperature] = useState(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (showWeather) {
      fetch(
        "https://api.openweathermap.org/data/2.5/weather?lat=30.621703&lon=-96.340494&appid=" + import.meta.env.VITE_WEATHER_API + "&units=imperial"
      )
        .then((response) => response.json())
        .then((data) => {
          setTemperature(data.main.temp);
          setDescription(data.weather[0].description);
        })
        .catch((error) => console.error("Error fetching weather:", error));
    }
  }, [showWeather]);

  const getWeatherEmoji = (desc) => {
    if (!desc) return <Sun size={24} />;
    if (desc.includes("clear")) return <Sun size={18} />;
    if (desc.includes("cloud")) return <Cloud size={18} />;
    if (desc.includes("rain")) return <CloudRain size={18} />;
    if (desc.includes("thunder")) return <CloudLightning size={18} />;
    if (desc.includes("snow")) return <CloudSnow size={18} />;
    return <Sun size={24} />;
  };

  return (
    <header className="menu-board-header">
      <div className="menu-board-header__chips">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

      {showClock ? (
        <div className="menu-board-clock">
          {showWeather && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', fontSize: '1.2em', fontWeight: '600', letterSpacing: 'normal' }}>
              <span>{temperature ? `${Math.round(temperature)}°F` : '--'}</span>
              {getWeatherEmoji(description)}
            </div>
          )}
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