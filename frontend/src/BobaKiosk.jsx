import { useState, useEffect } from 'react';
import { ShoppingCart, LogOut } from 'lucide-react';

const API_URL = 'https://project3-gang-20.onrender.com/api/menu-items/';
const ADDONS_URL = 'https://project3-gang-20.onrender.com/api/add-ons/';

// const API_URL = 'http://127.0.0.1:8000/api/menu-items/';
// const ADDONS_URL = 'http://127.0.0.1:8000/api/add-ons/';


function BobaKiosk({ onBack }) {
  const [currentView, setCurrentView] = useState('welcome');
  const [menuItems, setMenuItems] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState({
    iceLevel: null,
    sweetnessLevel: null,
    toppings: []
  });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuResponse, addOnsResponse] = await Promise.all([
          fetch(API_URL),
          fetch(ADDONS_URL)
        ]);
        
        if (!menuResponse.ok || !addOnsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const menuData = await menuResponse.json();
        const addOnsData = await addOnsResponse.json();
        
        setMenuItems(menuData);
        setAddOns(addOnsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setMenuItems([]);
        setAddOns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = [...new Set(menuItems.map(item => item.category))];

  const getAddOnsByCategory = (category) => {
    return addOns.filter(addon => addon.category === category);
  };

  const calculateCustomizationPrice = () => {
    let total = 0;
    if (selectedAddOns.iceLevel) {
      total += parseFloat(selectedAddOns.iceLevel.price);
    }
    if (selectedAddOns.sweetnessLevel) {
      total += parseFloat(selectedAddOns.sweetnessLevel.price);
    }
    selectedAddOns.toppings.forEach(topping => {
      total += parseFloat(topping.price);
    });
    return total;
  };

  const addToCart = () => {
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.price) + customizationPrice;
    
    setCart([...cart, {
      ...selectedDrink,
      cartId: Date.now(),
      customizations: { ...selectedAddOns },
      customizationPrice,
      totalPrice: totalPrice.toFixed(2)
    }]);
    
    // Reset customization
    setSelectedAddOns({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
    setSelectedDrink(null);
    setCurrentView('drinks');
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
  };

  const processPayment = async () => {
    setProcessingPayment(true);
    try {
      // Step 1: Get the last order_id
      const ordersResponse = await fetch(ORDERS_URL);
      if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
      const orders = await ordersResponse.json();
      
      // Find the highest order_id
      const lastOrderId = orders.length > 0 
        ? Math.max(...orders.map(order => order.order_id))
        : 0;
      const newOrderId = lastOrderId + 1;

      // Step 2: Get current date and time
      const now = new Date();
      const orderDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const orderTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

      // Step 3: Create the order
      const orderData = {
        order_id: newOrderId,
        order_date: orderDate,
        order_time: orderTime,
        employee_id: 0, // Kiosk orders use employee_id 0
        payment_type: 'Card'
      };

      const createOrderResponse = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!createOrderResponse.ok) throw new Error('Failed to create order');

      // Step 4: Group cart items by menu_item_id and sum quantities
      const itemQuantities = {};
      cart.forEach(item => {
        if (itemQuantities[item.menu_item_id]) {
          itemQuantities[item.menu_item_id] += 1;
        } else {
          itemQuantities[item.menu_item_id] = 1;
        }
      });

      // Step 5: Create order_items entries
      const orderItemsPromises = Object.entries(itemQuantities).map(([menuItemId, quantity]) => {
        const orderItemData = {
          order_id: newOrderId,
          menu_item_id: parseInt(menuItemId),
          quantity: quantity
        };

        return fetch(ORDER_ITEMS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderItemData)
        });
      });

      await Promise.all(orderItemsPromises);

      // Step 6: Clear cart and show success
      setCart([]);
      alert(`Order #${newOrderId} placed successfully! Total: ${getTotalPrice()}`);
      setCurrentView('welcome');
      
    } catch (err) {
      console.error('Payment processing error:', err);
      alert('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const toggleTopping = (topping) => {
    const isSelected = selectedAddOns.toppings.some(t => t.id === topping.id);
    if (isSelected) {
      setSelectedAddOns({
        ...selectedAddOns,
        toppings: selectedAddOns.toppings.filter(t => t.id !== topping.id)
      });
    } else {
      setSelectedAddOns({
        ...selectedAddOns,
        toppings: [...selectedAddOns.toppings, topping]
      });
    }
  };

  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };

  const LogoutButton = () => {
    if (currentView === 'welcome') return null;
    
    return (
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: '#dc2626',
          color: 'white',
          borderRadius: '8px',
          padding: '12px 20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 50,
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        <LogOut size={20} />
        Logout
      </button>
    );
  };

  const CartButton = () => {
    if (currentView === 'welcome' || currentView === 'checkout') return null;
    
    return (
      <button
        onClick={() => setCurrentView('checkout')}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#d97706',
          color: 'white',
          borderRadius: '50%',
          padding: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 50,
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        <ShoppingCart size={24} />
        {cart.length > 0 && (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
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
          <h1 style={{ fontSize: '64px', fontWeight: 'bold', color: '#78350f', marginBottom: '24px' }}>
            Welcome
          </h1>
          <p style={{ fontSize: '32px', color: '#92400e', marginBottom: '48px' }}>
            Tap to Start
          </p>
          <button
            onClick={() => setCurrentView('categories')}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              padding: '24px 48px',
              borderRadius: '16px',
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
        <LogoutButton />
        <CartButton />
        <div style={{ maxWidth: '1280px', width: '100%' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: '#78350f', textAlign: 'center', marginBottom: '48px' }}>
            Select a Category
          </h2>
          {loading && <p style={{ textAlign: 'center', fontSize: '24px' }}>Loading menu...</p>}
          {error && <p style={{ textAlign: 'center', fontSize: '24px', color: '#dc2626' }}>Error: {error}</p>}
          {!loading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
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
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '240px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '100px',
                    height: '100px',
                    margin: '0 auto 16px',
                    background: 'linear-gradient(to bottom right, #fde68a, #fb923c)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    🧋
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#78350f', textAlign: 'center' }}>
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
        <LogoutButton />
        <CartButton />
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => setCurrentView('categories')}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            ← Previous
          </button>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>
            Category: {selectedCategory}
          </h2>
          <p style={{ fontSize: '18px', color: '#92400e', marginBottom: '32px' }}>
            Tap a drink to customize
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            width: '100%',
            justifyItems: 'center'
          }}>
            {filteredDrinks.map((drink) => (
              <button
                key={drink.menu_item_id}
                onClick={() => {
                  setSelectedDrink(drink);
                  setCurrentView('customize');
                }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '240px',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 16px',
                  background: 'linear-gradient(to bottom right, #fde68a, #fb923c)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px'
                }}>
                  🥤
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>
                  {drink.name}
                </h3>
                <p style={{ color: '#d97706', fontSize: '14px', marginBottom: '8px' }}>
                  {drink.category}
                </p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>
                  ${parseFloat(drink.price).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'customize') {
    const iceLevels = getAddOnsByCategory('Ice Level');
    const sweetnessLevels = getAddOnsByCategory('Sweetness Level');
    const toppings = getAddOnsByCategory('Toppings');
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.price) + customizationPrice;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px',
        overflowY: 'auto'
      }}>
        <LogoutButton />
        <CartButton />
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => {
              setSelectedDrink(null);
              setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
              setCurrentView('drinks');
            }}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            ← Previous
          </button>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>
              {selectedDrink.name}
            </h2>
            <p style={{ fontSize: '18px', color: '#d97706', marginBottom: '16px' }}>
              Base Price: ${parseFloat(selectedDrink.price).toFixed(2)}
            </p>
          </div>

          {/* Ice Level */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f', marginBottom: '16px' }}>
              Ice Level
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
              {iceLevels.map((ice) => (
                <button
                  key={ice.id}
                  onClick={() => setSelectedAddOns({ ...selectedAddOns, iceLevel: ice })}
                  style={{
                    backgroundColor: selectedAddOns.iceLevel?.id === ice.id ? '#d97706' : '#f3f4f6',
                    color: selectedAddOns.iceLevel?.id === ice.id ? 'white' : '#78350f',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {ice.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sweetness Level */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f', marginBottom: '16px' }}>
              Sweetness Level
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {sweetnessLevels.map((sweet) => (
                <button
                  key={sweet.id}
                  onClick={() => setSelectedAddOns({ ...selectedAddOns, sweetnessLevel: sweet })}
                  style={{
                    backgroundColor: selectedAddOns.sweetnessLevel?.id === sweet.id ? '#d97706' : '#f3f4f6',
                    color: selectedAddOns.sweetnessLevel?.id === sweet.id ? 'white' : '#78350f',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {sweet.name}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f', marginBottom: '16px' }}>
              Toppings (Optional)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {toppings.map((topping) => {
                const isSelected = selectedAddOns.toppings.some(t => t.id === topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping)}
                    style={{
                      backgroundColor: isSelected ? '#d97706' : '#f3f4f6',
                      color: isSelected ? 'white' : '#78350f',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <div>{topping.name}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
                      +${parseFloat(topping.price).toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary and Add to Cart */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#78350f' }}>Total:</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={addToCart}
              disabled={!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel}
              style={{
                backgroundColor: (!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) ? '#9ca3af' : '#16a34a',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                cursor: (!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              Add to Cart
            </button>
            {(!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) && (
              <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '14px', marginTop: '8px' }}>
                Please select ice level and sweetness level
              </p>
            )}
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
        <LogoutButton />
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: '#78350f', textAlign: 'center', marginBottom: '48px' }}>
            Checkout
          </h2>
          
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '24px', color: '#92400e', marginBottom: '32px' }}>
                Your cart is empty
              </p>
              <button
                onClick={() => setCurrentView('categories')}
                style={{
                  backgroundColor: '#d97706',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  padding: '16px 40px',
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
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                marginBottom: '32px'
              }}>
                {cart.map((item) => (
                  <div key={item.cartId} style={{
                    padding: '16px 0',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#78350f' }}>
                          {item.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#d97706', marginTop: '4px' }}>
                          {item.category}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#16a34a' }}>
                          ${item.totalPrice}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.cartId)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '14px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                      {item.customizations.iceLevel && (
                        <div>• Ice: {item.customizations.iceLevel.name}</div>
                      )}
                      {item.customizations.sweetnessLevel && (
                        <div>• Sweetness: {item.customizations.sweetnessLevel.name}</div>
                      )}
                      {item.customizations.toppings.length > 0 && (
                        <div>• Toppings: {item.customizations.toppings.map(t => t.name).join(', ')}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '2px solid #fbbf24'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>
                      Total:
                    </span>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
                      ${getTotalPrice()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button
                  onClick={() => setCurrentView('categories')}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    padding: '16px 40px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add More
                </button>
                <button
                  onClick={processPayment}
                  disabled={processingPayment}
                  style={{
                    backgroundColor: processingPayment ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    padding: '16px 40px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: processingPayment ? 'not-allowed' : 'pointer'
                  }}
                >
                  {processingPayment ? 'Processing...' : 'Pay Now'}
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