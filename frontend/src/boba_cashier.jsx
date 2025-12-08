/*
  File: boba_cashier.jsx
  Description: The Cashier Point of Sale (POS) system.
  Handles order creation, payment processing (Cash/Card), and weather integration.
  Allows employees to customize drinks, manage the cart, and view transaction history.
*/

import { useState, useEffect } from 'react';
import { Trash2, LogOut, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Edit } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

// API Endpoints
const ITEMS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/menu-items/';
const CUSTOMIZATION_OPTIONS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customization-options/';
const ORDERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/orders/';
const EMPLOYEES_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/employees/';

// Business logic constants
const TAX_RATE = 0.0825; // 8.25% sales tax
const SERVICE_CHARGE_RATE = 0.025; // 2.5% service charge for card payments

// --- Theme Constants (Matched to Kiosk) ---
const theme = {
  bg: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
  text: '#78350f',
  textSecondary: '#92400e',
  cardBg: 'white',
  primary: '#d97706',
  primaryText: 'white',
  secondary: '#f3f4f6',
  secondaryText: '#78350f',
  danger: '#dc2626',
  success: '#16a34a',
  border: 'none',
  shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

/*
  The main component for the cashier POS interface.
*/
function BobaCashier({ onBack }) {
  // State for storing data fetched from the API
  const [menuItems, setMenuItems] = useState([]);
  const [customizationOptions, setCustomizationOptions] = useState([]);

  // State for UI and selection
  const [selectedCategory, setSelectedCategory] = useState('Milky'); // Default category
  const [cart, setCart] = useState([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);

  // State for the customization modal
  const [customizationModal, setCustomizationModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // Track if we are editing an existing item
  const [selectedCustomizations, setSelectedCustomizations] = useState({
    iceLevel: null,
    sweetnessLevel: null,
    toppings: []
  });

  // State for loading and transaction status
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // New state for transaction loading
  const [orderNumber, setOrderNumber] = useState(1); // Display order number
  const [transactionMessage, setTransactionMessage] = useState('');

  // State for external API data (Weather)
  const [temperature, setTemperature] = useState(null);
  const [description, setDescription] = useState("");

  // State for employee user data
  const { user } = useUser();
  const [currentEmployeeId, setCurrentEmployeeId] = useState(1);

  // On component mount, fetch menu data and the next available order ID
  useEffect(() => {
    fetchData();
    fetchNextOrderNumber();
    if (user) {
      matchEmployee();
    }
  }, [user]);

  // match logged in user to employee in database
  const matchEmployee = async () => {
    try {
      const response = await fetch(EMPLOYEES_URL);
      const employees = await response.json();

      if (user && user.firstName && user.lastName) {
        const foundEmployee = employees.find(emp =>
          emp.first_name.toLowerCase() === user.firstName.toLowerCase() &&
          emp.last_name.toLowerCase() === user.lastName.toLowerCase()
        );

        if (foundEmployee) {
          console.log(`Employee Matched: ${foundEmployee.first_name} (ID: ${foundEmployee.id})`);
          setCurrentEmployeeId(foundEmployee.id);
        } else {
          // default to ID 1 if user not found
          console.warn("Logged in user not found in employee database. Using default ID: 1");
        }
      }
    } catch (err) {
      console.error("Error matching employee:", err);
    }
  };

  // Fetches all menu items and customization options from the API in parallel.
  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuResponse, customizationsResponse] = await Promise.all([
        fetch(ITEMS_URL),
        fetch(CUSTOMIZATION_OPTIONS_URL)
      ]);

      const menuData = await menuResponse.json();
      const customizationsData = await customizationsResponse.json();

      setMenuItems(menuData);
      setCustomizationOptions(customizationsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextOrderNumber = async () => {
    try {
      const response = await fetch(`${ORDERS_URL}latest_id/`);
      const data = await response.json();
      setOrderNumber(data.latest_id + 1);
    } catch (err) {
      console.error("Error fetching order number:", err);
      setOrderNumber(1);
    }
  };

  // Memoized derived state:
  // Get a unique list of categories from the menu items
  const categories = [...new Set(menuItems.map(item => item.category))];
  // Filter the menu items based on the currently selected category
  const filteredDrinks = menuItems.filter(item => item.category === selectedCategory);

  // Filters the master customization options list to find options for a specific category.
  const getCustomizationsByCategory = (category) => {
    return customizationOptions.filter(option => option.category === category);
  };

  // Opens the customization modal for a specific drink.
  const openCustomization = (drink) => {
    setSelectedDrink(drink);
    // Reset customizations for the new drink
    setSelectedCustomizations({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
    setCustomizationModal(true);
  };

  // Calculates the total price of all currently selected customizations in the modal.
  const calculateCustomizationPrice = () => {
    let total = 0;
    if (selectedCustomizations.iceLevel) total += parseFloat(selectedCustomizations.iceLevel.price);
    if (selectedCustomizations.sweetnessLevel) total += parseFloat(selectedCustomizations.sweetnessLevel.price);
    selectedCustomizations.toppings.forEach(topping => {
      total += parseFloat(topping.price);
    });
    return total;
  };

  // Adds or Updates the currently customized drink in the cart.
  const addToCart = () => {
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.base_price) + customizationPrice;

    if (editingItem) {
      // Update existing item
      setCart(cart.map(item => {
        if (item.cartId === editingItem.cartId) {
          return {
            ...item,
            customizations: { ...selectedCustomizations },
            customizationPrice,
            totalPrice: totalPrice.toFixed(2)
          };
        }
        return item;
      }));
      setEditingItem(null);
    } else {
      // Add new item
      setCart([...cart, {
        ...selectedDrink,
        cartId: Date.now(), // Unique ID for cart item removal
        customizations: { ...selectedCustomizations },
        customizationPrice,
        totalPrice: totalPrice.toFixed(2)
      }]);
    }

    // Reset and close modal
    setCustomizationModal(false);
    setSelectedDrink(null);
    setSelectedCustomizations({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
  };

  // Prepares an item for editing
  const startEditing = (item) => {
    setEditingItem(item); // Track which item we are editing
    setSelectedDrink(item); // Load the drink details
    setSelectedCustomizations(item.customizations); // Load its customizations
    setCustomizationModal(true); // Open the modal
  };

  // Removes an item from the cart.
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  // Clears all items from the cart and resets payment selection.
  const clearCart = () => {
    setCart([]);
    setSelectedPaymentType(null);
    setTransactionMessage('');
  };

  // --- Cart Total Calculation Functions ---

  // Calculates the subtotal of all items in the cart.
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  };

  // Calculates the service charge. Only applied if payment type is 'Card'.
  const getServiceCharge = () => {
    if (selectedPaymentType === 'Card') {
      return getSubtotal() * SERVICE_CHARGE_RATE;
    }
    return 0.0;
  };

  // Calculates the tax based on subtotal and service charge.
  const getTax = () => {
    // Tax is calculated on subtotal + service charge
    return (getSubtotal() + getServiceCharge()) * TAX_RATE;
  };

  // Calculates the final total (subtotal + service charge + tax).
  const getTotal = () => {
    return getSubtotal() + getServiceCharge() + getTax();
  };

  // --- Payment and Transaction Functions ---

  // Sets the payment type to 'Cash'.
  const handleCashPayment = () => {
    setSelectedPaymentType('Cash');
    setTransactionMessage('');
  };

  // Sets the payment type to 'Card'.
  const handleCardPayment = () => {
    setSelectedPaymentType('Card');
    setTransactionMessage('');
  };

  /*
    Handles the final transaction submission.
    Validates cart, creates order, and resets state.
  */
  const completeTransaction = async () => {
    // 1. Validation checks
    if (cart.length === 0) {
      setTransactionMessage('Add items to cart');
      return;
    }

    if (!selectedPaymentType) {
      setTransactionMessage('Please select payment method (Cash or Card)');
      return;
    }

    setIsProcessing(true); // Start loading feedback

    try {
      // 2. PREPARE THE ITEMS DATA FIRST
      // Group cart items by menu item ID to get quantities
      const itemQuantities = {};
      cart.forEach(item => {
        if (itemQuantities[item.id]) {
          itemQuantities[item.id].quantity++;
          // Collect all customizations for this menu item
          itemQuantities[item.id].customizations.push(item.customizations);
        } else {
          itemQuantities[item.id] = {
            quantity: 1,
            menuItemId: item.id,
            customizations: [item.customizations]
          };
        }
      });

      // Format the items array for the API
      const formattedItems = [];

      for (const [menuItemKey, itemData] of Object.entries(itemQuantities)) {
        // Collect all customization option IDs into a flat array
        const allCustomizationIds = [];
        itemData.customizations.forEach(custom => {
          if (custom.iceLevel) allCustomizationIds.push(custom.iceLevel.id);
          if (custom.sweetnessLevel) allCustomizationIds.push(custom.sweetnessLevel.id);
          custom.toppings.forEach(topping => allCustomizationIds.push(topping.id));
        });

        formattedItems.push({
          menu_item: itemData.menuItemId,
          quantity: itemData.quantity,
          customizations: allCustomizationIds
        });
      }

      const orderData = {
        payment_type: selectedPaymentType,
        employee: currentEmployeeId,
        customer: null,
        items: formattedItems,
        sub_total: getSubtotal().toFixed(2)
      };

      console.log('Sending complete order payload:', orderData);

      const orderResponse = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(`Order creation failed: ${orderResponse.status} - ${errorText}`);
      }

      const order = await orderResponse.json();
      console.log('Order created successfully:', order);


      const finalTotal = getTotal();
      setTransactionMessage(`Transaction Complete - Order #${order.id} - Total: $${finalTotal.toFixed(2)}`);

      setCart([]);
      setSelectedPaymentType(null);

      // after 3 seconds, clear the message and fetch the next order number
      setTimeout(() => {
        fetchNextOrderNumber();
        setTransactionMessage('');
      }, 3000);

    } catch (err) {
      console.error('Error completing transaction:', err);
      setTransactionMessage(`Transaction Failed: ${err.message}`);
    } finally {
      setIsProcessing(false); // End loading feedback
    }
  };

  // Toggles the selection of a topping in the customization modal.
  const toggleTopping = (topping) => {
    const isSelected = selectedCustomizations.toppings.some(t => t.id === topping.id);
    if (isSelected) {
      // Remove the topping
      setSelectedCustomizations({
        ...selectedCustomizations,
        toppings: selectedCustomizations.toppings.filter(t => t.id !== topping.id)
      });
    } else {
      // Add the topping
      setSelectedCustomizations({
        ...selectedCustomizations,
        toppings: [...selectedCustomizations.toppings, topping]
      });
    }
  };

  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };


  useEffect(() => {
    fetch(
      "https://api.openweathermap.org/data/2.5/weather?lat=30.621703&lon=-96.340494&appid=" + import.meta.env.VITE_WEATHER_API + "&units=imperial"
    )
      .then((response) => response.json())
      .then((data) => {
        setTemperature(data.main.temp);
        setDescription(data.weather[0].description);
      })
      .catch((error) => console.error("Error fetching weather:", error));
  }, []);

  // Converts a weather description string into an emoji.
  const getWeatherEmoji = (desc) => {
    if (!desc) return <Sun size={24} />;
    if (desc.includes("clear")) return <Sun size={24} />;
    if (desc.includes("cloud")) return <Cloud size={24} />;
    if (desc.includes("rain")) return <CloudRain size={24} />;
    if (desc.includes("thunder")) return <CloudLightning size={24} />;
    if (desc.includes("snow")) return <CloudSnow size={24} />;
    return <Sun size={24} />;
  };

  // Loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.text,
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Loading...
      </div>
    );
  }

  // Main component render
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: theme.text
    }}>
      {/* Header Bar */}
      <div style={{
        background: theme.cardBg,
        borderRadius: '24px',
        padding: '24px 40px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: theme.shadow
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.text }}>Cashier Portal</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          {/* Weather Widget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.5rem', fontWeight: '600', color: theme.textSecondary }}>
            <span>{temperature ? `${Math.round(temperature)}°F` : '--'}</span>
            {getWeatherEmoji(description)}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: theme.danger,
              color: 'white',
              padding: '16px 32px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)'
            }}
          >
            <LogOut size={24} />
            Exit
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '250px 1fr 400px',
        gap: '24px',
        height: 'calc(100vh - 140px)'
      }}>

        {/* Column 1: Categories Sidebar */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '24px',
          padding: '24px',
          boxShadow: theme.shadow,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: theme.text }}>Categories</h2>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedCategory === category ? theme.primary : theme.secondary,
                color: selectedCategory === category ? theme.primaryText : theme.secondaryText,
                boxShadow: selectedCategory === category ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Column 2: Menu Items Grid */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '24px',
          padding: '24px',
          boxShadow: theme.shadow,
          overflowY: 'auto'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px', color: theme.text }}>
            {selectedCategory} Drinks
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {filteredDrinks.map((drink) => (
              <button
                key={drink.id}
                onClick={() => openCustomization(drink)}
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  padding: '32px',
                  minHeight: '200px',
                  border: `2px solid ${theme.secondary}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '12px'
                }}>
                  <h3 style={{
                    fontWeight: '800',
                    color: theme.text,
                    fontSize: '1.5rem',
                    lineHeight: '1.2'
                  }}>
                    {drink.name}
                  </h3>
                  <p style={{
                    color: theme.primary,
                    fontWeight: 'bold',
                    fontSize: '1.8rem'
                  }}>
                    ${parseFloat(drink.base_price).toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Cart and Payment */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '24px',
          padding: '24px',
          boxShadow: theme.shadow,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.text }}>Order #{orderNumber}</h2>
            <p style={{ color: theme.textSecondary }}>Current Cart</p>
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>
                Cart is empty
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  style={{
                    background: theme.secondary,
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #fed7aa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: 'bold', color: theme.text, fontSize: '1.1rem' }}>{item.name}</h4>
                      <p style={{ fontSize: '1rem', color: theme.textSecondary }}>{item.category}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: theme.success, fontSize: '1.1rem' }}>${item.totalPrice}</span>
                      <button
                        onClick={() => startEditing(item)}
                        style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Edit Item"
                      >
                        <Edit size={24} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        style={{ color: theme.danger, background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Remove Item"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                  {/* Display customizations */}
                  <div style={{ fontSize: '0.95rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {item.customizations.iceLevel && (
                      <div>• Ice: {item.customizations.iceLevel.name}</div>
                    )}
                    {item.customizations.sweetnessLevel && (
                      <div>• Sweet: {item.customizations.sweetnessLevel.name}</div>
                    )}
                    {item.customizations.toppings.length > 0 && (
                      <div>• Toppings: {item.customizations.toppings.map(t => t.name).join(', ')}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clear Cart Button */}
          <button
            onClick={clearCart}
            style={{
              width: '100%',
              background: '#f472b6', // Pink
              color: 'white',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Clear All
          </button>

          {/* Totals Section */}
          <div style={{ borderTop: `2px solid ${theme.secondary}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: theme.text }}>
              <span>Subtotal:</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            {selectedPaymentType === 'Card' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: theme.primary }}>
                <span>Service Charge:</span>
                <span>${getServiceCharge().toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: theme.text }}>
              <span>Tax:</span>
              <span>${getTax().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.8rem', fontWeight: 'bold', color: theme.text, marginTop: '8px' }}>
              <span>Total:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Transaction Message Area */}
          {transactionMessage && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '12px',
              textAlign: 'center',
              fontWeight: 'bold',
              background: transactionMessage.includes('Complete') ? '#dcfce7' : '#fee2e2',
              color: transactionMessage.includes('Complete') ? '#166534' : '#991b1b'
            }}>
              {transactionMessage}
            </div>
          )}

          {/* Payment Type Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={handleCashPayment}
              style={{
                padding: '16px',
                borderRadius: '16px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                background: selectedPaymentType === 'Cash' ? theme.primary : theme.secondary,
                color: selectedPaymentType === 'Cash' ? theme.primaryText : theme.secondaryText
              }}
            >
              Cash
            </button>
            <button
              onClick={handleCardPayment}
              style={{
                padding: '16px',
                borderRadius: '16px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                background: selectedPaymentType === 'Card' ? theme.primary : theme.secondary,
                color: selectedPaymentType === 'Card' ? theme.primaryText : theme.secondaryText
              }}
            >
              Card
            </button>
          </div>

          {/* Complete Transaction Button */}
          <button
            onClick={completeTransaction}
            disabled={cart.length === 0 || isProcessing}
            style={{
              width: '100%',
              background: isProcessing ? '#9ca3af' : 'black', // Gray out if processing
              color: 'white',
              padding: '16px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              border: 'none',
              cursor: (cart.length === 0 || isProcessing) ? 'not-allowed' : 'pointer',
              marginTop: '12px',
              opacity: (cart.length === 0 || isProcessing) ? 0.5 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {isProcessing ? (
              <>
                <div className="spinner-border" style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid white',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </>
            ) : "Complete Transaction"}
          </button>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>

      {/* Customization Modal */}
      {customizationModal && selectedDrink && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{ background: theme.primary, color: 'white', padding: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Customize: {selectedDrink.name}</h2>
              <p style={{ marginTop: '4px', opacity: 0.9 }}>Base Price: ${parseFloat(selectedDrink.base_price).toFixed(2)}</p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Ice Level */}
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Ice Level *</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {getCustomizationsByCategory('Ice Level').map((ice) => (
                    <button
                      key={ice.id}
                      onClick={() => setSelectedCustomizations({ ...selectedCustomizations, iceLevel: ice })}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedCustomizations.iceLevel?.id === ice.id ? theme.primary : theme.secondary,
                        color: selectedCustomizations.iceLevel?.id === ice.id ? theme.primaryText : theme.secondaryText
                      }}
                    >
                      {ice.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness Level */}
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Sweetness Level *</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {getCustomizationsByCategory('Sweetness Level').map((sweet) => (
                    <button
                      key={sweet.id}
                      onClick={() => setSelectedCustomizations({ ...selectedCustomizations, sweetnessLevel: sweet })}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedCustomizations.sweetnessLevel?.id === sweet.id ? theme.primary : theme.secondary,
                        color: selectedCustomizations.sweetnessLevel?.id === sweet.id ? theme.primaryText : theme.secondaryText
                      }}
                    >
                      {sweet.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.text, marginBottom: '16px' }}>Toppings (Optional)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {getCustomizationsByCategory('Toppings').map((topping) => {
                    const isSelected = selectedCustomizations.toppings.some(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          textAlign: 'left',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: isSelected ? theme.primary : theme.secondary,
                          color: isSelected ? theme.primaryText : theme.secondaryText
                        }}
                      >
                        <span>{topping.name}</span>
                        <span style={{ opacity: 0.8 }}>+${parseFloat(topping.price).toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer (Total and Actions) */}
              <div style={{ borderTop: `2px solid ${theme.secondary}`, paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.text }}>Total:</span>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.success }}>
                    ${(parseFloat(selectedDrink.base_price) + calculateCustomizationPrice()).toFixed(2)}
                  </span>
                </div>

                {/* Validation Message */}
                {(!selectedCustomizations.iceLevel || !selectedCustomizations.sweetnessLevel) && (
                  <p style={{ color: theme.danger, textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>
                    * Please select ice level and sweetness level
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button
                    onClick={() => setCustomizationModal(false)}
                    style={{
                      background: '#9ca3af',
                      color: 'white',
                      padding: '16px',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addToCart}
                    disabled={!selectedCustomizations.iceLevel || !selectedCustomizations.sweetnessLevel}
                    style={{
                      background: theme.success,
                      color: 'white',
                      padding: '16px',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      border: 'none',
                      cursor: (!selectedCustomizations.iceLevel || !selectedCustomizations.sweetnessLevel) ? 'not-allowed' : 'pointer',
                      opacity: (!selectedCustomizations.iceLevel || !selectedCustomizations.sweetnessLevel) ? 0.5 : 1
                    }}
                  >
                    {editingItem ? 'Update Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BobaCashier;