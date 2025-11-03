import { useState } from 'react';
import './App.css';
import IngredientsList from './IngredientsList'; // <-- Imports component
import MenuItemsList from './MenuItemsList';     // <-- Imports component

function App() {
  // This state tracks which "page" is active
  const [page, setPage] = useState('ingredients');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Restaurant POS System</h1>
      </header>
      
      {/* --- NAVIGATION TABS --- */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${page === 'ingredients' ? 'active' : ''}`}
          onClick={() => setPage('ingredients')}
        >
          Ingredients
        </button>
        <button 
          className={`nav-tab ${page === 'menu-items' ? 'active' : ''}`}
          onClick={() => setPage('menu-items')}
        >
          Menu Items
        </button>
      </nav>

      {/* --- CONDITIONAL CONTENT --- */}
      <main>
        {/* Shows the correct component based on the 'page' state */}
        {page === 'ingredients' && <IngredientsList />}
        {page === 'menu-items' && <MenuItemsList />}
      </main>
    </div>
  );
}

export default App;

