/*
  File: Auth.jsx
  Description: Shared authentication components (Sign In / Sign Up).
  Includes custom logic for:
  1. Phone Number requirement & validation.
  2. Automatic syncing of new users to your backend Database (PostgreSQL/API).
  3. "Amber" styling to match your brand (now theme-aware).
  4. Google OAuth integration.
*/

import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { Phone, Mail, Lock, User as UserIcon, X } from 'lucide-react';
import { useAccessibility } from './AccessibilityContext';

// --- Configuration ---
const CUSTOMERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customers/';

// --- Helpers ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
const validatePhone = (phone) => phone.replace(/\D/g, '').length === 10;

// --- Assets (Google Logo) ---
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// --- Shared UI Components ---
const InputField = ({ icon: Icon, error, ...props }) => {
    const { theme, highContrast } = useAccessibility();

    return (
        <div style={{ position: 'relative', marginBottom: error ? '8px' : '16px' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: highContrast ? theme.text : theme.primary }}>
                <Icon size={20} />
            </div>
            <input
                {...props}
                style={{
                    width: '100%', padding: '12px 16px 12px 48px', borderRadius: highContrast ? '0' : '12px',
                    border: error ? `2px solid ${theme.danger}` : (highContrast ? theme.border : `2px solid #fed7aa`),
                    fontSize: '1rem', outline: 'none',
                    backgroundColor: highContrast ? '#ffffff' : '#fffbeb',
                    color: highContrast ? '#000000' : '#78350f'
                }}
                onFocus={(e) => !error && (e.target.style.borderColor = theme.primary)}
                onBlur={(e) => !error && (e.target.style.borderColor = highContrast ? (theme.border === 'none' ? 'black' : theme.border) : '#fed7aa')}
            />
            {error && <div style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '4px', marginLeft: '4px' }}>{error}</div>}
        </div>
    );
};

const AuthButton = ({ children, onClick, isLoading }) => {
    const { theme, highContrast } = useAccessibility();

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            style={{
                width: '100%', padding: '14px', borderRadius: highContrast ? '0' : '12px',
                border: highContrast ? theme.border : 'none',
                backgroundColor: theme.primary, color: theme.primaryText,
                fontSize: '1.1rem', fontWeight: 'bold',
                cursor: isLoading ? 'wait' : 'pointer', marginTop: '8px', opacity: isLoading ? 0.7 : 1,
                transition: 'background-color 0.2s',
                boxShadow: theme.shadow
            }}
        >
            {isLoading ? 'Processing...' : children}
        </button>
    );
};

const GoogleButton = ({ onClick, text }) => {
    const { theme, highContrast } = useAccessibility();

    return (
        <button
            onClick={onClick}
            type="button"
            style={{
                width: '100%', padding: '12px', borderRadius: highContrast ? '0' : '12px',
                border: highContrast ? theme.border : '2px solid #fed7aa',
                backgroundColor: theme.cardBg,
                color: theme.text, fontSize: '1rem', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', marginBottom: '20px', transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => !highContrast && (e.currentTarget.style.backgroundColor = '#fffbeb')}
            onMouseOut={(e) => !highContrast && (e.currentTarget.style.backgroundColor = theme.cardBg)}
        >
            <GoogleIcon />
            {text}
        </button>
    );
};

const Divider = () => {
    const { theme } = useAccessibility();
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.textSecondary, opacity: 0.3 }}></div>
            <span style={{ color: theme.textSecondary, fontSize: '0.9rem', fontWeight: '500' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.textSecondary, opacity: 0.3 }}></div>
        </div>
    );
};

// --- Shared Sign In Component ---
export function CustomSignIn({ onSuccess, onClose }) {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { theme, highContrast } = useAccessibility();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/"
            });
        } catch (err) {
            setError("Google Sign In failed");
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true); setError(null);

        try {
            const result = await signIn.create({ identifier: email, password });
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            setError(err.errors?.[0]?.longMessage || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '32px',
            background: theme.cardBg,
            borderRadius: highContrast ? '0' : '24px',
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            border: theme.border,
            boxShadow: theme.shadow
        }}>
            {onClose && (
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: theme.text }}>
                    <X size={24} />
                </button>
            )}
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.text, marginBottom: '24px', textAlign: 'center' }}>Welcome Back</h2>

            <GoogleButton onClick={handleGoogleSignIn} text="Sign in with Google" />
            <Divider />

            <form onSubmit={handleSignIn}>
                <InputField type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} required />
                <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} required />
                {error && <p style={{ color: theme.danger, marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
                <AuthButton isLoading={loading} onClick={handleSignIn}>Log In</AuthButton>
            </form>
        </div>
    );
}

// --- Shared Sign Up Component (Includes DB Sync) ---
export function CustomSignUp({ onSuccess, onClose }) {
    const { signUp, setActive, isLoaded } = useSignUp();
    const { theme, highContrast } = useAccessibility();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleGoogleSignUp = async () => {
        if (!isLoaded) return;
        try {
            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/"
            });
        } catch (err) {
            setFieldErrors({ general: "Google Sign Up failed" });
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true); setFieldErrors({});

        // 1. Validate
        const errors = {};
        if (!firstName.trim()) errors.firstName = "Required";
        if (!lastName.trim()) errors.lastName = "Required";
        if (!validateEmail(email)) errors.email = "Invalid email";
        if (!validatePhone(phone)) errors.phone = "Invalid phone (10 digits)";
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors); setLoading(false); return;
        }

        try {
            // 2. Create Clerk User
            const result = await signUp.create({ firstName, lastName, emailAddress: email, password });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });

                // 3. Create Backend DB Record
                try {
                    await fetch(CUSTOMERS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            first_name: firstName,
                            last_name: lastName,
                            email: email.toLowerCase().trim(),
                            phone: phone.replace(/\D/g, ''),
                            joined_date: new Date().toISOString().split('T')[0]
                        })
                    });
                } catch (dbError) {
                    console.error("DB Sync Error:", dbError);
                }
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            setFieldErrors({ general: err.errors?.[0]?.longMessage || "Sign up failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '32px',
            background: theme.cardBg,
            borderRadius: highContrast ? '0' : '24px',
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            border: theme.border,
            boxShadow: theme.shadow
        }}>
            {onClose && (
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: theme.text }}>
                    <X size={24} />
                </button>
            )}
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.text, marginBottom: '24px', textAlign: 'center' }}>Create Account</h2>

            <GoogleButton onClick={handleGoogleSignUp} text="Sign up with Google" />
            <Divider />

            <form onSubmit={handleSignUp}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <InputField type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} icon={UserIcon} error={fieldErrors.firstName} />
                    <InputField type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} icon={UserIcon} error={fieldErrors.lastName} />
                </div>
                <InputField type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} error={fieldErrors.email} />
                <InputField type="tel" placeholder="Phone (10 digits)" value={phone} onChange={(e) => setPhone(e.target.value)} icon={Phone} maxLength="14" error={fieldErrors.phone} />
                <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} required />
                {fieldErrors.general && <p style={{ color: theme.danger, marginBottom: '16px', textAlign: 'center' }}>{fieldErrors.general}</p>}
                <AuthButton isLoading={loading} onClick={handleSignUp}>Sign Up</AuthButton>
            </form>
        </div>
    );
}