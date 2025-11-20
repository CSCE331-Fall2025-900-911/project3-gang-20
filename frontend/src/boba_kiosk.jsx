import { useState, useEffect } from 'react';
import { ShoppingCart, LogOut } from 'lucide-react';

// API Endpoints
const MENU_ITEMS_URL = 'http://127.0.0.1:8000/api/menu-items/';
const ADDONS_ITEMS_URL = 'http://127.0.0.1:8000/api/customization-options/';
const ORDERS_URL = 'http://127.0.0.1:8000/api/orders/';
const ORDER_ITEMS_URL = 'http://127.0.0.1:8000/api/order-items/';

/**
 * The main component for the boba ordering kiosk interface.
 * @param {object} props - Component props.
 * @param {function} props.onBack - Callback function to return to the previous view (e.g., employee login).
 */
function BobaKiosk({ onBack }) {

  // Google Translate Setup function
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.VERTICAL },
        'google_translate_element'
      );
    };
  }, []);

  // State for managing the current UI view (e.g., 'welcome', 'categories')
  const [currentView, setCurrentView] = useState('welcome');
  
  // State for storing data fetched from the API
  const [menuItems, setMenuItems] = useState([]);
  const [addOns, setAddOns] = useState([]);
  
  // State for tracking the user's selection flow
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  
  // State for the item currently being customized
  const [selectedAddOns, setSelectedAddOns] = useState({
    iceLevel: null,
    sweetnessLevel: null,
    toppings: []
  });
  
  // State for the shopping cart
  const [cart, setCart] = useState([]);
  
  // State for API data fetching status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State to prevent double-submission during payment
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetches all menu items and add-ons from the API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch menu items and add-ons in parallel
        const [menuResponse, addOnsResponse] = await Promise.all([
          fetch(MENU_ITEMS_URL),
          fetch(ADDONS_ITEMS_URL)
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
        // Handle network or parsing errors
        console.error("Error fetching data:", err);
        setError(err.message);
        setMenuItems([]);
        setAddOns([]);
      } finally {
        // Ensure loading is set to false regardless of success or failure
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derives a unique list of categories from the menu items
  const categories = [...new Set(menuItems.map(item => item.category))];

  /**
   * Filters the master add-ons list to find add-ons for a specific category.
   * @param {string} category - The category to filter by (e.g., 'Ice Level', 'Toppings').
   * @returns {Array<object>} - An array of add-on items matching the category.
   */
  const getAddOnsByCategory = (category) => {
    return addOns.filter(addon => addon.category === category);
  };

  /**
   * Calculates the total price of all currently selected add-ons.
   * @returns {number} - The total price of customizations.
   */
  const calculateCustomizationPrice = () => {
    let total = 0;
    // Sum the price of the selected ice level, sweetness, and all toppings
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

  /**
   * Adds the currently selected and customized drink to the cart.
   * Calculates the final price and resets the customization state.
   */
  const addToCart = () => {
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.base_price) + customizationPrice;
    
    // Create a new cart item with a unique ID and all customization details
    setCart([...cart, {
      ...selectedDrink,
      cartId: Date.now(), // Use a timestamp as a unique ID for cart removal
      customizations: { ...selectedAddOns },
      customizationPrice,
      totalPrice: totalPrice.toFixed(2)
    }]);
    
    // Reset customization state for the next drink
    setSelectedAddOns({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
    setSelectedDrink(null);
    // Navigate back to the drink selection screen
    setCurrentView('drinks');
  };

  /**
   * Removes an item from the cart based on its unique cartId.
   * @param {number} cartId - The unique identifier (timestamp) of the cart item to remove.
   */
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  /**
   * Calculates the total price of all items currently in the cart.
   * @returns {string} - The total price formatted as a string with two decimal places.
   */
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
  };


  // Helper to extract just the IDs of the selected options
  // Returns an array of integers: e.g., [1, 5, 12]
  const getCustomizationIDs = (cartItem) => {
    const ids = [];

    // 1. Ice Level ID
    if (cartItem.customizations.iceLevel) {
        ids.push(cartItem.customizations.iceLevel.id);
    }
    
    // 2. Sweetness Level ID
    if (cartItem.customizations.sweetnessLevel) {
        ids.push(cartItem.customizations.sweetnessLevel.id);
    }

    // 3. Topping IDs
    cartItem.customizations.toppings.forEach(topping => {
        ids.push(topping.id);
    });

    return ids; 
  };

  /**
   * Handles the checkout process using the "Single POST" method.
   * Matches the 'OrderWriteSerializer' structure in Django.
   */
  const processPayment = async () => {
    setProcessingPayment(true);
    try {
      // Step 1: Format the items exactly how OrderItemWriteSerializer expects them
      const itemsPayload = cart.map((cartItem) => ({
        menu_item: cartItem.id, // Send the ID (e.g., 4)
        quantity: 1,
        customizations: getCustomizationIDs(cartItem) // Send Array of IDs (e.g., [1, 5])
      }));

      // Step 2: Construct the main Order payload
      const orderData = {
        payment_type: 'Card',
        // IMPORTANT: Ensure your backend Employee/Customer serializers allow nulls
        // If they don't, you might need to send a valid ID here (e.g., a generic 'Kiosk' employee ID)
        customer: null, 
        employee: null, 
        items: itemsPayload // This nested list triggers the nested write in Django
      };

      // Step 3: Send ONE request to the Orders endpoint
      const response = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        // Capture the specific error from Django (e.g., "Employee field may not be null")
        const errorText = await response.text();
        throw new Error(`Server Error: ${errorText}`);
      }
      
      const newOrder = await response.json();

      // Step 4: Success
      const finalTotal = getTotalPrice(); 
      setCart([]);
      alert(`Order #${newOrder.id || 'placed'} successfully! Total: $${finalTotal}`);
      setCurrentView('welcome');
      
    } catch (err) {
      console.error('Payment processing error:', err);
      alert(`Order Failed: ${err.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  /**
   * Adds or removes a topping from the 'selectedAddOns' state.
   * @param {object} topping - The topping object to add or remove.
   */
  const toggleTopping = (topping) => {
    // Check if the topping is already selected
    const isSelected = selectedAddOns.toppings.some(t => t.id === topping.id);
    if (isSelected) {
      // Remove the topping
      setSelectedAddOns({
        ...selectedAddOns,
        toppings: selectedAddOns.toppings.filter(t => t.id !== topping.id)
      });
    } else {
      // Add the topping
      setSelectedAddOns({
        ...selectedAddOns,
        toppings: [...selectedAddOns.toppings, topping]
      });
    }
  };

  /**
   * Calls the onBack prop to exit the kiosk view.
   */
  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };

  /**
   * A floating button to exit the kiosk view.
   * Only renders if not on the 'welcome' screen.
   * @returns {React.ReactNode} - The logout button component or null.
   */
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

  /**
   * A floating button that displays the cart icon and item count.
   * Navigates to the 'checkout' view on click.
   * @returns {React.ReactNode} - The cart button component or null.
   */
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

  // Definig all views into a variable to allow for google translate div placement
  let viewContent = null;

  // --- View: Welcome Screen ---
  // The initial screen that prompts the user to start an order.
  if (currentView === 'welcome') {
    viewContent = (
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

  // --- View: Category Selection Screen ---
  // Displays all available drink categories.
  if (currentView === 'categories') {
    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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

  // --- View: Drink Selection Screen ---
  // Displays all drinks within the selected category.
  if (currentView === 'drinks') {
    const filteredDrinks = menuItems.filter(item => item.category === selectedCategory);
    
    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px'
      }}>
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
                  ${parseFloat(drink.base_price).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- View: Drink Customization Screen ---
  // Allows the user to select ice level, sweetness, and toppings for the selected drink.
  if (currentView === 'customize') {
    // Get the available customization options from the fetched add-ons data
    const iceLevels = getAddOnsByCategory('Ice Level');
    const sweetnessLevels = getAddOnsByCategory('Sweetness Level');
    const toppings = getAddOnsByCategory('Toppings');
    
    // Calculate the price in real-time as user selects options
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.base_price) + customizationPrice;

    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px',
        overflowY: 'auto'
      }}>

        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => {
              // Clear selections when going back
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

          {/* Drink Header */}
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
              Base Price: ${parseFloat(selectedDrink.base_price).toFixed(2)}
            </p>
          </div>

          {/* Ice Level Selection */}
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

          {/* Sweetness Level Selection */}
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

          {/* Toppings Selection */}
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

          {/* Summary and Add to Cart Button */}
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
              // Disable button until required options are selected
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

  // --- View: Checkout Screen ---
  // Displays the cart, total price, and payment options.
  if (currentView === 'checkout') {
    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: '#78350f', textAlign: 'center', marginBottom: '48px' }}>
            Checkout
          </h2>
          
          {cart.length === 0 ? (
            // Display if cart is empty
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
            // Display if cart has items
            <>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                marginBottom: '32px'
              }}>
                {/* List all cart items */}
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
                    {/* Display customizations */}
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
              </div>
                {/* Cart Total */}
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
              {/* Action Buttons */}
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

  return (
    <>
      {/* 🛑 PLACE THE GOOGLE TRANSLATE DIV HERE 🛑 */}
      {/* We use position: fixed to keep it locked to the corner */}
      <div 
        id="google_translate_element" 
        style={{ 
          position: 'fixed', 
          top: '90px', 
          right: '20px', 
          zIndex: 1000,
          backgroundColor: '#fffbeb', /* Added background for visibility */
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }} 
      />
      
      <LogoutButton />
      <CartButton />
      {/* Render the selected view content */}
      {viewContent}
    </>
  );
}

export default BobaKiosk;