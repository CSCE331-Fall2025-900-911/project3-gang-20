import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

const API_URL = 'https://project3-gang-20.onrender.com/api/menu-items/';

function BobaKiosk() {
  const [currentView, setCurrentView] = useState('welcome');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setMenuItems(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError(err.message);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  const categories = [...new Set(menuItems.map(item => item.category))];

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);
  };

  const CartButton = () => {
    if (currentView === 'welcome' || currentView === 'checkout') return null;
    
    return (
      <button
        onClick={() => setCurrentView('checkout')}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: '#d97706',
          color: 'white',
          borderRadius: '50%',
          padding: '20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 50,
          fontSize: '18px',
          fontWeight: 'bold'
        }}
      >
        <ShoppingCart size={32} />
        {cart.length > 0 && (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {cart.length}
          </span>
        )}
      </button>
    );
  };

  if (currentView === 'welcome') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '96px', fontWeight: 'bold', color: '#78350f', marginBottom: '32px' }}>
            Welcome
          </h1>
          <p style={{ fontSize: '48px', color: '#92400e', marginBottom: '64px' }}>
            Tap to Start
          </p>
          <button
            onClick={() => setCurrentView('categories')}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              fontSize: '36px',
              fontWeight: 'bold',
              padding: '48px 96px',
              borderRadius: '24px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            Start Order
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'categories') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CartButton />
        <div style={{ maxWidth: '1280px', width: '100%' }}>
          <h2 style={{ fontSize: '64px', fontWeight: 'bold', color: '#78350f', textAlign: 'center', marginBottom: '64px' }}>
            Select a Category
          </h2>
          {loading && <p style={{ textAlign: 'center', fontSize: '32px' }}>Loading menu...</p>}
          {error && <p style={{ textAlign: 'center', fontSize: '32px', color: '#dc2626' }}>Error: {error}</p>}
          {!loading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              width: '100%',
              margin: '0 auto',
              justifyItems: 'center'
            }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentView('drinks');
                  }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '40px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '320px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '160px',
                    height: '160px',
                    margin: '0 auto 24px',
                    background: 'linear-gradient(to bottom right, #fde68a, #fb923c)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '72px'
                  }}>
                    🧋
                  </div>
                  <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#78350f', textAlign: 'center' }}>
                    {category}
                  </h3>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'drinks') {
    const filteredDrinks = menuItems.filter(item => item.category === selectedCategory);
    
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px'
      }}>
        <CartButton />
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => setCurrentView('categories')}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              padding: '16px 40px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '32px'
            }}
          >
            ← Previous
          </button>
          <h2 style={{ fontSize: '56px', fontWeight: 'bold', color: '#78350f', marginBottom: '12px' }}>
            Category: {selectedCategory}
          </h2>
          <p style={{ fontSize: '28px', color: '#92400e', marginBottom: '40px' }}>
            Tap a drink to add to cart
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            width: '100%',
            justifyItems: 'center'
          }}>
            {filteredDrinks.map((drink) => (
              <button
                key={drink.menu_item_id}
                onClick={() => addToCart(drink)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  padding: '32px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '320px',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '128px',
                  height: '128px',
                  margin: '0 auto 24px',
                  background: 'linear-gradient(to bottom right, #fde68a, #fb923c)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px'
                }}>
                  🥤
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f', marginBottom: '12px' }}>
                  {drink.name}
                </h3>
                <p style={{ color: '#d97706', fontSize: '18px', marginBottom: '12px' }}>
                  Category: {drink.category}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
                  ${parseFloat(drink.price).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'checkout') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '960px', width: '100%' }}>
          <h2 style={{ fontSize: '64px', fontWeight: 'bold', color: '#78350f', textAlign: 'center', marginBottom: '64px' }}>
            Checkout
          </h2>
          
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '40px', color: '#92400e', marginBottom: '48px' }}>
                Your cart is empty
              </p>
              <button
                onClick={() => setCurrentView('categories')}
                style={{
                  backgroundColor: '#d97706',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  padding: '24px 64px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Add Items
              </button>
            </div>
          ) : (
            <>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                marginBottom: '40px'
              }}>
                {cart.map((item) => (
                  <div key={item.cartId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px 0',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>
                        {item.name}
                      </h3>
                      <p style={{ fontSize: '20px', color: '#d97706' }}>
                        {item.category}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '20px',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: '32px',
                  paddingTop: '32px',
                  borderTop: '2px solid #fbbf24'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#78350f' }}>
                      Total:
                    </span>
                    <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#16a34a' }}>
                      ${getTotalPrice()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                <button
                  onClick={() => setCurrentView('categories')}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    padding: '24px 64px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add More
                </button>
                <button
                  onClick={() => alert('Payment processing would happen here!')}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    padding: '24px 64px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Pay Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default BobaKiosk;