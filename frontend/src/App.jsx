import { useState } from 'react';
import BobaKiosk from './BobaKiosk';
import BobaManager from './BobaManager';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  if (currentPage === 'kiosk') {
    return <BobaKiosk />;
  }

  if (currentPage === 'manager') {
    return <BobaManager />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-amber-900 mb-4">
            🧋 Boba Restaurant
          </h1>
          <p className="text-2xl text-amber-700">
            Select Your Portal
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
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
        </div>
      </div>
    </div>
  );
}

export default App;