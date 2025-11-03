import { useState, useEffect } from 'react';
import './App.css'; // Shares the main CSS

// The API endpoint for ingredients
const API_URL = 'http://127.0.0.1:8000/api/ingredients/';

function IngredientsList() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetches data when the component first loads
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setIngredients(data); // Stores the data in state
        setError(null);
      } catch (err) {
        console.error("Error fetching ingredients:", err);
        setError(err.message);
        setIngredients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []); // The empty array [] means this effect runs once on mount

  return (
    <div className="content-area">
      <h2>Ingredient List</h2>
      
      {loading && <div className="loading-message">Loading data from Django...</div>}
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <ul className="data-list">
          {ingredients.map(ingredient => (
            <li key={ingredient.ingredient_id} className="data-item">
              <span className="item-name">{ingredient.ingredient_name}</span>
              <span className="item-detail">
                Stock: {ingredient.stock_level} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default IngredientsList;

