/*
  File: boba_account.jsx
  Description: Optimized Account Page. Uses server-side filtering to fetch minimal data.
*/

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, Star, Clock, ShoppingBag, ChevronDown, Loader } from 'lucide-react';

// --- CONFIGURATION ---
// Ensure these point to your local backend
const CUSTOMERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customers/';
const ORDERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/orders/';

function BobaAccount({ onNavigate }) {
    const { user, isLoaded, isSignedIn } = useUser();
    
    // Data State
    const [customerInfo, setCustomerInfo] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    
    // Loading State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Pagination State
    // "Offset" tracks how many orders we have already loaded
    const [offset, setOffset] = useState(0); 
    const LIMIT = 5; // How many to fetch at a time
    const [hasMore, setHasMore] = useState(true);

    const theme = {
        primary: '#d97706',
        bg: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        text: '#78350f',
        textLight: '#92400e',
    };

    // 1. Initial Load: Fetch Customer & First 5 Orders
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!isLoaded || !isSignedIn || !user) return;

            try {
                const userEmail = user.primaryEmailAddress.emailAddress.toLowerCase().trim();

                // --- FAST FETCH: Ask ONLY for this email ---
                // Backend must support: /api/customers/?email=...
                const customerRes = await fetch(`${CUSTOMERS_URL}?email=${userEmail}`);
                const customerData = await customerRes.json();
                
                // The API might return a list [Object] or a paginated object { results: [Object] }
                // We handle both cases safely:
                const results = Array.isArray(customerData) ? customerData : (customerData.results || []);
                const foundCustomer = results[0];

                if (foundCustomer) {
                    setCustomerInfo(foundCustomer);

                    // --- FAST FETCH: Ask ONLY for this customer's orders ---
                    // Backend must support: /api/orders/?customer=ID&ordering=-date&limit=5
                    await fetchOrders(foundCustomer.id, 0);
                } else {
                    console.log("Customer email not found in DB.");
                    setLoading(false);
                }

            } catch (error) {
                console.error("Error fetching account data:", error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [isLoaded, isSignedIn, user]);

    // 2. Fetch Helper (Server-Side Pagination)
    const fetchOrders = async (customerId, currentOffset) => {
        try {
            // Construct the efficient URL
            // customer: Filter by ID
            // ordering: Sort by date descending (newest first)
            // limit: Only send 5 items
            // offset: Skip the items we already have
            const query = `?customer=${customerId}&ordering=-order_date_time&limit=${LIMIT}&offset=${currentOffset}`;
            
            const res = await fetch(ORDERS_URL + query);
            const data = await res.json();

            // Handle API structure (List vs Paginated)
            const newOrders = Array.isArray(data) ? data : (data.results || []);

            // If we received fewer items than the limit, we've reached the end
            if (newOrders.length < LIMIT) {
                setHasMore(false);
            }

            setOrderHistory(prev => [...prev, ...newOrders]);
            setOffset(currentOffset + LIMIT);

        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // 3. Load More Handler
    const handleLoadMore = () => {
        if (customerInfo && !loadingMore && hasMore) {
            setLoadingMore(true);
            fetchOrders(customerInfo.id, offset);
        }
    };

    if (!isSignedIn) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, color: theme.text }}>
                Please log in to view your account.
                <button onClick={() => onNavigate('landing')} style={{ marginLeft: '10px', fontWeight: 'bold' }}>Go Back</button>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: theme.text,
            padding: '40px 20px'
        }}>
            {/* --- Header --- */}
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button 
                    onClick={() => onNavigate('landing')}
                    style={{ 
                        background: 'white', border: 'none', borderRadius: '50%', padding: '12px', 
                        cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginRight: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>My Account</h1>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* --- Points Card --- */}
                <div style={{
                    background: theme.primary,
                    color: 'white',
                    borderRadius: '24px',
                    padding: '40px',
                    boxShadow: '0 20px 25px -5px rgba(217, 119, 6, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '150px'
                }}>
                    <div style={{ zIndex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9, fontWeight: '600' }}>Available Rewards Points</h2>
                        <div style={{ fontSize: '4rem', fontWeight: '900', lineHeight: 1, marginTop: '10px' }}>
                            {loading && !customerInfo ? (
                                <Loader size={48} className="animate-spin" />
                            ) : (
                                customerInfo?.points || 0
                            )}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '50%', zIndex: 1 }}>
                        <Star size={48} fill="white" />
                    </div>
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* --- Order History --- */}
                <div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={28} /> Order History
                    </h3>

                    {loading ? (
                         <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                            <Loader size={32} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                            <p>Loading your history...</p>
                        </div>
                    ) : orderHistory.length === 0 ? (
                        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', opacity: 0.8 }}>
                            <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>You haven't placed any orders yet.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {orderHistory.map((order, index) => (
                                    <div key={`${order.id}-${index}`} style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        animation: 'fadeIn 0.5s ease-out'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #f3f4f6' }}>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                                                    {new Date(order.order_date_time).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '0.95rem', color: '#6b7280', fontWeight: '500' }}>
                                                    {new Date(order.order_date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: '800', color: theme.primary, fontSize: '1.5rem' }}>
                                                ${order.sub_total}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                    <div style={{ 
                                                        background: '#fff7ed', color: theme.primary, 
                                                        fontWeight: '700', padding: '4px 10px', 
                                                        borderRadius: '8px', fontSize: '0.9rem',
                                                        minWidth: '32px', textAlign: 'center'
                                                    }}>
                                                        {item.quantity}x
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{item.menu_item}</div>
                                                        {item.customizations && item.customizations.length > 0 && (
                                                            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px', lineHeight: '1.4' }}>
                                                                {item.customizations.map(c => c.split('(')[0]).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* View More Button */}
                            {hasMore && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', paddingBottom: '40px' }}>
                                    <button 
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        style={{
                                            background: loadingMore ? '#f3f4f6' : 'white',
                                            color: theme.text,
                                            border: `2px solid ${theme.primary}`,
                                            padding: '12px 32px',
                                            borderRadius: '50px',
                                            fontSize: '1rem',
                                            fontWeight: '700',
                                            cursor: loadingMore ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                            transition: 'all 0.2s ease',
                                            opacity: loadingMore ? 0.7 : 1
                                        }}
                                    >
                                        {loadingMore ? 'Loading...' : 'View More Orders'} <ChevronDown size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default BobaAccount;