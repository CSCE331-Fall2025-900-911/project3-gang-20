import { useState, useEffect } from 'react';
import { Trash2, LogOut } from 'lucide-react';

// API Endpoints
const API_URL = 'https://project3-gang-20.onrender.com/api/menu-items/';
const ADDONS_URL = 'https://project3-gang-20.onrender.com/api/add-ons/';
const ORDERS_URL = 'https://project3-gang-20.onrender.com/api/orders/';
const ORDER_ITEMS_URL = 'https://project3-gang-20.onrender.com/api/order-items/';

// Business logic constants
const TAX_RATE = 0.0825; // 8.25% sales tax
const SERVICE_CHARGE_RATE = 0.025; // 2.5% service charge for card payments

/**
 * The main component for the cashier POS interface.
 * @param {object} props - Component props.
 * @param {function} props.onBack - Callback function to return to the previous view (e.g., employee login).
 */
function BobaCashier({ onBack }) {
  // State for storing data fetched from the API
  const [menuItems, setMenuItems] = useState([]);
  const [addOns, setAddOns] = useState([]);

  // State for UI and selection
  const [selectedCategory, setSelectedCategory] = useState('Milky'); // Default category
  const [cart, setCart] = useState([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  
  // State for the customization modal
  const [customizationModal, setCustomizationModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState({
    iceLevel: null,
    sweetnessLevel: null,
    toppings: []
  });

  // State for loading and transaction status
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState(0); // Stores the ID for the *next* order
  const [transactionMessage, setTransactionMessage] = useState('');

  // State for external API data (Weather)
  const [temperature, setTemperature] = useState(null);
  const [description, setDescription] = useState("");

  // On component mount, fetch menu data and the next available order ID
  useEffect(() => {
    fetchData();
    fetchNextOrderId();
  }, []);

  /**
   * Fetches all menu items and add-ons from the API in parallel.
   * Updates the component state with the fetched data.
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuResponse, addOnsResponse] = await Promise.all([
        fetch(API_URL),
        fetch(ADDONS_URL)
      ]);
      
      const menuData = await menuResponse.json();
      const addOnsData = await addOnsResponse.json();
      
      setMenuItems(menuData);
      setAddOns(addOnsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches all existing orders to determine the next available order ID.
   * Sets the `orderNumber` state to the highest existing ID + 1.
   */
  const fetchNextOrderId = async () => {
    try {
      const response = await fetch(ORDERS_URL);
      const orders = await response.json();
      
      if (orders.length > 0) {
        // Find the maximum order_id and add 1
        const maxOrderId = Math.max(...orders.map(order => order.order_id));
        setOrderNumber(maxOrderId + 1);
      } else {
        // If no orders exist, start from 1
        setOrderNumber(1);
      }
    } catch (err) {
      console.error("Error fetching order ID:", err);
      setOrderNumber(1); // Default to 1 on failure
    }
  };

  // Memoized derived state:
  // Get a unique list of categories from the menu items
  const categories = [...new Set(menuItems.map(item => item.category))];
  // Filter the menu items based on the currently selected category
  const filteredDrinks = menuItems.filter(item => item.category === selectedCategory);

  /**
   * Filters the master add-ons list to find add-ons for a specific category.
   * @param {string} category - The category to filter by (e.g., 'Ice Level', 'Toppings').
   * @returns {Array<object>} - An array of add-on items matching the category.
   */
  const getAddOnsByCategory = (category) => {
    return addOns.filter(addon => addon.category === category);
  };

  /**
   * Opens the customization modal for a specific drink.
   * @param {object} drink - The drink item to be customized.
   */
  const openCustomization = (drink) => {
    setSelectedDrink(drink);
    // Reset add-ons for the new drink
    setSelectedAddOns({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
    setCustomizationModal(true);
  };

  /**
   * Calculates the total price of all currently selected add-ons in the modal.
   * @returns {number} - The total price of customizations.
   */
  const calculateCustomizationPrice = () => {
    let total = 0;
    if (selectedAddOns.iceLevel) total += parseFloat(selectedAddOns.iceLevel.price);
    if (selectedAddOns.sweetnessLevel) total += parseFloat(selectedAddOns.sweetnessLevel.price);
    selectedAddOns.toppings.forEach(topping => {
      total += parseFloat(topping.price);
    });
    return total;
  };

  /**
   * Adds the currently customized drink from the modal to the cart.
   * Resets modal state and closes the modal.
   */
  const addToCart = () => {
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.price) + customizationPrice;
    
    setCart([...cart, {
      ...selectedDrink,
      cartId: Date.now(), // Unique ID for cart item removal
      customizations: { ...selectedAddOns },
      customizationPrice,
      totalPrice: totalPrice.toFixed(2)
    }]);
    
    // Reset and close modal
    setCustomizationModal(false);
    setSelectedDrink(null);
    setSelectedAddOns({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
  };

  /**
   * Removes an item from the cart.
   * @param {number} cartId - The unique ID of the cart item to remove.
   */
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  /**
   * Clears all items from the cart and resets payment selection.
   */
  const clearCart = () => {
    setCart([]);
    setSelectedPaymentType(null);
    setTransactionMessage('');
  };

  // --- Cart Total Calculation Functions ---

  /**
   * Calculates the subtotal of all items in the cart.
   * @returns {number} - The cart subtotal.
   */
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  };

  /**
   * Calculates the service charge. Only applied if payment type is 'Card'.
   * @returns {number} - The calculated service charge.
   */
  const getServiceCharge = () => {
    if (selectedPaymentType === 'Card') {
      return getSubtotal() * SERVICE_CHARGE_RATE;
    }
    return 0.0;
  };

  /**
   * Calculates the tax based on subtotal and service charge.
   * @returns {number} - The calculated tax.
   */
  const getTax = () => {
    // Tax is calculated on subtotal + service charge
    return (getSubtotal() + getServiceCharge()) * TAX_RATE;
  };

  /**
   * Calculates the final total (subtotal + service charge + tax).
   * @returns {number} - The final total.
   */
  const getTotal = () => {
    return getSubtotal() + getServiceCharge() + getTax();
  };

  // --- Payment and Transaction Functions ---

  /**
   * Sets the payment type to 'Cash'.
   */
  const handleCashPayment = () => {
    setSelectedPaymentType('Cash');
    setTransactionMessage('');
  };

  /**
   * Sets the payment type to 'Card'.
   */
  const handleCardPayment = () => {
    setSelectedPaymentType('Card');
    setTransactionMessage('');
  };

  /**
   * Handles the final transaction submission.
   * 1. Validates the cart and payment type.
   * 2. Creates a new order in the 'orders' table.
   * 3. Groups cart items and creates entries in the 'order_items' table.
   * 4. Clears the cart and displays a success message.
   * 5. Fetches the next order ID for the next transaction.
   */
  const completeTransaction = async () => {
    // Validation checks
    if (cart.length === 0) {
      setTransactionMessage('Add items to cart');
      return;
    }

    if (!selectedPaymentType) {
      setTransactionMessage('Please select payment method (Cash or Card)');
      return;
    }

    try {
      // Create order object
      const now = new Date();
      const orderData = {
        order_id: orderNumber,
        order_date: now.toISOString().split('T')[0],
        order_time: now.toTimeString().split(' ')[0],
        employee: 101, // Hardcoded employee ID for cashier
        payment_type: selectedPaymentType
      };

      console.log('Creating order:', orderData);

      // POST the new order
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
      console.log('Order created:', order);

      // Group cart items by menu_item_id to get quantities
      const itemQuantities = {};
      cart.forEach(item => {
        if (itemQuantities[item.menu_item_id]) {
          itemQuantities[item.menu_item_id]++;
        } else {
          itemQuantities[item.menu_item_id] = 1;
        }
      });

      // Create order item entries for each grouped item
      for (const [menuItemId, quantity] of Object.entries(itemQuantities)) {
        const orderItemData = {
          order: order.order_id, // API expects 'order'
          menu_item: parseInt(menuItemId), // API expects 'menu_item'
          quantity: quantity
        };

        console.log('Creating order item:', orderItemData);

        // POST the new order item
        const orderItemResponse = await fetch(ORDER_ITEMS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderItemData)
        });

        if (!orderItemResponse.ok) {
          const errorText = await orderItemResponse.text();
          console.error('Order item creation failed:', errorText);
          throw new Error(`Order item creation failed: ${orderItemResponse.status}`);
        }

        console.log('Order item created successfully');
      }

      // On success: show message, clear cart, and prepare for next order
      const finalTotal = getTotal();
      setTransactionMessage(`Transaction Complete - Order #${order.order_id} - Total: $${finalTotal.toFixed(2)}`);
      
      setCart([]);
      setSelectedPaymentType(null);

      // After 3 seconds, clear the message and fetch the next order ID
      setTimeout(() => {
        fetchNextOrderId();
        setTransactionMessage('');
      }, 3000);

    } catch (err) {
      // Handle any errors during the transaction
      console.error('Error completing transaction:', err);
      setTransactionMessage(`Transaction Failed: ${err.message}`);
      setSelectedPaymentType(null);
    }
  };

  /**
   * Toggles the selection of a topping in the customization modal.
   * @param {object} topping - The topping object to add or remove.
   */
  const toggleTopping = (topping) => {
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
   * Calls the onBack prop to exit the cashier view.
   */
  const handleLogout = () => {
    if (onBack) {
      onBack();
    }
  };

  // --- Weather API Effect and Helper ---

  // Fetches weather data on component mount
   useEffect(() => {
    fetch( 
      // Fetches weather for College Station, TX
      "https://api.openweathermap.org/data/2.5/weather?lat=30.621703&lon=-96.340494&appid=" + import.meta.env.VITE_WEATHER_API + "&units=imperial"
    )
      .then((response) => response.json())
      .then((data) => {
        setTemperature(data.main.temp);
        setDescription(data.weather[0].description);
      })
      .catch((error) => console.error("Error fetching weather:", error));
  }, []);

  /**
   * Converts a weather description string into an emoji.
   * @param {string} desc - The weather description (e.g., "clear sky").
   * @returns {string} - A corresponding emoji.
   */
  const getWeatherEmoji = (desc) => {
    if (desc === "clear sky") return "☀️";
    if (desc === "few clouds") return "⛅";
    if (desc === "scattered clouds") return "🌥️";
    if (desc === "broken clouds") return "☁️";
    if (desc === "shower rain") return "🌦️";
    if (desc === "rain") return "🌧️";
    if (desc === "thunderstorm") return "⛈️";
    if (desc === "snow") return "❄️";
    return "" // Default
  };

  const weatherEmoji = getWeatherEmoji(description);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center">
        <div className="text-3xl font-bold text-amber-900">Loading...</div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 p-4">
      {/* Header Bar */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Cashier</h1>

        <div className="flex items-center gap-6">
          {/* Weather Widget */}
          <div className="flex items-center gap-2 text-lg font-semibold text-amber-800">
            <span>{temperature}°F</span>
            <span>{weatherEmoji}</span>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        
        {/* Column 1: Categories Sidebar */}
        <div className="col-span-2 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Menu Items Grid */}
        <div className="col-span-6 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            Items: {selectedCategory}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {filteredDrinks.map((drink) => (
              <button
                key={drink.menu_item_id}
                onClick={() => openCustomization(drink)}
                className="bg-gray-100 hover:bg-amber-100 rounded-lg p-4 transition-colors border-2 border-gray-300 hover:border-amber-500"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🥤</div>
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                    {drink.name}
                  </h3>
                  <p className="text-lg font-bold text-amber-700">
                    ${parseFloat(drink.price).toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Cart and Payment */}
        <div className="col-span-4 bg-white rounded-lg shadow-lg p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-amber-900">Order #{orderNumber}</h2>
            <h3 className="text-xl font-semibold text-gray-700 mt-2">Cart</h3>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="bg-amber-50 rounded-lg p-3 border border-amber-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                        <p className="text-xs text-gray-600">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-green-700">
                          ${item.totalPrice}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {/* Display customizations */}
                    <div className="text-xs text-gray-600 space-y-1">
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
                ))}
              </div>
            )}
          </div>

          {/* Clear Cart Button */}
          <button
            onClick={clearCart}
            className="w-full bg-pink-400 text-white py-3 rounded-lg font-bold mb-4 hover:bg-pink-500"
          >
            Clear All
          </button>

          {/* Totals Section */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            {selectedPaymentType === 'Card' && (
              <div className="flex justify-between text-lg text-amber-700">
                <span>Service Charge ({(SERVICE_CHARGE_RATE * 100).toFixed(1)}%):</span>
                <span>${getServiceCharge().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span>Tax ({(TAX_RATE * 100).toFixed(2)}%):</span>
              <span>${getTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-amber-900 border-t pt-2">
              <span>Total:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Transaction Message Area */}
          {transactionMessage && (
            <div className={`mt-4 p-3 rounded-lg text-center font-bold ${
              transactionMessage.includes('Complete') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {transactionMessage}
            </div>
          )}

          {/* Payment Type Selection */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handleCashPayment}
              className={`py-3 rounded-lg font-bold transition-colors ${
                selectedPaymentType === 'Cash'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cash
            </button>
            <button
              onClick={handleCardPayment}
              className={`py-3 rounded-lg font-bold transition-colors ${
                selectedPaymentType === 'Card'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Card
            </button>
          </div>

          {/* Complete Transaction Button */}
          <button
            onClick={completeTransaction}
            disabled={cart.length === 0}
            className="w-full bg-black text-white py-3 rounded-lg font-bold mt-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Complete Transaction
          </button>
        </div>
      </div>

      {/* Customization Modal */}
      {customizationModal && selectedDrink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-amber-600 text-white p-6">
              <h2 className="text-2xl font-bold">Customize: {selectedDrink.name}</h2>
              <p className="text-lg mt-1">Base Price: ${parseFloat(selectedDrink.price).toFixed(2)}</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Ice Level */}
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">Ice Level *</h3>
                <div className="grid grid-cols-4 gap-2">
                  {getAddOnsByCategory('Ice Level').map((ice) => (
                    <button
                      key={ice.id}
                      onClick={() => setSelectedAddOns({ ...selectedAddOns, iceLevel: ice })}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        selectedAddOns.iceLevel?.id === ice.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {ice.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness Level */}
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">Sweetness Level *</h3>
                <div className="grid grid-cols-4 gap-2">
                  {getAddOnsByCategory('Sweetness Level').map((sweet) => (
                    <button
                      key={sweet.id}
                      onClick={() => setSelectedAddOns({ ...selectedAddOns, sweetnessLevel: sweet })}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        selectedAddOns.sweetnessLevel?.id === sweet.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {sweet.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">Toppings (Optional)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {getAddOnsByCategory('Toppings').map((topping) => {
                    const isSelected = selectedAddOns.toppings.some(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all text-left ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <div>{topping.name}</div>
                        <div className="text-sm">+${parseFloat(topping.price).toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer (Total and Actions) */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-amber-900">Total:</span>
                  <span className="text-3xl font-bold text-green-700">
                    ${(parseFloat(selectedDrink.price) + calculateCustomizationPrice()).toFixed(2)}
                  </span>
                </div>

                {/* Validation Message */}
                {(!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) && (
                  <p className="text-red-600 text-center mb-3 font-semibold">
                    * Please select ice level and sweetness level
                  </p>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCustomizationModal(false)}
                    className="bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addToCart}
                    disabled={!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel}
                    className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add to Cart
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