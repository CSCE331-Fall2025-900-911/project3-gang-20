/*
  File: App.jsx
  Description: Main application component that handles routing and portal access control.
  Manages the state of the current view (Kiosk, Manager, Cashier, Menu Board) and enforces
  authentication requirements for restricted areas using Clerk.
*/

import { useState, useEffect } from 'react';
import { useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import BobaMenuBoard from './boba_menu_board';
import LandingPage from './landing_page';
import BobaAccount from './boba_account';

/*
  Wrapper component to enforce organization membership for portal access.
*/
const PortalAccessChecker = ({ children, requiredGroups, unauthorizedMessage, onBack }) => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div style={{ padding: '50px', textAlign: 'center' }}><h1>Loading...</h1></div>;
  }

  if (!isSignedIn) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fed7aa', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2em', color: '#78350f', marginBottom: '1em' }}>🔒 Access Denied</h1>
        <p style={{ fontSize: '1.2em', color: '#92400e', marginBottom: '2em' }}>You must be signed in to access this employee portal.</p>
        <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
      </div>
    );
  }

  const hasRequiredRole = requiredGroups.some(requiredOrgName =>
    user.organizationMemberships?.some((membership) => membership.organization.name === requiredOrgName)
  );

  if (!hasRequiredRole) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fed7aa', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2em', color: '#dc2626', marginBottom: '1em' }}>🛑 Unauthorized</h1>
        <p style={{ fontSize: '1.2em', color: '#92400e', marginBottom: '2em', fontWeight: 'bold' }}>{unauthorizedMessage}</p>
        <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Go Back</button>
      </div>
    );
  }

  return children;
};

// Main application component. Handles initial loading state and routing.
function App() {
  // Handle Clerk SSO callback (must be before other routing)
  if (window.location.pathname === '/sso-callback') {
    return <AuthenticateWithRedirectCallback signInForceRedirectUrl="/" signUpForceRedirectUrl="/" continueSignUpUrl="/" />;
  }

  const [currentPage, setCurrentPage] = useState(() => {
    return sessionStorage.getItem('currentPage') || 'landing';
  });

  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const unlockAudio = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume();
      } catch (e) { }

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
        requiredGroups={['manager']}
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
        requiredGroups={['cashier', 'manager']}
        unauthorizedMessage="Must be an Employee (Cashier or Manager) to access this portal."
        onBack={() => setCurrentPage('landing')}
      >
        <BobaCashier onBack={() => setCurrentPage('landing')} />
      </PortalAccessChecker>
    );
  }

  // Menu Board (Public View)
  if (currentPage === 'menu_board') {
    return <BobaMenuBoard onBack={() => setCurrentPage('landing')} />;
  }

  // --- ADD THIS SECTION HERE ---
  // Account Page (Private Customer View)
  if (currentPage === 'account') {
    return <BobaAccount onNavigate={setCurrentPage} />;
  }
  // -----------------------------

  // Landing Page (Default View)
  return <LandingPage onNavigate={setCurrentPage} />;
}

export default App;