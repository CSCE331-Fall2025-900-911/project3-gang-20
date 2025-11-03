import { useState, useEffect } from 'react';
import './App.css'; // Shares the main CSS

// The API endpoint for menu items
const API_URL = 'https://project3-gang-20.onrender.com/api/menu-items/'; //'http://127.0.0.1:8000/api/menu-items/';

function MenuItemsList() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetches data when the component first loads
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setMenuItems(data); // Stores the data in state
        setError(null);
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError(err.message);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []); // The empty array [] means this effect runs once on mount

  return (
    <div className="content-area">
      <h2>Menu Item List</h2>
      
      {loading && <div className="loading-message">Loading data from Django...</div>}
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <ul className="data-list">
          {menuItems.map(item => (
            <li key={item.menu_item_id} className="data-item">
              <span className="item-name">{item.name}</span>
              <span className="item-detail">
                ${item.price} ({item.category})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MenuItemsList;

