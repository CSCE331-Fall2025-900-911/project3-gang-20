import { useState } from 'react';
// Import the different portal components
import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import MenuBoardApp from './menu_board/menu_board_app';
import LandingPage from './LandingPage';

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
  return <LandingPage onNavigate={setCurrentPage} />;
}

export default App;