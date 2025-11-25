/*
  File: Auth.jsx
  Description: Authentication components for the application using Clerk.
  Contains custom Sign In and Sign Up forms with error handling and session management.
*/

import { useState, useEffect } from 'react';
import { useSignIn, useSignUp, useClerk } from '@clerk/clerk-react';

// Compact Login Button Component. A small, styled button used for triggering the login modal.
export function CompactLoginButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#d97706',
        color: 'white',
        borderRadius: '8px',
        padding: '8px 16px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9em',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <span>🔓</span>
      <span>Sign In for Rewards</span>
    </button>
  );
}

// Custom Sign In Component. Handles user authentication via email and password.
export function CustomSignIn({ onSuccess, onSwitchToSignUp }) {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isLoaded || !email || !password) return;

    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Activate the session and wait for it to complete
        await setActive({ session: result.createdSessionId });

        // Wait longer to ensure Clerk provider fully updates
        await new Promise(resolve => setTimeout(resolve, 500));

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle other statuses
        console.error("Sign in status:", result.status);
        if (result.status === 'needs_identifier_verification') {
          setError("Account exists but email is not verified.");
        } else if (result.status === 'needs_second_factor') {
          setError("2FA is required for this account.");
        } else {
          setError(`Login failed. Status: ${result.status}`);
        }
      }
    } catch (err) {
      console.error(err);
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
          <label className="block text-sm font-medium text-amber-900 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-900 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
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

// Custom Sign Up Component. Handles new user registration and session activation.
export function CustomSignUp({ onSuccess, onSwitchToSignIn }) {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isLoaded) return;

    setError('');
    setLoading(true);

    try {
      const result = await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        password,
      });

      // Check if email verification is required
      if (result.status === 'complete') {
        // No verification needed - activate session immediately
        await setActive({ session: result.createdSessionId });

        // Wait longer to ensure provider fully updates
        await new Promise(resolve => setTimeout(resolve, 500));

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else if (result.status === 'missing_requirements') {
        // Email verification required - show message
        setError("Please check your email to verify your account, then sign in.");
        setTimeout(() => {
          onSwitchToSignIn?.();
        }, 3000);
      } else {
        // Other status
        console.log("Signup status:", result.status);
        setError(`Signup completed with status: ${result.status}. Please try signing in.`);
        setTimeout(() => {
          onSwitchToSignIn?.();
        }, 3000);
      }

    } catch (err) {
      console.error(err);
      const msg = err.errors?.[0]?.message || "Sign up failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
      <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">Sign Up</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-1/2">
            <input
              type="text"
              placeholder="First Name"
              className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="w-1/2">
            <input
              type="text"
              placeholder="Last Name"
              className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <input
          type="email"
          placeholder="Email Address"
          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password (min. 8 chars)"
          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToSignIn}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );
}