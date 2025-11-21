import { useState, useEffect } from 'react';

import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import MenuBoardApp from './menu_board/menu_board_app';
import LandingPage from './landing_page';

function App() {
  const [currentPage, setCurrentPage] = useState(null); // <-- start as null
  const [isLoaded, setIsLoaded] = useState(false); // <-- gate rendering

  // Load saved page on first mount
  useEffect(() => {
    const saved = localStorage.getItem('currentPage');

    if (saved) {
      setCurrentPage(saved);
    } else {
      setCurrentPage('landing'); // default
    }

    setIsLoaded(true); // allow rendering
  }, []);

  // Save currentPage whenever it changes (but only after load)
  useEffect(() => {
    if (currentPage) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage]);

  // ---------- Prevent rendering until state is ready ----------
  if (!isLoaded) {
    return null; // or a loading spinner
  }

  // ---------- Portal Routing ----------
  if (currentPage === 'kiosk') {
    return <BobaKiosk onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'manager') {
    return <BobaManager onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'cashier') {
    return <BobaCashier onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'menu-board') {
    return <MenuBoardApp onBack={() => setCurrentPage('landing')} />;
  }

  return <LandingPage onNavigate={setCurrentPage} />;
}

export default App;
