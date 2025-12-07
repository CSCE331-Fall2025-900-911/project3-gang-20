/*
  File: landing_page.jsx
  Description: Updated to ensure navigation buttons remain visible on smaller screens.
*/

import { useState, useEffect } from 'react';
import { Coffee, LogOut, ChevronRight, User } from 'lucide-react'; 
import { useUser, useClerk } from '@clerk/clerk-react';
import { CustomSignIn, CustomSignUp } from './Auth'; 

// --- Configuration ---
const CUSTOMERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customers/';
// Used for Role Based Access Control
const MANAGER_SLUG = 'manager-1762837696';
const CASHIER_SLUG = 'cashier-1763751666';

function LandingPage({ onNavigate }) {
    const [authMode, setAuthMode] = useState(null);
    const { isSignedIn, user, isLoaded } = useUser();
    const { signOut } = useClerk();

    // --- Role / Permission Logic ---
    const checkUserRole = (roleSlug) => {
        if (!isLoaded || !isSignedIn || !user) return false;
        return user.organizationMemberships.some(mem => mem.organization.slug === roleSlug);
    };

    const isManager = checkUserRole(MANAGER_SLUG);
    const isCashier = checkUserRole(CASHIER_SLUG) || isManager; 
    const isEmployee = isManager || isCashier;

    // --- Theme ---
    const theme = {
        primary: '#d97706',
        bg: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        text: '#78350f',
        textLight: '#92400e',
        overlay: 'rgba(120, 53, 15, 0.4)',
    };

    // --- Sync User to Database ---
    useEffect(() => {
        const syncUserToBackend = async () => {
            if (isLoaded && isSignedIn && user && user.primaryEmailAddress?.emailAddress) {
                try {
                    const userEmail = user.primaryEmailAddress.emailAddress.toLowerCase().trim();
                    
                    // Using the new filter logic if backend supports it, otherwise fetches all
                    const response = await fetch(CUSTOMERS_URL);
                    const customers = await response.json();
                    
                    // Handle both list and paginated response
                    const results = Array.isArray(customers) ? customers : (customers.results || []);
                    
                    const existingCustomer = results.find(c => 
                        c.email && c.email.toLowerCase().trim() === userEmail
                    );

                    if (!existingCustomer) {
                        const newCustomer = {
                            first_name: user.firstName || "New",
                            last_name: user.lastName || "User",
                            email: userEmail,
                            phone: "", 
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
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: theme.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: theme.text,
            overflow: 'hidden',
            position: 'relative'
        }}>

            {/* --- Navigation Bar --- */}
            <nav style={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5vh 20px', // Reduced side padding slightly for mobile
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 100,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: theme.primary, padding: '8px', borderRadius: '12px', color: 'white' }}>
                        <Coffee size={24} />
                    </div>
                    {/* Hide the text "BobaSpot" on very small screens if needed, or keep it */}
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                        Boba<span style={{ color: theme.primary }}>Spot</span>
                    </span>
                </div>

                {/* --- CENTER LINKS: Removed 'hidden md:flex' so they always show --- */}
                <div style={{ 
                    display: 'flex', 
                    gap: '20px', // Reduced gap slightly to fit smaller screens
                    fontWeight: '600', 
                    alignItems: 'center' 
                }}>
                    <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Home</button>
                    <button onClick={() => onNavigate('menu_board')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Menu</button>
                    {isSignedIn && (
                        <button onClick={() => onNavigate('account')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Account</button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {isLoaded && (
                        <>
                            {isSignedIn ? (
                                <>
                                    {/* Hide Greeting on small screens to save space */}
                                    <div className="hidden md:block" style={{ color: theme.text, fontWeight: '600', marginRight: '8px' }}>
                                        Hello, {user?.firstName || 'User'}
                                    </div>
                                    <button
                                        onClick={() => signOut(() => onNavigate('landing'))}
                                        style={{
                                            background: 'transparent',
                                            border: `2px solid ${theme.primary}`,
                                            color: theme.primary,
                                            padding: '8px 16px',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                        <LogOut size={18} />
                                        <span className="hidden md:inline">Log Out</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setAuthMode('login')}
                                        style={{
                                            background: 'transparent',
                                            border: `2px solid ${theme.primary}`,
                                            color: theme.primary,
                                            padding: '8px 16px',
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
                                            padding: '10px 20px',
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

            {/* --- Main Content --- */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0 20px',
                gap: '4vh'
            }}>

                {/* --- Hero Section --- */}
                <header style={{ textAlign: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 7vh, 5rem)',
                        fontWeight: '900',
                        lineHeight: '1.1',
                        marginBottom: '1.5vh',
                        background: `linear-gradient(135deg, ${theme.text} 0%, ${theme.primary} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Bobaclat
                    </h1>
                    <p style={{ fontSize: 'clamp(1rem, 2vh, 1.25rem)', color: theme.textLight, maxWidth: '600px', margin: '0 auto 3vh', lineHeight: '1.6' }}>
                        Experience the perfect blend of premium tea, fresh milk, and chewy tapioca pearls. Handcrafted daily for your delight.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => onNavigate('kiosk')} style={{ background: theme.primary, color: 'white', padding: '1.5vh 32px', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.4)', transition: 'transform 0.2s' }}>
                            Order Now <ChevronRight size={20} />
                        </button>
                        <button onClick={() => onNavigate('menu_board')} style={{ background: 'white', color: theme.text, padding: '1.5vh 32px', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            View Menu
                        </button>
                    </div>
                </header>

                {/* --- Employee Portals (CONDITIONAL RENDER) --- */}
                {isEmployee && (
                    <section style={{ textAlign: 'center', maxWidth: '1000px', width: '100%' }}>
                        <h2 style={{ fontSize: 'clamp(1.5rem, 3vh, 2rem)', fontWeight: '800', marginBottom: '2vh', color: theme.text }}>Employee Portals</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2vh', flexWrap: 'wrap' }}>
                            
                            {isManager && (
                                <div onClick={() => onNavigate('manager')} style={{ background: 'white', padding: '2.5vh 24px', borderRadius: '20px', cursor: 'pointer', minWidth: '280px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s' }}>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 'bold', marginBottom: '4px' }}>Manager Dashboard</h3>
                                    <p style={{ color: theme.textLight, fontSize: '0.95rem' }}>Access inventory, staff management, and sales reports.</p>
                                </div>
                            )}

                            {isCashier && (
                                <div onClick={() => onNavigate('cashier')} style={{ background: 'white', padding: '2.5vh 24px', borderRadius: '20px', cursor: 'pointer', minWidth: '280px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s' }}>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 'bold', marginBottom: '4px' }}>Cashier POS</h3>
                                    <p style={{ color: theme.textLight, fontSize: '0.95rem' }}>Handle customer orders, process payments, and manage the till.</p>
                                </div>
                            )}

                        </div>
                    </section>
                )}

            </main>

            <footer style={{ flexShrink: 0, background: '#78350f', color: 'white', padding: '2vh 20px', borderTop: '5px solid #d97706' }}>
                <div style={{ textAlign: 'center', opacity: 0.8, fontSize: '0.9rem' }}>Group 20 CSCE-331-902</div>
            </footer>

            {/* --- Auth Modal Overlay --- */}
            {(authMode === 'login' || authMode === 'signup') && (
                <div onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: theme.overlay, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease-out', backdropFilter: 'blur(4px)' }}>
                    <div onClick={handleModalContentClick} style={{ animation: 'slideUp 0.3s ease-out' }}>
                        {authMode === 'login' ? (
                            <CustomSignIn onSuccess={handleCloseModal} onClose={handleCloseModal} />
                        ) : (
                            <CustomSignUp onSuccess={handleCloseModal} onClose={handleCloseModal} />
                        )}
                        <div style={{ marginTop: '20px', textAlign: 'center', color: 'white', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            {authMode === 'login' ? "New here?" : "Already joined?"}{' '}
                            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#fed7aa', fontWeight: 'bold', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline' }}>
                                {authMode === 'login' ? 'Create Account' : 'Log In'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                /* Helper utility for explicit hiding */
                .hidden { display: none !important; }
                @media (min-width: 768px) {
                    .md\\:block { display: block !important; }
                    .md\\:inline { display: inline !important; }
                    .md\\:flex { display: flex !important; }
                }
            `}</style>
        </div>
    );
}

export default LandingPage;