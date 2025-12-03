/*
  File: landing_page.jsx
  Description: The landing page component serving as the main entry point for users.
  Provides navigation to different portals (Kiosk, Menu, Manager, Cashier) and handles
  user authentication (Login/Signup) via Clerk.
*/

import { useState, useEffect } from 'react';
import { Coffee, User, LogIn, ChevronRight, LogOut, Phone, Mail, Lock, User as UserIcon, X } from 'lucide-react';
import { useUser, useClerk, useSignIn, useSignUp } from '@clerk/clerk-react';

// --- Configuration ---
// The API endpoint for our backend customer table. 
// We use this to store permanent records of users alongside their Clerk auth data.
const CUSTOMERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customers/';

// --- Styled Shared Components ---
// Reusable components to ensure the Login/Signup forms match the specific "Amber/Orange" theme of the landing page.

const InputField = ({ icon: Icon, ...props }) => (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
        {/* Input Icon Positioned Absolute */}
        <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#d97706' // Amber-600
        }}>
            <Icon size={20} />
        </div>
        {/* Actual Input Element */}
        <input
            {...props}
            style={{
                width: '100%',
                padding: '12px 16px 12px 48px', // Left padding accounts for the icon
                borderRadius: '12px',
                border: '2px solid #fed7aa', // Light orange border
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#fffbeb', // Very light amber bg
                color: '#78350f'
            }}
            // Highlight border on focus
            onFocus={(e) => e.target.style.borderColor = '#d97706'}
            onBlur={(e) => e.target.style.borderColor = '#fed7aa'}
        />
    </div>
);

const AuthButton = ({ children, onClick, isLoading }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#d97706',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: isLoading ? 'wait' : 'pointer',
            marginTop: '8px',
            boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)',
            transition: 'transform 0.1s',
            opacity: isLoading ? 0.7 : 1
        }}
        // Click animation effect
        onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
        onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
    >
        {isLoading ? 'Processing...' : children}
    </button>
);

// --- Custom Auth Components ---

/*
  CustomSignIn:
  Handles logging in existing users using Clerk.
  Includes an "X" button to close the modal.
*/
function CustomSignIn({ onSuccess, onClose }) {
    const { signIn, setActive, isLoaded } = useSignIn();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        try {
            // Attempt to sign in with Clerk
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === "complete") {
                // Set the session active (this logs the user in on the frontend)
                await setActive({ session: result.createdSessionId });
                onSuccess(); // Close modal on success
            } else {
                console.log(result);
            }
        } catch (err) {
            console.error("error", err.errors[0].longMessage);
            setError(err.errors[0].longMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
            
            {/* Close Button (X) */}
            <button 
                onClick={onClose}
                aria-label="Close"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#78350f',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <X size={24} />
            </button>

            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f', marginBottom: '24px', textAlign: 'center' }}>Welcome Back</h2>
            <form onSubmit={handleSignIn}>
                <InputField type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} required />
                <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} required />
                {error && <p style={{ color: '#dc2626', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                <AuthButton isLoading={loading} onClick={handleSignIn}>Log In</AuthButton>
            </form>
        </div>
    );
}

/*
  CustomSignUp:
  Handles new user registration.
  Includes an "X" button to close the modal.
*/
function CustomSignUp({ onSuccess, onClose }) {
    const { signUp, setActive, isLoaded } = useSignUp();
    
    // Form States
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState(""); // Phone Number State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        try {
            // Step 1: Create User in Clerk (Frontend Auth)
            const result = await signUp.create({
                firstName,
                lastName,
                emailAddress: email,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });

                // Step 2: Add to Backend Database Table
                try {
                    const newCustomer = {
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone: phone, // Pass the captured phone number here
                        joined_date: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
                    };

                    await fetch(CUSTOMERS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newCustomer)
                    });
                    console.log("Customer saved to backend with phone:", phone);
                } catch (dbError) {
                    // Note: We log the error but don't stop the UI because the user is technically signed in via Clerk
                    console.error("Failed to save customer to DB:", dbError);
                }

                onSuccess(); // Close modal on success
            } else {
                console.log(result);
            }
        } catch (err) {
            console.error("error", err.errors[0].longMessage);
            setError(err.errors[0].longMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
            
            {/* Close Button (X) */}
            <button 
                onClick={onClose}
                aria-label="Close"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#78350f',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <X size={24} />
            </button>

            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f', marginBottom: '24px', textAlign: 'center' }}>Create Account</h2>
            <form onSubmit={handleSignUp}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <InputField type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} icon={UserIcon} required />
                    <InputField type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} icon={UserIcon} required />
                </div>
                <InputField type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} required />
                
                {/* Phone Number Field (Only in Sign Up) */}
                <InputField type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={Phone} required />
                
                <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} required />
                
                {error && <p style={{ color: '#dc2626', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                <AuthButton isLoading={loading} onClick={handleSignUp}>Sign Up</AuthButton>
            </form>
        </div>
    );
}

// --- Main LandingPage Component ---

function LandingPage({ onNavigate }) {
    // 'login', 'signup', or null (closed)
    const [authMode, setAuthMode] = useState(null);
    const { isSignedIn, user, isLoaded } = useUser();
    const { signOut } = useClerk();

    // Theme constants matching the app's design
    const theme = {
        primary: '#d97706',
        bg: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        text: '#78350f',
        textLight: '#92400e',
        overlay: 'rgba(120, 53, 15, 0.4)',
    };

    // --- Fallback Sync Logic ---
    // If a user logs in (via Log In button), they might not be in our DB yet.
    // This effect runs on load to check and add them if missing.
    useEffect(() => {
        const syncUserToBackend = async () => {
            if (isLoaded && isSignedIn && user) {
                try {
                    // 1. Fetch existing customers
                    const response = await fetch(CUSTOMERS_URL);
                    const customers = await response.json();
                    
                    // 2. Check if current user exists by email
                    const userEmail = user.primaryEmailAddress?.emailAddress;
                    const existingCustomer = customers.find(c => c.email === userEmail);

                    // 3. If not found, add them (Silent Sync)
                    if (!existingCustomer) {
                        const newCustomer = {
                            first_name: user.firstName || "New",
                            last_name: user.lastName || "User",
                            email: userEmail,
                            phone: "", // Note: Normal Login doesn't provide phone, so we leave it blank
                            joined_date: new Date().toISOString().split('T')[0]
                        };
                        await fetch(CUSTOMERS_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newCustomer)
                        });
                    }
                } catch (error) {
                    console.error("Error syncing user to backend:", error);
                }
            }
        };
        syncUserToBackend();
    }, [isLoaded, isSignedIn, user]);

    const handleCloseModal = () => setAuthMode(null);
    const handleModalContentClick = (e) => e.stopPropagation();

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: theme.text,
            overflowX: 'hidden',
            position: 'relative'
        }}>

            {/* --- Navigation Bar --- */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 40px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: theme.primary, padding: '8px', borderRadius: '12px', color: 'white' }}>
                        <Coffee size={24} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        Share<span style={{ color: theme.primary }}>Tea</span>
                    </span>
                </div>

                <div className="hidden md:flex" style={{ gap: '32px', fontWeight: '600', alignItems: 'center' }}>
                    <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Home</button>
                    <button onClick={() => onNavigate('menu_board')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Menu</button>
                    <button style={{ background: 'none', border: 'none', color: theme.text, cursor: 'not-allowed', opacity: 0.5, fontSize: '1rem', fontWeight: '600' }}>Our Story</button>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    {isLoaded && (
                        <>
                            {isSignedIn ? (
                                // --- Authenticated View ---
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', color: theme.text, fontWeight: '600' }}>
                                        Hello, {user?.firstName || 'User'}
                                    </div>
                                    <button
                                        onClick={() => signOut(() => onNavigate('landing'))}
                                        style={{
                                            background: 'transparent',
                                            border: `2px solid ${theme.primary}`,
                                            color: theme.primary,
                                            padding: '8px 20px',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                        <LogOut size={18} />
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                // --- Guest View ---
                                <>
                                    <button
                                        onClick={() => setAuthMode('login')}
                                        style={{
                                            background: 'transparent',
                                            border: `2px solid ${theme.primary}`,
                                            color: theme.primary,
                                            padding: '8px 20px',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}>
                                        Log In
                                    </button>
                                    <button
                                        onClick={() => setAuthMode('signup')}
                                        style={{
                                            background: theme.primary,
                                            border: 'none',
                                            color: 'white',
                                            padding: '10px 24px',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                                        }}>
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <header style={{ padding: '80px 20px', textAlign: 'center', position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{
                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                    fontWeight: '900',
                    lineHeight: '1.1',
                    marginBottom: '24px',
                    background: `linear-gradient(135deg, ${theme.text} 0%, ${theme.primary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Sip into <br /> Happiness.
                </h1>
                <p style={{ fontSize: '1.25rem', color: theme.textLight, maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6' }}>
                    Experience the perfect blend of premium tea, fresh milk, and chewy tapioca pearls. Handcrafted daily for your delight.
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => onNavigate('kiosk')} style={{ background: theme.primary, color: 'white', padding: '16px 40px', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.4)', transition: 'transform 0.2s' }}>
                        Order Now <ChevronRight size={20} />
                    </button>
                    <button onClick={() => onNavigate('menu_board')} style={{ background: 'white', color: theme.text, padding: '16px 40px', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        View Menu
                    </button>
                </div>
            </header>

            {/* --- Employee Portals --- */}
            <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '60px', color: theme.text }}>Employee Portals</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                    <div onClick={() => onNavigate('manager')} style={{ background: 'white', padding: '32px', borderRadius: '24px', cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ background: '#fff7ed', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: theme.primary }}>
                            <User size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Manager Dashboard</h3>
                        <p style={{ color: theme.textLight }}>Access inventory, staff management, and sales reports.</p>
                    </div>

                    <div onClick={() => onNavigate('cashier')} style={{ background: 'white', padding: '32px', borderRadius: '24px', cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ background: '#fff7ed', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: theme.primary }}>
                            <LogIn size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Cashier POS</h3>
                        <p style={{ color: theme.textLight }}>Handle customer orders, process payments, and manage the till.</p>
                    </div>
                </div>
            </section>

            <footer style={{ background: '#78350f', color: 'white', padding: '60px 20px 30px', borderTop: '5px solid #d97706' }}>
                <div style={{ textAlign: 'center', opacity: 0.8 }}>© 2025 ShareTea Kiosk System. All rights reserved.</div>
            </footer>

            {/* --- Auth Modal Overlay --- */}
            {(authMode === 'login' || authMode === 'signup') && (
                <div onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: theme.overlay, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease-out', backdropFilter: 'blur(4px)' }}>
                    <div onClick={handleModalContentClick} style={{ animation: 'slideUp 0.3s ease-out' }}>
                        
                        {/* Switch between Sign In and Sign Up components based on state */}
                        {authMode === 'login' ? (
                            <CustomSignIn onSuccess={handleCloseModal} onClose={handleCloseModal} />
                        ) : (
                            <CustomSignUp onSuccess={handleCloseModal} onClose={handleCloseModal} />
                        )}
                        
                        {/* Toggle Button (Login <-> Signup) */}
                        <div style={{ marginTop: '20px', textAlign: 'center', color: 'white', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            {authMode === 'login' ? "New here?" : "Already joined?"}{' '}
                            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#fed7aa', fontWeight: 'bold', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline' }}>
                                {authMode === 'login' ? 'Create Account' : 'Log In'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animation for floating elements and modal */}
            <style>{`
                @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

export default LandingPage;