import { useState } from 'react';
// Import the different portal components
import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import MenuBoardApp from './menu_board/menu_board_app';

/**
 * The main application component.
 * Renders the home/navigation screen or one of the selected portals.
 * @returns {React.ReactNode} The rendered component based on the current page state.
 */
function App() {
  // State to manage which portal is currently active. 'home' is the default.
  const [currentPage, setCurrentPage] = useState('home');

  // --- Portal Rendering ---
  // Conditionally render the active portal based on the `currentPage` state.
  // Each portal is passed an `onBack` prop to allow it to return to the 'home' screen.

  if (currentPage === 'kiosk') {
    return <BobaKiosk onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'manager') {
    return <BobaManager onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'cashier') {
    return <BobaCashier onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'menu-board') {
    return <MenuBoardApp onBack={() => setCurrentPage('home')} />;
  }

  // --- Home Screen Rendering ---
  // This is the default view, rendered when `currentPage` is 'home'.
  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-amber-900 mb-4">
            🧋 Boba Restaurant
          </h1>
          <p className="text-2xl text-amber-700">
            Select Your Portal
          </p>
        </div>

        {/* Grid of navigation buttons for each portal */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Kiosk Button */}
          <button
            onClick={() => setCurrentPage('kiosk')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500"
          >
            <div className="text-7xl mb-6">🥤</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Customer Kiosk
            </h2>
            <p className="text-lg text-amber-700">
              Self-service ordering for customers
            </p>
          </button>

          {/* Manager Button */}
          <button
            onClick={() => setCurrentPage('manager')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500"
          >
            <div className="text-7xl mb-6">⚙️</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Manager Dashboard
            </h2>
            <p className="text-lg text-amber-700">
              Manage menu, inventory & orders
            </p>
          </button>

          {/* Cashier Button */}
          <button
            onClick={() => setCurrentPage('cashier')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500"
          >
            <div className="text-7xl mb-6">💳</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Cashier Dashboard
            </h2>
            <p className="text-lg text-amber-700">
              Take orders for customers
            </p>
          </button>

          {/* Menu Board Button */}
          <button
            onClick={() => setCurrentPage('menu-board')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500 md:col-span-2 lg:col-span-1"
          >
            <div className="text-7xl mb-6">🖥️</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Menu Board
            </h2>
            <p className="text-lg text-amber-700">
              Large-format digital signage
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;