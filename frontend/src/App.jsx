import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react'; 

import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import MenuBoardApp from './menu_board/menu_board_app';
import LandingPage from './landing_page';

/**
 * A wrapper component to enforce organization membership for portal access.
 * The 'requiredGroups' prop now expects an array of required Organization Names.
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

  // Kiosk (Public/Customer View) - No Clerk check needed here, login is optional and handled inside BobaKiosk
  if (currentPage === 'kiosk') {
    return <BobaKiosk onBack={() => setCurrentPage('landing')} />;
  }

  // Manager Portal (Restricted) - Must be a 'manager'
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

  // Cashier Portal (Restricted) - Must be a 'cashier' OR 'manager'
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