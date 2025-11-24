import { useState, useEffect } from 'react';

import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { CustomSignIn, CustomSignUp } from './Auth';
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
  // State to manage which portal is currently active. 'home' is the default.
  const [currentPage, setCurrentPage] = useState('home');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const { user, isLoaded } = useUser();

  // Protected Manager Page - requires authentication and manager org membership
  if (currentPage === 'manager') {
    return (
      <>
        <SignedOut>
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
            {authMode === 'signin' ? (
              <CustomSignIn
                onSuccess={() => {}}
                onSwitchToSignUp={() => setAuthMode('signup')}
              />
            ) : (
              <CustomSignUp
                onSuccess={() => {}}
                onSwitchToSignIn={() => setAuthMode('signin')}
              />
            )}
          </div>
        </SignedOut>
        <SignedIn>
          {!isLoaded ? (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center">
              <div className="text-2xl text-amber-900">Loading...</div>
            </div>
          ) : (
            (() => {
              // Check if user is in the "manager" organization
              const isInManagerOrg = user?.organizationMemberships?.some(
                (membership) => membership.organization.name === 'manager'
              );

              if (!isInManagerOrg) {
                return (
                  <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
                    <div className="bg-white rounded-2xl p-12 shadow-2xl max-w-md text-center">
                      <div className="text-6xl mb-6">🚫</div>
                      <h2 className="text-3xl font-bold text-amber-900 mb-4">
                        Access Denied
                      </h2>
                      <p className="text-lg text-amber-700 mb-6">
                        You must be a manager to access this page.
                      </p>
                      <button
                        onClick={() => setCurrentPage('home')}
                        className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                      >
                        Back to Home
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="relative">
                  <div className="absolute top-4 right-4 z-50">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                  <BobaManager onBack={() => setCurrentPage('home')} />
                </div>
              );
            })()
          )}
        </SignedIn>
      </>
    );
  }

  if (currentPage === 'kiosk') {
    return <BobaKiosk onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'manager') {
    return <BobaManager onBack={() => setCurrentPage('landing')} />;
  }

  // Protected Cashier Page - requires authentication and cashier or manager org membership
  if (currentPage === 'cashier') {
    return (
      <>
        <SignedOut>
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
            {authMode === 'signin' ? (
              <CustomSignIn
                onSuccess={() => {}}
                onSwitchToSignUp={() => setAuthMode('signup')}
              />
            ) : (
              <CustomSignUp
                onSuccess={() => {}}
                onSwitchToSignIn={() => setAuthMode('signin')}
              />
            )}
          </div>
        </SignedOut>
        <SignedIn>
          {!isLoaded ? (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center">
              <div className="text-2xl text-amber-900">Loading...</div>
            </div>
          ) : (
            (() => {
              // Check if user is in the "cashier" or "manager" organization
              const isInCashierOrg = user?.organizationMemberships?.some(
                (membership) => membership.organization.name === 'cashier' || membership.organization.name === 'manager'
              );

              if (!isInCashierOrg) {
                return (
                  <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
                    <div className="bg-white rounded-2xl p-12 shadow-2xl max-w-md text-center">
                      <div className="text-6xl mb-6">🚫</div>
                      <h2 className="text-3xl font-bold text-amber-900 mb-4">
                        Access Denied
                      </h2>
                      <p className="text-lg text-amber-700 mb-6">
                        You must be an employee to access this page.
                      </p>
                      <button
                        onClick={() => setCurrentPage('home')}
                        className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                      >
                        Back to Home
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="relative">
                  <div className="absolute top-4 right-4 z-50">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                  <BobaCashier onBack={() => setCurrentPage('home')} />
                </div>
              );
            })()
          )}
        </SignedIn>
      </>
    );
    return <BobaCashier onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'menu-board') {
    return <MenuBoardApp onBack={() => setCurrentPage('landing')} />;
  }

  return <LandingPage onNavigate={setCurrentPage} />;
    return <MenuBoardApp onBack={() => setCurrentPage('home')} />;
  }

  // --- Home Screen Rendering ---
  // This is the default view, rendered when `currentPage` is 'home'.
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
      <SignedIn>
        <div className="absolute top-4 right-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
      
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-amber-900 mb-4">
            🧋 Monkey Business
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
