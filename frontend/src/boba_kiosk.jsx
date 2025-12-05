/*
  File: boba_kiosk.jsx
  Description: The self-service kiosk application for customers.
  Features a high-contrast accessibility mode, multi-language support via Google Translate,
  a complete ordering flow, cart editing, and a "Mystery Drink" gamification mode.
*/

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { ShoppingCart, LogOut, Type, Sun, Moon, Minus, Plus, Volume2, VolumeX, Star, Gift, Dice6, RotateCcw, Check, Lock, ArrowLeft, Pencil } from 'lucide-react'; 
import { useUser } from '@clerk/clerk-react';

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
  
  // Store available voices for TTS
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    localStorage.setItem('kioskFontSize', fontSize);
    localStorage.setItem('kioskHighContrast', highContrast);
    localStorage.setItem('kioskTtsEnabled', ttsEnabled);
  }, [fontSize, highContrast, ttsEnabled]);

  // Load browser voices asynchronously
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
  
    // Retry loading voices for 1 second to handle browser race conditions
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

  // Initialize audio context on first user interaction
  useEffect(() => {
    const enableAudio = () => setTtsReady(true);
    window.addEventListener("click", enableAudio, { once: true });
  }, []);

  // Text-to-Speech Hover Logic
  useEffect(() => {
    if (!ttsEnabled || !ttsReady) return;

    let timer;

    const handleMouseOver = (e) => {
      clearTimeout(timer);

      const target = e.target;
      
      // Filter out complex containers to avoid reading entire blocks
      if (target.childElementCount > 3) return;

      // Determine text to read
      let textToRead = target.getAttribute('aria-label') || target.innerText;

      // Clean text
      if (!textToRead) return;
      textToRead = textToRead.replace(/\s+/g, ' ').trim();
      if (textToRead.length === 0) return;

      // Only read specific interactive or text tags
      const relevantTags = ['BUTTON', 'H1', 'H2', 'H3', 'P', 'SPAN', 'A', 'LI', 'DIV'];
      if (!relevantTags.includes(target.tagName)) return;
      
      // Prevent reading long paragraphs on hover
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

        // Prevent Garbage Collection bug in some browsers
        window.utteranceReference = utterance;
        utterance.onend = () => { window.utteranceReference = null; };

        window.speechSynthesis.speak(utterance);
      }, 400);
    };

    const handleMouseLeave = () => {
      clearTimeout(timer);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseLeave);
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
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
    toggleTts,
    ttsEnabled
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


const MENU_ITEMS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/menu-items/';
const ADDONS_ITEMS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customization-options/';
const ORDERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/orders/';
const CUSTOMERS_URL = 'https://project3-gang-20-810838872032.us-south1.run.app/api/customers/';

const TAX_RATE = 0.0825; // 8.25% sales tax
const SERVICE_CHARGE_RATE = 0.025; // 2.5% service charge for card payments
const POINTS_RATE = 10; // 10 points per $1
const MYSTERY_PRICE = 3.99; // Fixed price for mystery drinks
const REROLL_COST = 2.00; // Cost to re-roll

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
  CUSTOM HOOK: useBobaOrdering
  Manages all complex ordering state and logic, centralizing the bulk of the component's hooks
  to fix the "Rules of Hooks" violation in the parent component.
*/
function useBobaOrdering(dbCustomer, setDbCustomer) {
  const [currentView, setCurrentView] = useState('welcome');
  const [menuItems, setMenuItems] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
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
  
  // State for selected point redemption
  const [selectedRedemption, setSelectedRedemption] = useState(null); 

  // State to track which item is currently being edited
  const [editingCartItem, setEditingCartItem] = useState(null);

  // Constants for redemption options
  const REDEMPTION_OPTIONS = [
    { points: 500, label: 'Free Drink', description: 'Any one drink free', value: 'free_drink' },
    { points: 750, label: 'Free Drink + Free Toppings', description: 'Any one drink free, and all toppings free', value: 'free_drink_and_toppings' },
  ];

  // Data Fetching Effect (Moved from BobaKioskContent)
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
  }, []); // Only runs on mount

  const categories = [...new Set(menuItems.map(item => item.category))];

  const getAddOnsByCategory = (category) => addOns.filter(addon => addon.category === category);

  const calculateCustomizationPrice = () => {
    let total = 0;
    if (selectedAddOns.iceLevel) total += parseFloat(selectedAddOns.iceLevel.price);
    if (selectedAddOns.sweetnessLevel) total += parseFloat(selectedAddOns.sweetnessLevel.price);
    selectedAddOns.toppings.forEach(topping => total += parseFloat(topping.price));
    return total;
  };

  const addToCart = (drink) => {
    const customizationPrice = calculateCustomizationPrice();
    const totalPrice = parseFloat(drink.base_price) + customizationPrice;

    setCart([...cart, {
      ...drink,
      cartId: Date.now(),
      customizations: { ...selectedAddOns },
      customizationPrice,
      totalPrice: totalPrice.toFixed(2)
    }]);

    setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
    setSelectedDrink(null);
    setCurrentView('checkout');
    setSelectedRedemption(null); // Reset redemption when adding new items
  };

  // Prepares the state for editing an existing cart item
  const startEditing = (cartItem) => {
    setEditingCartItem(cartItem);
    setSelectedDrink(cartItem); // Cart items contain the drink data
    setSelectedAddOns(cartItem.customizations); // Pre-fill selections
    setCurrentView('customize'); // Redirect to customization screen
    setSelectedRedemption(null); // Reset redemption to ensure price recalc is correct
  };

  // Commits the changes made to the editingCartItem back to the cart array
  const saveCartChanges = () => {
    if (!editingCartItem) return;

    const customizationPrice = calculateCustomizationPrice();
    // Use the base_price stored on the item (important for Mystery items to keep their special price)
    const totalPrice = parseFloat(editingCartItem.base_price) + customizationPrice;

    setCart(prevCart => prevCart.map(item => {
      if (item.cartId === editingCartItem.cartId) {
        return {
          ...item,
          customizations: { ...selectedAddOns },
          customizationPrice,
          totalPrice: totalPrice.toFixed(2)
        };
      }
      return item;
    }));

    // Cleanup and reset state
    setEditingCartItem(null);
    setSelectedDrink(null);
    setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
    setCurrentView('checkout');
  };

  const cancelEdit = () => {
    setEditingCartItem(null);
    setSelectedDrink(null);
    setSelectedAddOns({ iceLevel: null, sweetnessLevel: null, toppings: [] });
    setCurrentView('checkout');
  };

  // Add Mystery Item to Cart with DYNAMIC cost (base + rerolls)
  const addMysteryToCart = (drink, extraCost = 0) => {
    const finalPrice = MYSTERY_PRICE + extraCost;

    const mysteryItem = {
      ...drink,
      name: `🎲 ${drink.name}`, // Add icon to indicate mystery
      cartId: Date.now(),
      base_price: finalPrice, // Override database price with Gamified Price
      customizations: { iceLevel: null, sweetnessLevel: null, toppings: [] }, // Defaults (none)
      customizationPrice: 0,
      totalPrice: finalPrice.toFixed(2)
    };
    
    setCart([...cart, mysteryItem]);
    setCurrentView('checkout');
    setSelectedRedemption(null);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
    setSelectedRedemption(null); // Reset redemption if items are removed
  }

  // Calculate the discount based on selected redemption
  const getDiscount = () => {
    if (!selectedRedemption || cart.length === 0) return 0;

    // We apply the discount to the most expensive item in the cart.
    const sortedCart = [...cart].sort((a, b) => parseFloat(b.totalPrice) - parseFloat(a.totalPrice));
    const mostExpensiveItem = sortedCart[0];

    let discountAmount = 0;

    if (selectedRedemption.value === 'free_drink' || selectedRedemption.value === 'free_drink_and_toppings') {
        // Discount the item's base price + ice/sweetness level cost
        discountAmount += parseFloat(mostExpensiveItem.base_price) + (
            mostExpensiveItem.customizations.iceLevel ? parseFloat(mostExpensiveItem.customizations.iceLevel.price) : 0
        ) + (
            mostExpensiveItem.customizations.sweetnessLevel ? parseFloat(mostExpensiveItem.customizations.sweetnessLevel.price) : 0
        );
        
        // If 750 points, also discount toppings price of that item
        if (selectedRedemption.value === 'free_drink_and_toppings') {
            const toppingPrice = mostExpensiveItem.customizations.toppings.reduce((sum, topping) => sum + parseFloat(topping.price), 0);
            discountAmount += toppingPrice;
        }
    }

    // Discount cannot exceed the price of the item
    return Math.min(discountAmount, parseFloat(mostExpensiveItem.totalPrice));
  };

  const getSubtotal = () => {
    let subtotal = cart.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    subtotal -= getDiscount(); // Apply discount
    return Math.max(0, subtotal); // Subtotal cannot be negative
  };

  const getServiceCharge = () => {
    if (selectedPaymentType === 'Card') {
      return getSubtotal() * SERVICE_CHARGE_RATE;
    }
    return 0.0;
  };

  const getTax = () => (getSubtotal() + getServiceCharge()) * TAX_RATE;

  const getTotal = () => getSubtotal() + getServiceCharge() + getTax();

  const getCustomizationIDs = (cartItem) => {
    const ids = [];
    if (cartItem.customizations.iceLevel) ids.push(cartItem.customizations.iceLevel.id);
    if (cartItem.customizations.sweetnessLevel) ids.push(cartItem.customizations.sweetnessLevel.id);
    cartItem.customizations.toppings.forEach(topping => ids.push(topping.id));
    return ids;
  };

  // Calculate points earned based on total
  const getPointsToEarn = () => {
    // Points are earned on the discounted total
    return Math.floor(getSubtotal() * POINTS_RATE);
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
        customer: dbCustomer ? dbCustomer.id : null, 
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
      
      let pointsEarned = 0;
      let pointsDeducted = 0;
      let successMsg = `Order #${newOrder.id || 'placed'} successfully! Total: $${finalTotal.toFixed(2)}`;

      if (dbCustomer) {
        let newPointsTotal = dbCustomer.points || 0;
        
        if (selectedRedemption) {
            // deduct points on redemption
            pointsDeducted = selectedRedemption.points;
            newPointsTotal -= pointsDeducted;
            successMsg += `\n\n${selectedRedemption.label} applied! ${pointsDeducted} points redeemed.`;
        } else {
            // earn points (if no points were redeemed)
            pointsEarned = getPointsToEarn();
            newPointsTotal += pointsEarned;
            if (pointsEarned > 0) {
              successMsg += `\n\n🎉 You earned ${pointsEarned} points!`;
            }
        }

        // Update customer points in DB
        const updateResponse = await fetch(`${CUSTOMERS_URL}${dbCustomer.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: newPointsTotal })
        });

        if (updateResponse.ok) {
          const updatedCustomer = await updateResponse.json();
          // Update the local state so the UI shows the new total immediately
          setDbCustomer(updatedCustomer); 
          console.log(`Points successfully updated! New Total: ${newPointsTotal}`);
        } else {
          console.error("Failed to update points via API");
        }
      }

      setCart([]);
      setSelectedPaymentType(null);
      setSelectedRedemption(null); // Clear redemption state
      
      alert(successMsg);
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

  return {
    editingCartItem, startEditing, saveCartChanges, cancelEdit,
    currentView, setCurrentView,
    menuItems, addOns, categories, activeFilter, setActiveFilter,
    selectedCategory, setSelectedCategory,
    selectedDrink, setSelectedDrink,
    selectedAddOns, setSelectedAddOns,
    cart, removeFromCart, addToCart, addMysteryToCart,
    loading, error,
    processingPayment,
    selectedPaymentType, setSelectedPaymentType,
    REDEMPTION_OPTIONS, selectedRedemption, setSelectedRedemption, getDiscount, 

    getAddOnsByCategory, calculateCustomizationPrice,
    getSubtotal, getServiceCharge, getTax, getTotal, getPointsToEarn,
    processPayment, toggleTopping
  }
}

// --- Main App Logic ---

/*
  Main Content Component for the Kiosk.
  Handles the entire ordering flow: Welcome -> Categories -> Customization -> Checkout -> Payment.
*/
function BobaKioskContent({ onBack }) {
  const { theme, highContrast } = useAccessibility();

  const { user, isSignedIn } = useUser();
  const [dbCustomer, setDbCustomer] = useState(null);

  // Use the new custom hook to get all ordering state and logic
  const {
    editingCartItem, startEditing, saveCartChanges, cancelEdit,
    currentView, setCurrentView,
    menuItems, addOns, categories, activeFilter, setActiveFilter,
    selectedDrink, setSelectedDrink,
    selectedAddOns, setSelectedAddOns,
    cart, removeFromCart, addToCart, addMysteryToCart,
    loading, error,
    processingPayment,
    selectedPaymentType, setSelectedPaymentType,
    // Loyalty Redemption Destructure
    REDEMPTION_OPTIONS, selectedRedemption, setSelectedRedemption, getDiscount,

    getAddOnsByCategory, calculateCustomizationPrice,
    getSubtotal, getServiceCharge, getTax, getTotal, getPointsToEarn,
    processPayment, toggleTopping
  } = useBobaOrdering(dbCustomer, setDbCustomer);

  // Mystery Mode State
  const [mysteryCategory, setMysteryCategory] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [mysteryResult, setMysteryResult] = useState(null);
  const [displayItem, setDisplayItem] = useState(null); 
  const [rerollCount, setRerollCount] = useState(0); // Track number of re-rolls

  useEffect(() => {
      const fetchCustomer = async () => {
          if (isSignedIn && user) {
              try {
                  const response = await fetch(CUSTOMERS_URL);
                  const customers = await response.json();
                  
                  const foundCustomer = customers.find(c => 
                    c.email && 
                    user.primaryEmailAddress?.emailAddress && 
                    c.email.toLowerCase() === user.primaryEmailAddress.emailAddress.toLowerCase()
                  );
                  
                  if (foundCustomer) {
                      setDbCustomer(foundCustomer);
                      console.log("Customer Matched:", foundCustomer);
                  }
              } catch (err) {
                  console.error("Error fetching customer:", err);
              }
          }
      };
      fetchCustomer();
  }, [isSignedIn, user]);


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

  // --- Mystery Game Logic ---
  const handleMysteryRoll = () => {
    if (!mysteryCategory) return;
    
    // If a result already exists, this is a re-roll. Increase cost count.
    if (mysteryResult) {
        setRerollCount(prev => prev + 1);
    }
    
    setIsRolling(true);
    setMysteryResult(null);

    // Filter items by category
    const candidates = menuItems.filter(item => item.category === mysteryCategory);
    if (candidates.length === 0) {
      alert("No drinks found in this category!");
      setIsRolling(false);
      return;
    }

    // Determine the winner immediately
    const winnerIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[winnerIndex];

    // Animation variables
    let iteration = 0;
    const maxIterations = 25; // How many times it flips
    let delay = 50; // Initial speed (ms)
    
    const animate = () => {
      // Pick a random item just for visual display
      const randomIndex = Math.floor(Math.random() * candidates.length);
      setDisplayItem(candidates[randomIndex]);

      iteration++;

      if (iteration < maxIterations) {
        // Slow down logic: Increase delay as we get closer to the end
        if (iteration > maxIterations - 8) {
          delay += 40;
        } else if (iteration > maxIterations - 15) {
          delay += 10;
        }
        setTimeout(animate, delay);
      } else {
        // Final state: Show the actual winner
        setDisplayItem(winner);
        setMysteryResult(winner);
        setIsRolling(false);
        // Play sound effect could go here
      }
    };

    animate();
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
        padding: '150px 32px 32px 32px', 
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
            flexWrap: 'wrap'
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

          <button
            onClick={() => {
              setMysteryCategory(null);
              setMysteryResult(null);
              setDisplayItem(null);
              setIsRolling(false);
              setRerollCount(0);
              setCurrentView('mystery');
            }}
            style={{
              width: '100%',
              // Use a distinctive purple gradient for visibility (unless in high contrast mode)
              background: highContrast ? theme.cardBg : 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
              color: highContrast ? theme.text : 'white',
              padding: '32px',
              borderRadius: highContrast ? '0' : '24px',
              border: highContrast ? '4px solid #000' : 'none',
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px',
              boxShadow: theme.shadow,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ 
              background: highContrast ? 'transparent' : 'rgba(255,255,255,0.2)', 
              padding: '16px', 
              borderRadius: '50%',
              border: highContrast ? '2px solid #000' : 'none'
            }}>
              <Dice6 size={48} color={highContrast ? theme.text : "white"} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '8px' }}>
                Feeling Lucky?
              </h2>
              <p style={{ fontSize: '1.2em', opacity: 0.9 }}>
                Spin for a Mystery Drink - Only ${MYSTERY_PRICE}
              </p>
            </div>
          </button>

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
                  key={drink.id}
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
                    background: 'linear-gradient(155deg, #be2b35 58%, #a8222f 42%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: highContrast ? '2px solid #000' : 'none'
                  }}>
                    {drink.image ? (
                      <img
                        src={drink.image}
                        alt={drink.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          // fallback on image error
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
                  <p style={{ fontSize: '0.95em', color: theme.textSecondary, lineHeight: '1.5', flex: 1 }}>
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

  // --- MYSTERY VIEW ---
  if (currentView === 'mystery') {
     // Use categories from existing data
     const mysteryCategories = [...new Set(menuItems.map(item => item.category))];

     // Logic: Game is considered "locked in" if a result has been shown or is rolling.
     // Once locked, user cannot back out without buying or rerolling.
     const gameLocked = isRolling || mysteryResult;

     const currentTotal = MYSTERY_PRICE + (rerollCount * REROLL_COST);

     viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '100px 32px 32px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3em', fontWeight: 'bold', color: theme.text, marginBottom: '0.5em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <Dice6 size={64} color={theme.primary} />
            Mystery Drink
          </h2>
          <p style={{ fontSize: '1.5em', color: theme.textSecondary, marginBottom: '1.5em' }}>
            {mysteryResult ? 
                `Current Price: $${currentTotal.toFixed(2)}` : 
                `Spin for $${MYSTERY_PRICE}`}
          </p>

          {/* STEP 1: CATEGORY SELECTION */}
          {!mysteryResult && !isRolling && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2em', color: theme.text, marginBottom: '16px' }}>Select Category:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                {mysteryCategories.map(cat => (
                  <KioskButton
                    key={cat}
                    onClick={() => setMysteryCategory(cat)}
                    variant={mysteryCategory === cat ? 'primary' : 'secondary'}
                    style={{ fontSize: '1.2em' }}
                  >
                    {cat}
                  </KioskButton>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SLOT MACHINE VISUAL */}
          {mysteryCategory && (
            <div style={{
              backgroundColor: theme.cardBg,
              borderRadius: '24px',
              border: `8px solid ${theme.primary}`,
              padding: '32px',
              margin: '0 auto 32px auto',
              width: '100%',
              maxWidth: '500px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadow,
              position: 'relative'
            }}>
              {/* Lock Icon when game is active */}
              {gameLocked && (
                 <div style={{ position: 'absolute', top: '16px', right: '16px', color: theme.danger }}>
                    <Lock size={32} />
                 </div>
              )}

              {/* Display Area */}
              {displayItem ? (
                <>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    marginBottom: '24px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {displayItem.image ? (
                      <img src={displayItem.image} alt="Mystery" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                       <span style={{ fontSize: '4em' }}>🧋</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '2em', fontWeight: 'bold', color: theme.text }}>
                    {displayItem.name}
                  </h3>
                  {mysteryResult && (
                    <div style={{ marginTop: '16px' }}>
                         <p style={{ fontSize: '1.2em', color: theme.text }}>
                            {rerollCount > 0 ? `${rerollCount} Re-rolls used` : 'First Roll'}
                        </p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ opacity: 0.5 }}>
                  <Dice6 size={100} color={theme.primary} />
                  <p style={{ fontSize: '1.5em', marginTop: '16px' }}>Ready to Roll?</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ACTIONS */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            {/* Initial Roll Button */}
            {!isRolling && !mysteryResult && mysteryCategory && (
              <KioskButton
                onClick={handleMysteryRoll}
                variant="success"
                style={{ fontSize: '1.5em', padding: '1em 2em' }}
              >
                ROLL NOW (${MYSTERY_PRICE.toFixed(2)})
              </KioskButton>
            )}

            {/* Rolling State */}
            {isRolling && (
              <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.primary }}>Rolling...</p>
            )}

            {/* Result State */}
            {!isRolling && mysteryResult && (
              <>
                 <KioskButton
                  onClick={handleMysteryRoll}
                  variant="secondary"
                  style={{ fontSize: '1.2em', padding: '1em 2em', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RotateCcw size={24} />
                    Roll Again
                  </div>
                  <div style={{ fontSize: '0.8em', color: theme.danger }}>
                     +${REROLL_COST.toFixed(2)}
                  </div>
                </KioskButton>
                
                <KioskButton
                  onClick={() => addMysteryToCart(mysteryResult, rerollCount * REROLL_COST)}
                  variant="success"
                  style={{ fontSize: '1.2em', padding: '1em 2em', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={24} />
                    Accept Drink
                  </div>
                   <div style={{ fontSize: '0.8em' }}>
                     Total: ${currentTotal.toFixed(2)}
                  </div>
                </KioskButton>
              </>
            )}
          </div>
          
          {!gameLocked && (
            <div
              style={{
                marginTop: '32px',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <KioskButton onClick={() => setCurrentView('categories')} variant="secondary">
                Cancel & Return to Menu
              </KioskButton>
            </div>
          )}

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
        padding: '100px 32px 32px 32px',
        overflowY: 'auto'
      }}>
        {/* NEW: Wrapper div to constrain width and center content (Restores original size) */}
        <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            {cart.length > 0 && (
              <KioskButton 
                onClick={() => {
                  if (editingCartItem) {
                      // Use the hook function to safely reset state
                      cancelEdit();
                  } else {
                      // Standard navigation for non-edit mode
                      setCurrentView('checkout');
                  }
                }} 
                variant="secondary"
              >
                {editingCartItem ? "Cancel Edit" : `Go to Cart (${cart.length}) →`}
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
            {/* FIX: Changed minmax from 140px to 120px to match Ice Level and fit better in the constrained width */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
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
            {/* Primary Action Button: Handles both adding new items and saving edits */}
            <KioskButton
              onClick={() => {
                if (editingCartItem) {
                  saveCartChanges();
                } else {
                  addToCart(selectedDrink);
                }
              }}
              disabled={!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel}
              variant="success"
              style={{ width: '100%', fontSize: '1.5em', padding: '1em' }}
            >
              {editingCartItem ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <Check size={24} /> Save Changes
                </span>
              ) : (
                "Add to Cart"
              )}
            </KioskButton>
            {(!selectedAddOns.iceLevel || !selectedAddOns.sweetnessLevel) && (
              <p style={{ textAlign: 'center', color: theme.danger, fontSize: '1.2em', marginTop: '1em', fontWeight: 'bold' }}>
                ⚠ Please select Ice Level and Sweetness Level
              </p>
            )}
          </div>
        
        </div>
        {/* End of wrapper div */}
      </div>
    );
  }

  if (currentView === 'checkout') {
    const availablePoints = dbCustomer?.points || 0;
    const canApplyDiscount = cart.length > 0;

    viewContent = (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        padding: '100px 32px 32px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h2 style={{ fontSize: '3em', fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: '1em' }}>
            Checkout
          </h2>

          {cart.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <p
                style={{
                  fontSize: '1.5em',
                  color: theme.textSecondary,
                  marginBottom: '2em'
                }}
              >
                Your cart is empty
              </p>
              <KioskButton onClick={() => setCurrentView('categories')}>
                Add Items
              </KioskButton>
            </div>
          ) : (
            <>
              {/* CART ITEMS SECTION */}
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
                        <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.success }}>
                          ${item.totalPrice}
                        </p>
                        
                        {/* Edit Button: Triggers edit mode for this specific item */}
                        <KioskButton
                          onClick={() => startEditing(item)}
                          variant="secondary"
                          aria-label={`Edit ${item.name}`}
                          style={{ fontSize: '1em', padding: '0.8em', minHeight: '50px' }}
                        >
                          <Pencil size={20} />
                        </KioskButton>

                        <KioskButton
                          onClick={() => removeFromCart(item.cartId)}
                          variant="danger"
                          aria-label={`Remove ${item.name}`}
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

              {/* LOYALTY REDEMPTION SECTION */}
              {dbCustomer && (
                <div style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: highContrast ? '0' : '16px',
                  border: theme.border,
                  padding: '24px',
                  boxShadow: theme.shadow,
                  marginBottom: '32px'
                }}>
                  <h3 style={{ fontSize: '1.5em', fontWeight: 'bold', color: theme.text, marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gift size={24} color={theme.primary} />
                    Loyalty Redemption (You have {availablePoints} pts)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {REDEMPTION_OPTIONS.map((option) => {
                      const isDisabled = option.points > availablePoints || !canApplyDiscount;
                      const isSelected = selectedRedemption?.points === option.points;

                      const handleClick = () => {
                        if (isSelected) {
                          setSelectedRedemption(null);
                        } else {
                          setSelectedRedemption(option);
                          setSelectedPaymentType(null); // Force re-selection of payment after discount change
                        }
                      }
                      
                      return (
                        <KioskButton
                          key={option.points}
                          onClick={handleClick}
                          disabled={isDisabled}
                          variant={isSelected ? 'success' : 'secondary'}
                          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', minHeight: '80px' }}
                        >
                          <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{option.label}</div>
                          <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                            {option.description}
                          </div>
                          <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginTop: '4px' }}>
                            {option.points} Points
                          </div>
                        </KioskButton>
                      );
                    })}
                  </div>
                  {!canApplyDiscount && (
                    <p style={{ textAlign: 'center', color: theme.danger, fontSize: '1.0em', marginTop: '1em', fontWeight: 'bold' }}>
                      ⚠ Add items to your cart to apply a redemption.
                    </p>
                  )}
                </div>
              )}

              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: highContrast ? '2px solid #000' : '2px solid #fbbf24'
              }}>
                <div style={{ marginBottom: '16px', fontSize: '1.2em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: theme.text }}>Subtotal:</span>
                    <span style={{ color: theme.text, fontWeight: 'bold' }}>
                      ${(getSubtotal() + getDiscount()).toFixed(2)} {/* Display original subtotal */}
                    </span>
                  </div>
                  {selectedRedemption && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: theme.success, fontWeight: 'bold' }}>
                      <span>Loyalty Discount ({selectedRedemption.label}):</span>
                      <span>
                        -${getDiscount().toFixed(2)}
                      </span>
                    </div>
                  )}
                  {/* Subtotal after discount is now conditional on selectedRedemption */}
                  {selectedRedemption && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: theme.text }}>Subtotal after discount:</span>
                      <span style={{ color: theme.text, fontWeight: 'bold' }}>
                        ${getSubtotal().toFixed(2)}
                      </span>
                    </div>
                  )}
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
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: theme.success }}>
                      ${getTotal().toFixed(2)}
                    </div>
                    {/* Points Earned/Redeemed Display */}
                    {dbCustomer && (
                       <div style={{ fontSize: '1rem', color: theme.primary, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                         <Star size={16} fill={theme.primary} />
                         {selectedRedemption ? (
                           <span>-{selectedRedemption.points} Points</span>
                         ) : (
                           <span>+{getPointsToEarn()} Points</span>
                         )}
                       </div>
                    )}
                  </div>
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
          bottom: '24px',
          left: '24px',
          zIndex: 1000,
          backgroundColor: theme.cardBg,
          padding: '8px',
          borderRadius: '8px',
          border: theme.border,
          boxShadow: theme.shadow
        }}
      />

      {/* Navigation Buttons */}
      {currentView === 'welcome' ? (
        // Logout Button
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
          Exit
        </button>
      ) : (
        (currentView !== 'mystery' || (!mysteryResult && !isRolling)) && (
          <button
            onClick={() => {
              if (currentView === 'customize') setCurrentView('categories');
              else if (currentView === 'checkout') setCurrentView('categories');
              else setCurrentView('welcome');
            }}
            style={{
              position: 'fixed',
              top: '24px',
              left: '24px',
              backgroundColor: theme.secondary,
              color: theme.text,
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
            <ArrowLeft size={24} />
            Back
          </button>
        )
      )}
      
      {currentView !== 'welcome' && (currentView !== 'mystery' || (!mysteryResult && !isRolling)) && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', gap: '16px', zIndex: 50 }}>
          
          {/* Points Badge */}
          {dbCustomer && (
            <div style={{
              backgroundColor: theme.cardBg,
              color: theme.primary,
              borderRadius: '50px',
              padding: '16px 24px',
              boxShadow: theme.shadow,
              border: theme.border,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.1em',
              fontWeight: 'bold'
            }}>
              <Star size={24} fill={theme.primary} />
              {dbCustomer.points} pts
            </div>
          )}

          <button
            onClick={() => setCurrentView('checkout')}
            style={{
              backgroundColor: theme.primary,
              color: theme.primaryText,
              borderRadius: '50px',
              padding: '16px 32px',
              boxShadow: theme.shadow,
              border: theme.border,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
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
        </div>
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