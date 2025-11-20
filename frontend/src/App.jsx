import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser, useSignIn, useSignUp } from '@clerk/clerk-react';
import BobaKiosk from './boba_kiosk';
import BobaManager from './boba_manager';
import BobaCashier from './boba_cashier';
import MenuBoardApp from './menu_board/menu_board_app';

// Custom Sign In Component
function CustomSignIn({ onSuccess, onSwitchToSignUp }) {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onSuccess?.();
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
      <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">Sign In</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-900 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToSignUp}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );
}

// Custom Sign Up Component
function CustomSignUp({ onSuccess, onSwitchToSignIn }) {
  const { signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) return;
    setError('');
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onSuccess?.();
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">Verify Email</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <p className="text-amber-700 mb-4 text-center">
          We sent a verification code to {email}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
      <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">Sign Up</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-900 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToSignIn}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}

/**
 * The main application component.
 * Renders the home/navigation screen or one of the selected portals.
 * @returns {React.ReactNode} The rendered component based on the current page state.
 */
function App() {
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
    return <BobaKiosk onBack={() => setCurrentPage('home')} />;
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
            <div className="mt-4 text-sm text-amber-600 font-semibold">
              🔒 Authentication Required
            </div>
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