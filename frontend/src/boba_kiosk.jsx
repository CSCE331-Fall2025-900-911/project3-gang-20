/*
  File: boba_kiosk.jsx
  Description: The self-service kiosk application for customers.
  Features a high-contrast accessibility mode, multi-language support via Google Translate,
  and a complete ordering flow from menu selection to payment.
*/

import { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, LogOut, Type, Sun, Moon, Minus, Plus, Volume2, VolumeX } from 'lucide-react';

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
    danger: '#000000',
    success: '#000000',
    border: '4px solid #000000',
    shadow: 'none',
  }
};

/*
  Provider for global accessibility settings.
  Manages font size scaling and high contrast mode preferences, persisting them to localStorage.
*/
function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => parseFloat(localStorage.getItem('kioskFontSize')) || 1.0);
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('kioskHighContrast') === 'true');
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('kioskTtsEnabled') === 'true');
  
  // New: Store available voices
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    localStorage.setItem('kioskFontSize', fontSize);
    localStorage.setItem('kioskHighContrast', highContrast);
    localStorage.setItem('kioskTtsEnabled', ttsEnabled);
  }, [fontSize, highContrast, ttsEnabled]);

  // --- 1. Load Voices Properly ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
  
    // Retry loading voices for 1 second
    let intervalId = setInterval(() => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        clearInterval(intervalId);
      }
    }, 200);
  
    window.speechSynthesis.onvoiceschanged = loadVoices;
  
    return () => clearInterval(intervalId);
  }, []);
  

  const [ttsReady, setTtsReady] = useState(false);

  useEffect(() => {
    const enableAudio = () => setTtsReady(true);
    window.addEventListener("click", enableAudio, { once: true });
  }, []);


  // --- 2. TTS Logic (Fixed Dependencies) ---
  useEffect(() => {
    if (!ttsEnabled || !ttsReady) return;

    let timer;

    const handleMouseOver = (e) => {
      clearTimeout(timer);

      const target = e.target;
      
      // 1. Filter containers
      if (target.childElementCount > 3) return;

      // 2. Get text
      let textToRead = target.getAttribute('aria-label') || target.innerText;

      // 3. Clean text
      if (!textToRead) return;
      textToRead = textToRead.replace(/\s+/g, ' ').trim();
      if (textToRead.length === 0) return;

      // 4. Tag check
      const relevantTags = ['BUTTON', 'H1', 'H2', 'H3', 'P', 'SPAN', 'A', 'LI', 'DIV'];
      if (!relevantTags.includes(target.tagName)) return;
      
      // 5. Length check
      if (target.tagName === 'DIV' && textToRead.length > 60) return;

      timer = setTimeout(() => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToRead);

        if (availableVoices.length > 0) {
          const preferredVoice =
            availableVoices.find(v => v.lang.includes('en-US')) ||
            availableVoices.find(v => v.lang.includes('en'));
          if (preferredVoice) utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.volume = 1.0;

        // Prevent Garbage Collection bug
        window.utteranceReference = utterance;
        utterance.onend = () => { window.utteranceReference = null; };

        window.speechSynthesis.speak(utterance);
      }, 400);
    };

    const handleMouseLeave = () => {
      clearTimeout(timer);
      // We do not cancel here to prevent audio cutting out too aggressively
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseLeave);
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  // FIX: Watch .length instead of the array object to prevent dependency size errors
  }, [ttsEnabled, ttsReady, availableVoices.length]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 0.25, 1.5));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 0.25, 1.0));
  const toggleContrast = () => setHighContrast(prev => !prev);
  const toggleTts = () => setTtsEnabled(prev => !prev);

  const theme = highContrast ? THEMES.highContrast : THEMES.normal;

  return (
    <AccessibilityContext.Provider value={{
      fontSize, highContrast, theme, ttsEnabled,
      increaseFontSize, decreaseFontSize, toggleContrast, toggleTts
    }}>
      <div style={{ fontSize: `${fontSize}rem`, lineHeight: 1.5, transition: 'all 0.2s ease' }}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

function useAccessibility() {
  return useContext(AccessibilityContext);
}

// --- Reusable Components ---

/*
  Accessible button component with theme support.
  Automatically adjusts padding based on font size and handles high contrast styling.
*/
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
        padding: `${1 * fontSize}rem ${2 * fontSize}rem`,
        borderRadius: highContrast ? '0' : '16px',
        fontSize: '1em',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: theme.shadow,
        minWidth: '44px',
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
  const { 
    fontSize, 
    increaseFontSize, 
    decreaseFontSize, 
    toggleContrast, 
    highContrast, 
    theme,
    toggleTts,     // Get new function
    ttsEnabled     // Get new state
  } = useAccessibility();

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

      {/* --- NEW SPEECH BUTTON --- */}
      <KioskButton 
        onClick={toggleTts} 
        aria-label={ttsEnabled ? "Disable Text to Speech" : "Enable Text to Speech"} 
        variant={ttsEnabled ? 'primary' : 'secondary'} 
        style={{ padding: '8px' }}
      >
        {ttsEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        <span>{ttsEnabled ? 'Speech On' : 'Speech Off'}</span>
      </KioskButton>
    </div>
  );
}

// --- Main App Logic ---

const MENU_ITEMS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/menu-items/';
const ADDONS_ITEMS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customization-options/';
const ORDERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/orders/';

const TAX_RATE = 0.0825; // 8.25% sales tax
const SERVICE_CHARGE_RATE = 0.025; // 2.5% service charge for card payments

// Helper to format recipe ingredients for display
const getDrinkDescription = (drink) => {
  if (!drink.recipe || drink.recipe.length === 0) {
    return 'A delicious drink made fresh for you.';
  }

  const formattedIngredients = drink.recipe
    .map(item => item.ingredient)
    .filter(name => {
      const lower = name.toLowerCase();
      // Filter out inventory items that aren't edible ingredients
      return !lower.includes('cup') &&
        !lower.includes('lid') &&
        !lower.includes('straw') &&
        !lower.includes('seal') &&
        !lower.includes('napkin');
    })
    .map(name => {
      // Replace underscores with spaces and Title Case the words
      return name.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });

  if (formattedIngredients.length === 0) {
    return 'A delicious drink made fresh for you.';
  }

  return formattedIngredients.join(', ');
};

/*
  Main Content Component for the Kiosk.
  Handles the entire ordering flow: Welcome -> Categories -> Customization -> Checkout -> Payment.
*/
function BobaKioskContent({ onBack }) {
  const { theme, highContrast } = useAccessibility();

  // Initialize Google Translate
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.VERTICAL },
          'google_translate_element'
        );
      }
    };

    if (!document.querySelector('#google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }

    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame { display: none !important; }
      body { top: 0px !important; }

      #google_translate_element {
        overflow: hidden;
      }

      .goog-te-gadget-icon { display: none !important; }
      .goog-te-gadget-simple { background-color: transparent !important; border: none !important; padding: 0 !important; }
      .goog-te-gadget span { display: none !important; }
      .goog-te-gadget { color: transparent !important; font-size: 0 !important; }

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
        appearance: none;
        -webkit-appearance: none;
        padding-right: 30px;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23d97706%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2082.2c3.6-3.6%205.4-7.8%205.4-12.8%200-5-1.8-9.3-5.4-12.9z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right .7em top 50%;
        background-size: .65em auto;
      }

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
  const [activeFilter, setActiveFilter] = useState('All'); // New filter state
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
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);

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
    setCurrentView('checkout');
  };

  const removeFromCart = (cartId) => setCart(cart.filter(item => item.cartId !== cartId));

  const getSubtotal = () => cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

  const getServiceCharge = () => {
    if (selectedPaymentType === 'Card') {
      return getSubtotal() * SERVICE_CHARGE_RATE;
    }
    return 0.0;
  };

  const getTax = () => (getSubtotal() + getServiceCharge()) * TAX_RATE;

  const getTotal = () => getSubtotal() + getServiceCharge() + getTax();

  const getTotalPrice = () => getTotal().toFixed(2);

  const getCustomizationIDs = (cartItem) => {
    const ids = [];
    if (cartItem.customizations.iceLevel) ids.push(cartItem.customizations.iceLevel.id);
    if (cartItem.customizations.sweetnessLevel) ids.push(cartItem.customizations.sweetnessLevel.id);
    cartItem.customizations.toppings.forEach(topping => ids.push(topping.id));
    return ids;
  };

  const processPayment = async () => {
    if (!selectedPaymentType) {
      alert('Please select a payment method (Cash or Card)');
      return;
    }

    setProcessingPayment(true);
    try {
      const itemsPayload = cart.map((cartItem) => ({
        menu_item: cartItem.id,
        quantity: 1,
        customizations: getCustomizationIDs(cartItem)
      }));

      const orderData = {
        payment_type: selectedPaymentType,
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
      const finalTotal = getTotal();
      setCart([]);
      setSelectedPaymentType(null);
      alert(`Order #${newOrder.id || 'placed'} successfully! Total: $${finalTotal.toFixed(2)}`);
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

  // Combined Categories & Drinks View (Simplified Flow)
  if (currentView === 'categories' || currentView === 'drinks') {
    // Dynamic categories from menu items
    const allCategories = ['All', ...new Set(menuItems.map(item => item.category))];

    // Filter logic
    const filteredItems = menuItems.filter(item => {
      if (activeFilter === 'All') return true;
      return item.category === activeFilter;
    });

    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '32px',
        paddingTop: '150px' // Increased space for fixed header/buttons
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>

          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
            overflowX: 'auto',
            paddingBottom: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap' // Allow wrapping if many categories
          }}>
            {allCategories.map(filter => (
              <KioskButton
                key={filter}
                onClick={() => setActiveFilter(filter)}
                variant={activeFilter === filter ? 'primary' : 'secondary'}
                style={{ minWidth: '120px' }}
              >
                {filter}
              </KioskButton>
            ))}
          </div>

          {loading && <p style={{ textAlign: 'center', fontSize: '1.5em', color: theme.text }}>Loading menu...</p>}
          {error && <p style={{ textAlign: 'center', fontSize: '1.5em', color: theme.danger }}>Error: {error}</p>}

          {!loading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', // 3 items per row
              gap: '32px',
              width: '100%',
              justifyItems: 'center'
            }}>
              {filteredItems.map((drink) => (
                <button
                  key={drink.menu_item_id}
                  onClick={() => {
                    setSelectedDrink(drink);
                    setCurrentView('customize');
                  }}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: highContrast ? '0' : '24px',
                    border: theme.border,
                    padding: '24px',
                    boxShadow: theme.shadow,
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '350px',
                    transition: 'transform 0.2s',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    minHeight: '320px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* Image Section */}
                  <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: highContrast ? '0' : '12px',
                    overflow: 'hidden',
                    backgroundColor: highContrast ? '#f0f0f0' : '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: highContrast ? '2px solid #000' : 'none'
                  }}>
                    {drink.image ? (
                      <img
                        src={drink.image.startsWith('data:') ? drink.image : `data:image/jpeg;base64,${drink.image}`}
                        alt={drink.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: ${theme.textSecondary}; font-size: 3em;">🧋</div>`;
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: theme.textSecondary,
                        fontSize: '3em'
                      }}>
                        🧋
                      </div>
                    )}
                  </div>

                  {/* Name and Price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25em', fontWeight: 'bold', color: theme.text, lineHeight: '1.2', flex: 1 }}>
                      {drink.name}
                    </h3>
                    <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: theme.primary, whiteSpace: 'nowrap' }}>
                      ${parseFloat(drink.base_price).toFixed(2)}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.9em', color: theme.textSecondary, lineHeight: '1.4', margin: 0 }}>
                    {getDrinkDescription(drink)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Removed separate 'drinks' view as it's now merged with categories/filters


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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <KioskButton onClick={() => {
              setSelectedDrink(null);
              setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
              setCurrentView('categories');
            }}>
              ← Back to Menu
            </KioskButton>

            {cart.length > 0 && (
              <KioskButton onClick={() => setCurrentView('checkout')} variant="secondary">
                Go to Cart ({cart.length}) →
              </KioskButton>
            )}
          </div>

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
              <p style={{ textAlign: 'center', color: theme.danger, fontSize: '1.2em', marginTop: '1em', fontWeight: 'bold' }}>
                ⚠ Please select Ice Level and Sweetness Level
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.success }}>
                          ${item.totalPrice}
                        </p>
                        <KioskButton
                          onClick={() => removeFromCart(item.cartId)}
                          variant="danger"
                          style={{ fontSize: '1em', padding: '0.8em 1.5em', minHeight: '50px' }}
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
                <div style={{ marginBottom: '16px', fontSize: '1.2em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: theme.text }}>Subtotal:</span>
                    <span style={{ color: theme.text, fontWeight: 'bold' }}>
                      ${getSubtotal().toFixed(2)}
                    </span>
                  </div>
                  {selectedPaymentType === 'Card' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: theme.primary }}>
                      <span>Service Charge ({(SERVICE_CHARGE_RATE * 100).toFixed(1)}%):</span>
                      <span style={{ fontWeight: 'bold' }}>
                        ${getServiceCharge().toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: theme.text }}>Tax ({(TAX_RATE * 100).toFixed(2)}%):</span>
                    <span style={{ color: theme.text, fontWeight: 'bold' }}>
                      ${getTax().toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${theme.primary}`, paddingTop: '16px' }}>
                  <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text }}>
                    Total:
                  </span>
                  <span style={{ fontSize: '2em', fontWeight: 'bold', color: theme.success }}>
                    ${getTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
                <KioskButton
                  onClick={() => setSelectedPaymentType('Cash')}
                  variant={selectedPaymentType === 'Cash' ? 'primary' : 'secondary'}
                  style={{ fontSize: '1.2em', padding: '1em 2em' }}
                >
                  💵 Cash
                </KioskButton>
                <KioskButton
                  onClick={() => setSelectedPaymentType('Card')}
                  variant={selectedPaymentType === 'Card' ? 'primary' : 'secondary'}
                  style={{ fontSize: '1.2em', padding: '1em 2em' }}
                >
                  💳 Card
                </KioskButton>
              </div>

              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '24px' }}>
                <KioskButton onClick={() => setCurrentView('categories')} variant="secondary" style={{ fontSize: '1.2em', padding: '1em 2em' }}>
                  ← Add More Items
                </KioskButton>
                <KioskButton
                  onClick={processPayment}
                  disabled={processingPayment || !selectedPaymentType}
                  variant="success"
                  style={{ fontSize: '1.2em', padding: '1em 2em' }}
                >
                  {processingPayment ? 'Processing...' : 'Complete Payment'}
                </KioskButton>
              </div>

              {!selectedPaymentType && (
                <p style={{ textAlign: 'center', color: theme.danger, fontSize: '1.1em', marginTop: '1em', fontWeight: 'bold' }}>
                  ⚠ Please select a payment method
                </p>
              )}
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
          bottom: '24px', // Moved to bottom
          left: '24px',   // Moved to left to balance UI
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
            top: '24px',
            left: '24px',
            backgroundColor: theme.danger,
            color: 'white',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: theme.shadow,
            border: theme.border,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 50,
            fontSize: '1.1em',
            fontWeight: 'bold'
          }}
        >
          <LogOut size={24} />
          Logout
        </button>
      )}

      {currentView !== 'welcome' && currentView !== 'checkout' && (
        <button
          onClick={() => setCurrentView('checkout')}
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: theme.primary,
            color: theme.primaryText,
            borderRadius: '50px', // Pill shape
            padding: '16px 32px',
            boxShadow: theme.shadow,
            border: theme.border,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 50,
            fontSize: '1.1em',
            fontWeight: 'bold'
          }}
        >
          <ShoppingCart size={24} />
          Cart
          {cart.length > 0 && (
            <span style={{
              backgroundColor: 'white',
              color: theme.primary,
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9em',
              fontWeight: 'bold',
              marginLeft: '8px'
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

/*
  Root Kiosk Component.
  Wraps the content in the AccessibilityProvider to ensure global access to theme settings.
*/
function BobaKiosk(props) {
  return (
    <AccessibilityProvider>
      <BobaKioskContent {...props} />
    </AccessibilityProvider>
  );
}

export default BobaKiosk;