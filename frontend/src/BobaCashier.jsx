import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, User, LogOut } from 'lucide-react';

const API_URL = 'https://project3-gang-20.onrender.com/api/menu-items/';
const ADDONS_URL = 'https://project3-gang-20.onrender.com/api/add-ons/';
const ORDERS_URL = 'https://project3-gang-20.onrender.com/api/orders/';
const ORDER_ITEMS_URL = 'https://project3-gang-20.onrender.com/api/order-items/';
const TAX_RATE = 0.0825;

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  if (currentPage === 'cashier') {
    return <BobaCashier onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-amber-900 mb-4">
            🧋 Boba Restaurant
          </h1>
          <p className="text-2xl text-amber-700">
            Select Your Portal
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <button
            onClick={() => setCurrentPage('cashier')}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500"
          >
            <div className="text-7xl mb-6">💳</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Cashier
            </h2>
            <p className="text-lg text-amber-700">
              Point of Sale system
            </p>
          </button>

          <button
            onClick={() => window.location.href = '/kiosk'}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500"
          >
            <div className="text-7xl mb-6">🥤</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Customer Kiosk
            </h2>
            <p className="text-lg text-amber-700">
              Self-service ordering
            </p>
          </button>

          <button
            onClick={() => window.location.href = '/manager'}
            className="bg-white rounded-2xl p-12 shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-transparent hover:border-amber-500"
          >
            <div className="text-7xl mb-6">⚙️</div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">
              Manager Dashboard
            </h2>
            <p className="text-lg text-amber-700">
              Manage menu & inventory
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

function BobaCashier({ onBack }) {
  const [menuItems, setMenuItems] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Milky');
  const [cart, setCart] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [customizationModal, setCustomizationModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState({
    iceLevel: null,
    sweetnessLevel: null,
    toppings: []
  });
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState(31830);

  useEffect(() => {
    fetchData();
  }, []);

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

  const categories = [...new Set(menuItems.map(item => item.category))];
  const filteredDrinks = menuItems.filter(item => item.category === selectedCategory);

  const getAddOnsByCategory = (category) => {
    return addOns.filter(addon => addon.category === category);
  };

  const openCustomization = (drink) => {
    setSelectedDrink(drink);
    setSelectedAddOns({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
    setCustomizationModal(true);
  };

  const calculateCustomizationPrice = () => {
    let total = 0;
    if (selectedAddOns.iceLevel) total += parseFloat(selectedAddOns.iceLevel.price);
    if (selectedAddOns.sweetnessLevel) total += parseFloat(selectedAddOns.sweetnessLevel.price);
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
    
    setCustomizationModal(false);
    setSelectedDrink(null);
    setSelectedAddOns({
      iceLevel: null,
      sweetnessLevel: null,
      toppings: []
    });
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  };

  const getTax = () => {
    return getSubtotal() * TAX_RATE;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const completeTransaction = async (paymentType) => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      // Create order
      const orderData = {
        order_date: new Date().toISOString().split('T')[0],
        order_time: new Date().toTimeString().split(' ')[0],
        employee: 1, // Default employee
        payment_type: paymentType
      };

      const orderResponse = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const order = await orderResponse.json();

      // Create order items
      for (const item of cart) {
        await fetch(ORDER_ITEMS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: order.order_id,
            menu_item: item.menu_item_id,
            quantity: 1
          })
        });
      }

      alert(`Order #${order.order_id} completed successfully!\nPayment: ${paymentType}\nTotal: $${getTotal().toFixed(2)}`);
      
      setCart([]);
      setOrderNumber(order.order_id);
    } catch (err) {
      console.error('Error completing transaction:', err);
      alert('Failed to complete transaction. Please try again.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 flex items-center justify-center">
        <div className="text-3xl font-bold text-amber-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Cashier</h1>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        {/* Categories Sidebar */}
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

        {/* Menu Items */}
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

        {/* Cart */}
        <div className="col-span-4 bg-white rounded-lg shadow-lg p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-amber-900">Order #{orderNumber}</h2>
            <h3 className="text-xl font-semibold text-gray-700 mt-2">Cart</h3>
          </div>

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

          <button
            onClick={clearCart}
            className="w-full bg-pink-400 text-white py-3 rounded-lg font-bold mb-4 hover:bg-pink-500"
          >
            Clear All
          </button>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Tax (8.25%):</span>
              <span>${getTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-amber-900 border-t pt-2">
              <span>Total:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => completeTransaction('Cash')}
              disabled={cart.length === 0}
              className="bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cash
            </button>
            <button
              onClick={() => completeTransaction('Card')}
              disabled={cart.length === 0}
              className="bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Card
            </button>
          </div>

          <button
            onClick={() => completeTransaction('Card')}
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
            <div className="bg-amber-600 text-white p-6">
              <h2 className="text-2xl font-bold">Customize: {selectedDrink.name}</h2>
              <p className="text-lg mt-1">Base Price: ${parseFloat(selectedDrink.price).toFixed(2)}</p>
            </div>

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

              {/* Total and Actions */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-amber-900">Total:</span>
                  <span className="text-3xl font-bold text-green-700">
                    ${(parseFloat(selectedDrink.price) + calculateCustomizationPrice()).toFixed(2)}
                  </span>
                </div>

                {(!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) && (
                  <p className="text-red-600 text-center mb-3 font-semibold">
                    * Please select ice level and sweetness level
                  </p>
                )}

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