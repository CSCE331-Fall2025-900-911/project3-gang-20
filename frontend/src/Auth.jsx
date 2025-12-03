/*
  File: Auth.jsx
  Description: Shared authentication components (Sign In / Sign Up).
  Includes custom logic for:
  1. Phone Number requirement & validation.
  2. Automatic syncing of new users to your backend Database (PostgreSQL/API).
  3. "Amber" styling to match your brand.
*/

import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { Phone, Mail, Lock, User as UserIcon, X } from 'lucide-react';

// --- Configuration ---
const CUSTOMERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customers/';

// --- Helpers ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
const validatePhone = (phone) => phone.replace(/\D/g, '').length === 10;

// --- Shared UI Components ---
const InputField = ({ icon: Icon, error, ...props }) => (
    <div style={{ position: 'relative', marginBottom: error ? '8px' : '16px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }}>
            <Icon size={20} />
        </div>
        <input
            {...props}
            style={{
                width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px',
                border: error ? '2px solid #dc2626' : '2px solid #fed7aa',
                fontSize: '1rem', outline: 'none', backgroundColor: '#fffbeb', color: '#78350f'
            }}
            onFocus={(e) => !error && (e.target.style.borderColor = '#d97706')}
            onBlur={(e) => !error && (e.target.style.borderColor = '#fed7aa')}
        />
        {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', marginLeft: '4px' }}>{error}</div>}
    </div>
);

const AuthButton = ({ children, onClick, isLoading }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            backgroundColor: '#d97706', color: 'white', fontSize: '1.1rem', fontWeight: 'bold',
            cursor: isLoading ? 'wait' : 'pointer', marginTop: '8px', opacity: isLoading ? 0.7 : 1
        }}
    >
        {isLoading ? 'Processing...' : children}
    </button>
);

// --- Shared Sign In Component ---
export function CustomSignIn({ onSuccess, onClose }) {
    const { signIn, setActive, isLoaded } = useSignIn();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true); setError(null);

        try {
            const result = await signIn.create({ identifier: email, password });
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                if(onSuccess) onSuccess();
            }
        } catch (err) {
            setError(err.errors?.[0]?.longMessage || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            {onClose && (
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#78350f' }}>
                    <X size={24} />
                </button>
            )}
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f', marginBottom: '24px', textAlign: 'center' }}>Welcome Back</h2>
            <form onSubmit={handleSignIn}>
                <InputField type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} required />
                <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} required />
                {error && <p style={{ color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
                <AuthButton isLoading={loading} onClick={handleSignIn}>Log In</AuthButton>
            </form>
        </div>
    );
}

// --- Shared Sign Up Component (Includes DB Sync) ---
export function CustomSignUp({ onSuccess, onClose }) {
    const { signUp, setActive, isLoaded } = useSignUp();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
                if(onSuccess) onSuccess();
            }
        } catch (err) {
            setFieldErrors({ general: err.errors?.[0]?.longMessage || "Sign up failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            {onClose && (
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#78350f' }}>
                    <X size={24} />
                </button>
            )}
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f', marginBottom: '24px', textAlign: 'center' }}>Create Account</h2>
            <form onSubmit={handleSignUp}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <InputField type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} icon={UserIcon} error={fieldErrors.firstName} />
                    <InputField type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} icon={UserIcon} error={fieldErrors.lastName} />
                </div>
                <InputField type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} error={fieldErrors.email} />
                <InputField type="tel" placeholder="Phone (10 digits)" value={phone} onChange={(e) => setPhone(e.target.value)} icon={Phone} maxLength="14" error={fieldErrors.phone} />
                <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} required />
                {fieldErrors.general && <p style={{ color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>{fieldErrors.general}</p>}
                <AuthButton isLoading={loading} onClick={handleSignUp}>Sign Up</AuthButton>
            </form>
        </div>
    );
}