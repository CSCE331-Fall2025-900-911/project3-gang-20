import { useState } from 'react';
import { Coffee, User, LogIn, ChevronRight, Star, MapPin, Clock, X, LogOut } from 'lucide-react';
// Import Clerk hooks and custom auth components
import { useUser, useClerk } from '@clerk/clerk-react';
import { CustomSignIn, CustomSignUp } from './Auth';

function LandingPage({ onNavigate }) {
    // 'login', 'signup', or null
    const [authMode, setAuthMode] = useState(null);

    // Use Clerk hooks to get the user state and sign out function
    const { isSignedIn, user, isLoaded } = useUser();
    const { signOut } = useClerk();

    // Theme constants matching the app's design
    const theme = {
        primary: '#d97706', // amber-600
        primaryHover: '#b45309', // amber-700
        bg: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)', // amber-50 to orange-200
        text: '#78350f', // amber-900
        textLight: '#92400e', // amber-800
        white: '#ffffff',
        overlay: 'rgba(120, 53, 15, 0.3)', // dark amber semi-transparent
    };

    const handleCloseModal = () => setAuthMode(null);

    // Prevent click propagation from modal content to overlay
    const handleModalContentClick = (e) => e.stopPropagation();

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: theme.text,
            overflowX: 'hidden',
            position: 'relative' // Needed for overlay positioning context
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
                    <div style={{
                        background: theme.primary,
                        padding: '8px',
                        borderRadius: '12px',
                        color: 'white'
                    }}>
                        <Coffee size={24} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        Boba<span style={{ color: theme.primary }}>Spot</span>
                    </span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex" style={{ gap: '32px', fontWeight: '600', alignItems: 'center' }}>
                    <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Home</button>
                    <button onClick={() => onNavigate('menu_board')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Menu</button>
                    <button style={{ background: 'none', border: 'none', color: theme.text, cursor: 'not-allowed', opacity: 0.5, fontSize: '1rem', fontWeight: '600' }}>Our Story</button>
                </div>

                {/* Auth Buttons - Logic to display login/signup or sign-out */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Only render auth controls after Clerk is loaded */}
                    {isLoaded && (
                        <>
                            {isSignedIn ? (
                                // SIGNED IN: Show Sign Out button and optionally user's name
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', color: theme.text, fontWeight: '600' }}>
                                        Hello, {user?.firstName || 'User'}
                                    </div>
                                    <button 
                                        onClick={() => signOut(() => onNavigate('landing'))} // Sign out and navigate back to landing
                                        style={{
                                            background: 'transparent',
                                            border: `2px solid ${theme.primary}`,
                                            color: theme.primary,
                                            padding: '8px 20px',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                        <LogOut size={18} />
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                // SIGNED OUT: Show Log In and Sign Up buttons
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
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
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
                                            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
                                            transition: 'all 0.2s'
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
            <header style={{
                padding: '80px 20px',
                textAlign: 'center',
                position: 'relative',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Decorative Background Elements */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '5%',
                    fontSize: '4rem',
                    opacity: 0.2,
                    animation: 'float 6s ease-in-out infinite'
                }}>🧋</div>
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    fontSize: '5rem',
                    opacity: 0.2,
                    animation: 'float 8s ease-in-out infinite reverse'
                }}>✨</div>

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
                <p style={{
                    fontSize: '1.25rem',
                    color: theme.textLight,
                    maxWidth: '600px',
                    margin: '0 auto 48px',
                    lineHeight: '1.6'
                }}>
                    Experience the perfect blend of premium tea, fresh milk, and chewy tapioca pearls. Handcrafted daily for your delight.
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => onNavigate('kiosk')}
                        style={{
                            background: theme.primary,
                            color: 'white',
                            padding: '16px 40px',
                            borderRadius: '50px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Order Now <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={() => onNavigate('menu_board')}
                        style={{
                            background: 'white',
                            color: theme.text,
                            padding: '16px 40px',
                            borderRadius: '50px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        View Menu
                    </button>
                </div>
            </header>

            {/* --- Employee Portals (Access Links) --- */}
            <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '60px', color: theme.text }}>
                    Employee Portals
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                    {/* Manager Portal */}
                    <div onClick={() => onNavigate('manager')} style={{ 
                        background: 'white', 
                        padding: '32px', 
                        borderRadius: '24px', 
                        cursor: 'pointer', 
                        transition: 'all 0.3s ease', 
                        border: '2px solid transparent', 
                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)' 
                    }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = theme.primary; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }} >
                        <div style={{ background: '#fff7ed', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: theme.primary }}>
                            <User size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Manager Dashboard</h3>
                        <p style={{ color: theme.textLight, lineHeight: '1.5' }}>Access inventory, staff management, and sales reports.</p>
                    </div>

                    {/* Cashier Portal */}
                    <div onClick={() => onNavigate('cashier')} style={{ 
                        background: 'white', 
                        padding: '32px', 
                        borderRadius: '24px', 
                        cursor: 'pointer', 
                        transition: 'all 0.3s ease', 
                        border: '2px solid transparent', 
                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)' 
                    }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = theme.primary; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }} >
                        <div style={{ background: '#fff7ed', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: theme.primary }}>
                            <LogIn size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Cashier POS</h3>
                        <p style={{ color: theme.textLight, lineHeight: '1.5' }}>Handle customer orders, process payments, and manage the till.</p>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer style={{ background: '#78350f', color: 'white', padding: '60px 20px 30px', borderTop: '5px solid #d97706' }}>
                {/* ... (footer content remains the same) */}
            </footer>

            {/* --- Auth Modal --- */}
            {(authMode === 'login' || authMode === 'signup') && (
                <div 
                    onClick={handleCloseModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: theme.overlay,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column', // Added to support center/bottom text
                        justifyContent: 'center',
                        alignItems: 'center',
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                >
                    <div 
                        onClick={handleModalContentClick}
                        style={{
                            minWidth: '400px',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                    >
                        {/* Custom Auth Components - Render Sign In or Sign Up */}
                        {authMode === 'login' ? (
                            <CustomSignIn 
                                onSuccess={handleCloseModal} 
                                onSwitchToSignUp={() => setAuthMode('signup')}
                            />
                        ) : (
                            <CustomSignUp
                                onSuccess={handleCloseModal}
                                onSwitchToSignIn={() => setAuthMode('login')}
                            />
                        )}

                        <div style={{ color: theme.text, marginTop: '16px', textAlign: 'center' }}>
                            {/* Toggle Sign In/Sign Up message */}
                            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: theme.primary, 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    fontSize: 'inherit'
                                }}
                            >
                                {authMode === 'login' ? 'Sign up' : 'Log in'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animation for floating elements and modal */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default LandingPage;