import { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, LogOut, Type, Sun, Moon, Minus, Plus } from 'lucide-react';

// --- Accessibility Context & Theme ---

const AccessibilityContext = createContext();

const THEMES = {
  normal: {
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
  },
  highContrast: {
    bg: '#ffffff',
    text: '#000000',
    textSecondary: '#000000',
    cardBg: '#ffffff',
    primary: '#000000',
    primaryText: '#ffff00',
    secondary: '#ffffff',
    secondaryText: '#000000',
    danger: '#000000', // Red is bad for contrast sometimes, stick to black/white/yellow
    success: '#000000',
    border: '4px solid #000000',
    shadow: 'none',
  }
};

function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    return parseFloat(localStorage.getItem('kioskFontSize')) || 1.0;
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('kioskHighContrast') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('kioskFontSize', fontSize);
    localStorage.setItem('kioskHighContrast', highContrast);
  }, [fontSize, highContrast]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 0.25, 1.5));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 0.25, 1.0));
  const toggleContrast = () => setHighContrast(prev => !prev);

  const theme = highContrast ? THEMES.highContrast : THEMES.normal;

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      highContrast,
      theme,
      increaseFontSize,
      decreaseFontSize,
      toggleContrast
    }}>
      <div style={{
        fontSize: `${fontSize}rem`,
        lineHeight: 1.5,
        transition: 'all 0.2s ease'
      }}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

function useAccessibility() {
  return useContext(AccessibilityContext);
}

// --- Reusable Components ---

function KioskButton({ onClick, children, variant = 'primary', style = {}, disabled = false, ...props }) {
  const { theme, highContrast, fontSize } = useAccessibility();

  let bg = theme.primary;
  let color = theme.primaryText;

  if (variant === 'secondary') {
    bg = theme.secondary;
    color = theme.secondaryText;
  } else if (variant === 'danger') {
    bg = theme.danger;
    color = 'white';
    if (highContrast) {
      bg = '#000000';
      color = '#ffffff';
    }
  } else if (variant === 'success') {
    bg = theme.success;
    color = 'white';
    if (highContrast) {
      bg = '#000000';
      color = '#ffffff';
    }
  }

  if (disabled) {
    bg = '#9ca3af';
    color = '#e5e7eb';
    if (highContrast) {
      bg = '#cccccc';
      color = '#666666';
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bg,
        color: color,
        border: theme.border,
        padding: `${1 * fontSize}rem ${2 * fontSize}rem`, // Scale padding with font size
        borderRadius: highContrast ? '0' : '16px',
        fontSize: '1em', // Inherit from parent (which is scaled)
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: theme.shadow,
        minWidth: '44px', // WCAG touch target
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5em',
        transition: 'transform 0.1s',
        outline: 'none',
        ...style
      }}
      onFocus={(e) => e.target.style.outline = `4px solid ${highContrast ? '#ffff00' : '#2563eb'}`}
      onBlur={(e) => e.target.style.outline = 'none'}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
      {...props}
    >
      {children}
    </button>
  );
}

function AccessibilityControls() {
  const { fontSize, increaseFontSize, decreaseFontSize, toggleContrast, highContrast, theme } = useAccessibility();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '16px',
      zIndex: 1000,
      backgroundColor: theme.cardBg,
      padding: '8px 16px',
      borderRadius: '12px',
      border: theme.border,
      boxShadow: theme.shadow
    }}>
      <KioskButton onClick={decreaseFontSize} disabled={fontSize <= 1.0} aria-label="Decrease text size" variant="secondary" style={{ padding: '8px' }}>
        <Minus size={24} />
        <span style={{ fontSize: '0.8em' }}>A</span>
      </KioskButton>
      <KioskButton onClick={increaseFontSize} disabled={fontSize >= 1.5} aria-label="Increase text size" variant="secondary" style={{ padding: '8px' }}>
        <Plus size={24} />
        <span style={{ fontSize: '1.2em' }}>A</span>
      </KioskButton>
      <div style={{ width: '1px', backgroundColor: '#ccc' }}></div>
      <KioskButton onClick={toggleContrast} aria-label="Toggle high contrast" variant="secondary" style={{ padding: '8px' }}>
        {highContrast ? <Sun size={24} /> : <Moon size={24} />}
        <span>{highContrast ? 'Normal' : 'Contrast'}</span>
      </KioskButton>
    </div>
  );
}

// --- Main App Logic ---

// API Endpoints
const MENU_ITEMS_URL = 'https://project3-gang-20.onrender.com/api/menu-items/';
const ADDONS_ITEMS_URL = 'https://project3-gang-20.onrender.com/api/customization-options/';
const ORDERS_URL = 'https://project3-gang-20.onrender.com/api/orders/';

function BobaKioskContent({ onBack }) {
  const { theme, highContrast } = useAccessibility();

  // Google Translate Setup
  useEffect(() => {
    // Define the callback function first
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.VERTICAL },
          'google_translate_element'
        );
      }
    };

    // Check if script is already present
    if (!document.querySelector('#google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      // If script is already loaded, manually trigger init
      window.googleTranslateElementInit();
    }

    // Inject custom styles for Google Translate
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide the Google Translate top bar */
      .goog-te-banner-frame { display: none !important; }
      body { top: 0px !important; }

      /* Container styling */
      #google_translate_element {
        overflow: hidden;
      }

      /* Hide Google branding */
      .goog-te-gadget-icon { display: none !important; }
      .goog-te-gadget-simple { background-color: transparent !important; border: none !important; padding: 0 !important; }
      .goog-te-gadget span { display: none !important; } /* Hides "Powered by Google" */
      .goog-te-gadget { color: transparent !important; font-size: 0 !important; }

      /* Style the dropdown */
      .goog-te-combo {
        color: #78350f;
        background-color: white;
        border: 1px solid #d97706;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        outline: none;
        appearance: none; /* Remove default arrow in some browsers */
        -webkit-appearance: none;
        padding-right: 30px; /* Space for custom arrow */
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23d97706%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2082.2c3.6-3.6%205.4-7.8%205.4-12.8%200-5-1.8-9.3-5.4-12.9z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right .7em top 50%;
        background-size: .65em auto;
      }

      /* High Contrast Mode Overrides (applied via parent class if needed, but here we just ensure readability) */
      .goog-te-combo:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
          fetch(MENU_ITEMS_URL),
          fetch(ADDONS_ITEMS_URL)
        ]);

        if (!menuResponse.ok || !addOnsResponse.ok) throw new Error('Failed to fetch data');

        const menuData = await menuResponse.json();
        const addOnsData = await addOnsResponse.json();

        setMenuItems(menuData);
        setAddOns(addOnsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = [...new Set(menuItems.map(item => item.category))];

  const getAddOnsByCategory = (category) => addOns.filter(addon => addon.category === category);

  const calculateCustomizationPrice = () => {
    let total = 0;
    if (selectedAddOns.iceLevel) total += parseFloat(selectedAddOns.iceLevel.price);
    if (selectedAddOns.sweetnessLevel) total += parseFloat(selectedAddOns.sweetnessLevel.price);
    selectedAddOns.toppings.forEach(topping => total += parseFloat(topping.price));
    return total;
  };

  const addToCart = () => {
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(selectedDrink.base_price) + customizationPrice;

    setCart([...cart, {
      ...selectedDrink,
      cartId: Date.now(),
      customizations: { ...selectedAddOns },
      customizationPrice,
      totalPrice: totalPrice.toFixed(2)
    }]);

    setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
    setSelectedDrink(null);
    setCurrentView('drinks');
    // Simple feedback
    alert("Item added to cart!");
  };

  const removeFromCart = (cartId) => setCart(cart.filter(item => item.cartId !== cartId));

  const getTotalPrice = () => cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);

  const getCustomizationIDs = (cartItem) => {
    const ids = [];
    if (cartItem.customizations.iceLevel) ids.push(cartItem.customizations.iceLevel.id);
    if (cartItem.customizations.sweetnessLevel) ids.push(cartItem.customizations.sweetnessLevel.id);
    cartItem.customizations.toppings.forEach(topping => ids.push(topping.id));
    return ids;
  };

  const processPayment = async () => {
    setProcessingPayment(true);
    try {
      const itemsPayload = cart.map((cartItem) => ({
        menu_item: cartItem.id,
        quantity: 1,
        customizations: getCustomizationIDs(cartItem)
      }));

      const orderData = {
        payment_type: 'Card',
        customer: null,
        employee: null,
        items: itemsPayload
      };

      const response = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error: ${errorText}`);
      }

      const newOrder = await response.json();
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

  // --- Views ---

  let viewContent = null;

  if (currentView === 'welcome') {
    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3em', fontWeight: 'bold', color: theme.text, marginBottom: '0.5em' }}>
            Welcome
          </h1>
          <p style={{ fontSize: '1.5em', color: theme.textSecondary, marginBottom: '1.5em' }}>
            Tap to Start
          </p>
          <KioskButton
            onClick={() => setCurrentView('categories')}
            style={{ fontSize: '1.5em', padding: '1em 2em' }}
          >
            Start Order
          </KioskButton>
        </div>
      </div>
    );
  }

  if (currentView === 'categories') {
    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '1280px', width: '100%' }}>
          <h2 style={{ fontSize: '2.5em', fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: '1em' }}>
            Select a Category
          </h2>
          {loading && <p style={{ textAlign: 'center', fontSize: '1.5em', color: theme.text }}>Loading menu...</p>}
          {error && <p style={{ textAlign: 'center', fontSize: '1.5em', color: theme.danger }}>Error: {error}</p>}
          {!loading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', // Larger min width
              gap: '32px', // Larger gap
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
                    backgroundColor: theme.cardBg,
                    borderRadius: highContrast ? '0' : '16px',
                    border: theme.border,
                    padding: '32px',
                    boxShadow: theme.shadow,
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '300px',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '200px' // Ensure large target
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 16px',
                    background: highContrast ? '#000' : 'linear-gradient(to bottom right, #fde68a, #fb923c)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3em',
                    color: highContrast ? '#fff' : 'inherit'
                  }}>
                    🧋
                  </div>
                  <h3 style={{ fontSize: '1.25em', fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>
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

    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '32px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', paddingTop: '60px' }}>
          <KioskButton onClick={() => setCurrentView('categories')} style={{ marginBottom: '24px' }}>
            ← Previous
          </KioskButton>
          <h2 style={{ fontSize: '2em', fontWeight: 'bold', color: theme.text, marginBottom: '0.5em' }}>
            Category: {selectedCategory}
          </h2>
          <p style={{ fontSize: '1.2em', color: theme.textSecondary, marginBottom: '1.5em' }}>
            Tap a drink to customize
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px',
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
                  backgroundColor: theme.cardBg,
                  borderRadius: highContrast ? '0' : '16px',
                  border: theme.border,
                  padding: '24px',
                  boxShadow: theme.shadow,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '300px',
                  transition: 'transform 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 16px',
                  background: highContrast ? '#000' : 'linear-gradient(to bottom right, #fde68a, #fb923c)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5em'
                }}>
                  🥤
                </div>
                <h3 style={{ fontSize: '1.2em', fontWeight: 'bold', color: theme.text, marginBottom: '0.5em' }}>
                  {drink.name}
                </h3>
                <p style={{ fontSize: '1.25em', fontWeight: 'bold', color: theme.success }}>
                  ${parseFloat(drink.base_price).toFixed(2)}
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
    const totalPrice = parseFloat(selectedDrink.base_price) + customizationPrice;

    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '32px',
        paddingTop: '100px',
        overflowY: 'auto'
      }}>

        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <KioskButton onClick={() => {
            setSelectedDrink(null);
            setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
            setCurrentView('drinks');
          }} style={{ marginBottom: '24px' }}>
            ← Previous
          </KioskButton>

          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: highContrast ? '0' : '16px',
            border: theme.border,
            padding: '24px',
            marginBottom: '24px',
            boxShadow: theme.shadow
          }}>
            <h2 style={{ fontSize: '2em', fontWeight: 'bold', color: theme.text, marginBottom: '0.5em' }}>
              {selectedDrink.name}
            </h2>
            <p style={{ fontSize: '1.2em', color: theme.primary, marginBottom: '1em' }}>
              Base Price: ${parseFloat(selectedDrink.base_price).toFixed(2)}
            </p>
          </div>

          {/* Ice Level */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: highContrast ? '0' : '16px',
            border: theme.border,
            padding: '24px',
            marginBottom: '24px',
            boxShadow: theme.shadow
          }}>
            <h3 style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text, marginBottom: '1em' }}>
              Ice Level
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              {iceLevels.map((ice) => (
                <KioskButton
                  key={ice.id}
                  onClick={() => setSelectedAddOns({ ...selectedAddOns, iceLevel: ice })}
                  variant={selectedAddOns.iceLevel?.id === ice.id ? 'primary' : 'secondary'}
                >
                  {ice.name}
                </KioskButton>
              ))}
            </div>
          </div>

          {/* Sweetness Level */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: highContrast ? '0' : '16px',
            border: theme.border,
            padding: '24px',
            marginBottom: '24px',
            boxShadow: theme.shadow
          }}>
            <h3 style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text, marginBottom: '1em' }}>
              Sweetness Level
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {sweetnessLevels.map((sweet) => (
                <KioskButton
                  key={sweet.id}
                  onClick={() => setSelectedAddOns({ ...selectedAddOns, sweetnessLevel: sweet })}
                  variant={selectedAddOns.sweetnessLevel?.id === sweet.id ? 'primary' : 'secondary'}
                >
                  {sweet.name}
                </KioskButton>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: highContrast ? '0' : '16px',
            border: theme.border,
            padding: '24px',
            marginBottom: '24px',
            boxShadow: theme.shadow
          }}>
            <h3 style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text, marginBottom: '1em' }}>
              Toppings (Optional)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {toppings.map((topping) => {
                const isSelected = selectedAddOns.toppings.some(t => t.id === topping.id);
                return (
                  <KioskButton
                    key={topping.id}
                    onClick={() => toggleTopping(topping)}
                    variant={isSelected ? 'primary' : 'secondary'}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}
                  >
                    <div>{topping.name}</div>
                    <div style={{ fontSize: '0.8em', opacity: 0.9 }}>
                      +${parseFloat(topping.price).toFixed(2)}
                    </div>
                  </KioskButton>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div style={{
            backgroundColor: theme.cardBg,
            borderRadius: highContrast ? '0' : '16px',
            border: theme.border,
            padding: '24px',
            boxShadow: theme.shadow
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text }}>Total:</span>
              <span style={{ fontSize: '2em', fontWeight: 'bold', color: theme.success }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <KioskButton
              onClick={addToCart}
              disabled={!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel}
              variant="success"
              style={{ width: '100%', fontSize: '1.5em', padding: '1em' }}
            >
              Add to Cart
            </KioskButton>
            {(!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) && (
              <p style={{ textAlign: 'center', color: theme.danger, fontSize: '1em', marginTop: '1em' }}>
                Please select ice level and sweetness level
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'checkout') {
    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '32px',
        paddingTop: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h2 style={{ fontSize: '3em', fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: '1em' }}>
            Checkout
          </h2>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5em', color: theme.textSecondary, marginBottom: '2em' }}>
                Your cart is empty
              </p>
              <KioskButton onClick={() => setCurrentView('categories')}>
                Add Items
              </KioskButton>
            </div>
          ) : (
            <>
              <div style={{
                backgroundColor: theme.cardBg,
                borderRadius: highContrast ? '0' : '16px',
                border: theme.border,
                padding: '24px',
                boxShadow: theme.shadow,
                marginBottom: '32px'
              }}>
                {cart.map((item) => (
                  <div key={item.cartId} style={{
                    padding: '16px 0',
                    borderBottom: highContrast ? '1px solid #000' : '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.25em', fontWeight: 'bold', color: theme.text }}>
                          {item.name}
                        </h3>
                        <p style={{ fontSize: '1em', color: theme.primary, marginTop: '4px' }}>
                          {item.category}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <p style={{ fontSize: '1.25em', fontWeight: 'bold', color: theme.success }}>
                          ${item.totalPrice}
                        </p>
                        <KioskButton
                          onClick={() => removeFromCart(item.cartId)}
                          variant="danger"
                          style={{ fontSize: '0.9em', padding: '0.5em 1em' }}
                        >
                          Remove
                        </KioskButton>
                      </div>
                    </div>
                    <div style={{ fontSize: '1em', color: theme.textSecondary, marginLeft: '8px' }}>
                      {item.customizations.iceLevel && <div>• Ice: {item.customizations.iceLevel.name}</div>}
                      {item.customizations.sweetnessLevel && <div>• Sweetness: {item.customizations.sweetnessLevel.name}</div>}
                      {item.customizations.toppings.length > 0 && (
                        <div>• Toppings: {item.customizations.toppings.map(t => t.name).join(', ')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: highContrast ? '2px solid #000' : '2px solid #fbbf24'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text }}>
                    Total:
                  </span>
                  <span style={{ fontSize: '2em', fontWeight: 'bold', color: theme.success }}>
                    ${getTotalPrice()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
                <KioskButton onClick={() => setCurrentView('categories')} variant="secondary">
                  Add More
                </KioskButton>
                <KioskButton
                  onClick={processPayment}
                  disabled={processingPayment}
                  variant="success"
                >
                  {processingPayment ? 'Processing...' : 'Pay Now'}
                </KioskButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <AccessibilityControls />

      <div
        id="google_translate_element"
        style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: theme.cardBg,
          padding: '8px',
          borderRadius: '8px',
          border: theme.border,
          boxShadow: theme.shadow
        }}
      />

      {currentView !== 'welcome' && (
        <button
          onClick={onBack}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            backgroundColor: theme.danger,
            color: 'white',
            borderRadius: '8px',
            padding: '12px 20px',
            boxShadow: theme.shadow,
            border: theme.border,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 50,
            fontSize: '1em',
            fontWeight: 'bold'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      )}

      {currentView !== 'welcome' && currentView !== 'checkout' && (
        <button
          onClick={() => setCurrentView('checkout')}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: theme.primary,
            color: theme.primaryText,
            borderRadius: '50%',
            padding: '16px',
            boxShadow: theme.shadow,
            border: theme.border,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 50,
            fontSize: '1em',
            fontWeight: 'bold'
          }}
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span style={{
              backgroundColor: theme.danger,
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8em',
              fontWeight: 'bold',
              position: 'absolute',
              top: '-5px',
              right: '-5px'
            }}>
              {cart.length}
            </span>
          )}
        </button>
      )}

      {viewContent}
    </>
  );
}

function BobaKiosk(props) {
  return (
    <AccessibilityProvider>
      <BobaKioskContent {...props} />
    </AccessibilityProvider>
  );
}

export default BobaKiosk;