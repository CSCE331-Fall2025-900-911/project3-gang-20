/*
  File: App.jsx
  Description: Main application component that handles routing and portal access control.
  Manages the state of the current view (Kiosk, Manager, Cashier, Menu Board) and enforces
  authentication requirements for restricted areas using Clerk.
*/

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import MenuBoardApp from './menu_board/menu_board_app';
import LandingPage from './landing_page';

/*
  Wrapper component to enforce organization membership for portal access.
  Checks if the signed-in user belongs to any of the required organizations.
*/
const PortalAccessChecker = ({ children, requiredGroups, unauthorizedMessage, onBack }) => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2em' }}>Loading...</h1>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fed7aa', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2em', color: '#78350f', marginBottom: '1em' }}>🔒 Access Denied</h1>
        <p style={{ fontSize: '1.2em', color: '#92400e', marginBottom: '2em' }}>
          You must be signed in to access this employee portal.
        </p>
        <button
          onClick={onBack}
          style={{ padding: '10px 20px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Back
        </button>
      </div>
    );
  }

  const hasRequiredRole = requiredGroups.some(requiredOrgName =>
    user.organizationMemberships?.some(
      (membership) => membership.organization.name === requiredOrgName
    )
  );

  if (!hasRequiredRole) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fed7aa', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2em', color: '#dc2626', marginBottom: '1em' }}>🛑 Unauthorized</h1>
        <p style={{ fontSize: '1.2em', color: '#92400e', marginBottom: '2em', fontWeight: 'bold' }}>
          {unauthorizedMessage}
        </p>
        <button
          onClick={onBack}
          style={{ padding: '10px 20px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Go Back
        </button>
      </div>
    );
  }


  return children;
};

// Main

// Main application component. Handles initial loading state and routing.
function App() {
  // --- STATE MANAGEMENT: Session Storage ---
  // 1. Lazy Initialization: This runs ONCE when the app starts.
  //    If it's a refresh, it pulls from session.
  //    If it's a new tab/window, session is empty, so it defaults to 'landing'.
  const [currentPage, setCurrentPage] = useState(() => {
    return sessionStorage.getItem('currentPage') || 'landing';
  });

  // 2. Save to Session Storage whenever currentPage changes.
  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // --- AUDIO UNLOCK (Your existing code) ---
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume();
      } catch (e) {}
  
      const u = new SpeechSynthesisUtterance(".");
      u.volume = 0.01; 
      speechSynthesis.speak(u);
  
      console.log("🔓 Audio unlocked");
      window.removeEventListener("click", unlockAudio);
    };
  
    window.addEventListener("click", unlockAudio);
  }, []);

  // ---------- Portal Routing ----------

  // Kiosk (Public/Customer View)
  if (currentPage === 'kiosk') {
    return <BobaKiosk onBack={() => setCurrentPage('landing')} />;
  }

  // Manager Portal (Restricted)
  if (currentPage === 'manager') {
    return (
      <PortalAccessChecker
        requiredGroups={['manager']} // Now checks for membership in the 'manager' organization
        unauthorizedMessage="Must be a Manager to access this portal."
        onBack={() => setCurrentPage('landing')}
      >
        <BobaManager onBack={() => setCurrentPage('landing')} />
      </PortalAccessChecker>
    );
  }

  // Cashier Portal (Restricted)
  if (currentPage === 'cashier') {
    return (
      <PortalAccessChecker
        requiredGroups={['cashier', 'manager']} // Now checks for membership in 'cashier' OR 'manager' organization
        unauthorizedMessage="Must be an Employee (Cashier or Manager) to access this portal."
        onBack={() => setCurrentPage('landing')}
      >
        <BobaCashier onBack={() => setCurrentPage('landing')} />
      </PortalAccessChecker>
    );
  }

  // Menu Board (Public View)
  if (currentPage === 'menu_board') {
    return <MenuBoardApp onBack={() => setCurrentPage('landing')} />;
  }

  // Landing Page (Default View)
  return <LandingPage onNavigate={setCurrentPage} />;
}

export default App;