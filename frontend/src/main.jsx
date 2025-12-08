/*
  File: main.jsx
  Description: Entry point for the React application.
  Initializes the root component, wraps it with StrictMode and ClerkProvider for authentication.
*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      afterSignOutUrl="/"
      continueSignUpUrl="/"
    >
      <HashRouter>
        <App />
      </HashRouter>
    </ClerkProvider>
  </StrictMode>,
)