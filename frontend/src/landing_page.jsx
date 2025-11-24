import { useState } from 'react';
import { Coffee, User, LogIn, ChevronRight, Star, MapPin, Clock, X } from 'lucide-react';

function LandingPage({ onNavigate }) {
    // 'login', 'signup', or null
    const [authMode, setAuthMode] = useState(null);

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
                    <button onClick={() => onNavigate('menu-board')} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Menu</button>
                    <button style={{ background: 'none', border: 'none', color: theme.text, cursor: 'not-allowed', opacity: 0.5, fontSize: '1rem', fontWeight: '600' }}>Our Story</button>
                </div>

                {/* Auth Buttons - Updated to trigger modal */}
                <div style={{ display: 'flex', gap: '16px' }}>
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
                        onClick={() => onNavigate('menu-board')}
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

            {/* --- Portals Grid (Employee/Manager Access) --- */}
            <section style={{
                padding: '60px 20px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '32px',
                    opacity: 0.7
                }}>
                    <div style={{ height: '1px', flex: 1, background: theme.textLight }}></div>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Internal Portals</span>
                    <div style={{ height: '1px', flex: 1, background: theme.textLight }}></div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {/* Manager Portal */}
                    <div
                        onClick={() => onNavigate('manager')}
                        style={{
                            background: 'white',
                            padding: '32px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '2px solid transparent',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.borderColor = theme.primary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={{
                            background: '#fff7ed',
                            width: '60px',
                            height: '60px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: theme.primary
                        }}>
                            <User size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Manager Dashboard</h3>
                        <p style={{ color: '#666', lineHeight: '1.5' }}>Access inventory, staff management, and sales reports.</p>
                    </div>

                    {/* Cashier Portal */}
                    <div
                        onClick={() => onNavigate('cashier')}
                        style={{
                            background: 'white',
                            padding: '32px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '2px solid transparent',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.borderColor = theme.primary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                    >
                        <div style={{
                            background: '#fff7ed',
                            width: '60px',
                            height: '60px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: theme.primary
                        }}>
                            <LogIn size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Cashier Station</h3>
                        <p style={{ color: '#666', lineHeight: '1.5' }}>Process orders and manage in-store transactions.</p>
                    </div>
                </div>
            </section>

            {/* --- Features / Social Proof --- */}
            <section style={{
                background: 'white',
                padding: '80px 20px',
                marginTop: '40px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '40px',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{ color: theme.primary, marginBottom: '16px' }}><Star size={40} fill={theme.primary} /></div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Premium Quality</h3>
                            <p style={{ color: '#666' }}>We use only the finest tea leaves and freshest ingredients sourced globally.</p>
                        </div>
                        <div>
                            <div style={{ color: theme.primary, marginBottom: '16px' }}><Clock size={40} /></div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Fast Service</h3>
                            <p style={{ color: '#666' }}>Order ahead via our kiosk or app and skip the line. Fresh boba in minutes.</p>
                        </div>
                        <div>
                            <div style={{ color: theme.primary, marginBottom: '16px' }}><MapPin size={40} /></div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Multiple Locations</h3>
                            <p style={{ color: '#666' }}>Find us in the heart of the city, near campus, and at the mall.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer style={{
                background: '#2a1810', // Dark brown
                color: 'white',
                padding: '60px 20px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <Coffee size={24} color={theme.primary} />
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>BobaSpot</span>
                        </div>
                        <p style={{ color: '#a8a29e', lineHeight: '1.6' }}>
                            Crafting the perfect cup of joy, one bubble at a time. Join us for a refreshing experience.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '24px' }}>Quick Links</h4>
                        <ul style={{ listStyle: 'none', padding: 0, color: '#a8a29e', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Home</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Menu</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Employee Login</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '60px', paddingTop: '32px', textAlign: 'center', color: '#a8a29e' }}>
                    © 2025 BobaSpot. All rights reserved.
                </div>
            </footer>

            {/* --- Auth Modal --- */}
            {authMode && (
                <div 
                    onClick={handleCloseModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: theme.overlay,
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div 
                        onClick={handleModalContentClick}
                        style={{
                            background: 'white',
                            width: '100%',
                            maxWidth: '420px',
                            borderRadius: '24px',
                            padding: '40px',
                            position: 'relative',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        {/* Close Button */}
                        <button 
                            onClick={handleCloseModal}
                            style={{
                                position: 'absolute',
                                top: '24px',
                                right: '24px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#999',
                                padding: '4px'
                            }}
                        >
                            <X size={24} />
                        </button>

                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ 
                                background: theme.primary, 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                margin: '0 auto 16px',
                                color: 'white'
                            }}>
                                {authMode === 'login' ? <LogIn size={24} /> : <User size={24} />}
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: theme.text }}>
                                {authMode === 'login' ? 'Welcome Back' : 'Join BobaSpot'}
                            </h2>
                            <p style={{ color: '#666', marginTop: '8px' }}>
                                {authMode === 'login' ? 'Please enter your details.' : 'Create an account to start earning points.'}
                            </p>
                        </div>

                        {/* Form */}
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {authMode === 'signup' && (
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Full Name" 
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '2px solid #e5e7eb',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = theme.primary}
                                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <input 
                                    type="email" 
                                    placeholder="Email Address" 
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '2px solid #e5e7eb',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = theme.primary}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            <div>
                                <input 
                                    type="password" 
                                    placeholder="Password" 
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '2px solid #e5e7eb',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = theme.primary}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {authMode === 'login' && (
                                <div style={{ textAlign: 'right' }}>
                                    <a href="#" style={{ fontSize: '0.9rem', color: theme.primary, textDecoration: 'none', fontWeight: '600' }}>Forgot Password?</a>
                                </div>
                            )}

                            <button type="submit" style={{
                                background: theme.primary,
                                color: 'white',
                                border: 'none',
                                padding: '16px',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginTop: '8px',
                                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)'
                            }}>
                                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        {/* Footer / Switch Mode */}
                        <div style={{ marginTop: '24px', textAlign: 'center', color: '#666', fontSize: '0.95rem' }}>
                            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
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