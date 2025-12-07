
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Sun, Moon, Minus, Plus, Volume2, VolumeX, Globe } from 'lucide-react';

const AccessibilityContext = createContext();

export const THEMES = {
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
export function AccessibilityProvider({ children }) {
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
            <div style={{ fontSize: `${fontSize}rem`, lineHeight: 1.5, transition: 'all 0.2s ease', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    return useContext(AccessibilityContext);
}

/*
  Accessible button component with theme support.
  Automatically adjusts padding based on font size and handles high contrast styling.
*/
export function KioskButton({ onClick, children, variant = 'primary', style = {}, disabled = false, ...props }) {
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

export function AccessibilityControls() {
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

    // Initialize Google Translate
    useEffect(() => {
        window.googleTranslateElementInit = () => {
            const target = document.getElementById('google_translate_element');
            if (target) target.innerHTML = ''; // Clear previous instances

            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.VERTICAL },
                    'google_translate_element'
                );
            }
        };

        const target = document.getElementById('google_translate_element');
        if (target) target.innerHTML = ''; // Ensure clear on mount

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
            #google_translate_element { overflow: hidden; }
            .goog-te-gadget-icon { display: none !important; }
            .goog-te-gadget-simple { background-color: transparent !important; border: none !important; padding: 0 !important; }
            .goog-te-gadget span { display: none !important; }
            .goog-te-gadget { color: transparent !important; font-size: 0 !important; }
            .goog-te-combo {
                color: transparent;
                background-color: transparent;
                border: none;
                font-size: 0;
                cursor: pointer;
                opacity: 0;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: block;
                z-index: 2;
            }
            .goog-te-combo option {
                color: #000;
                background-color: #fff;
                font-size: 1rem;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '24px',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 1000,
            backgroundColor: theme.cardBg,
            padding: '16px 8px',
            borderRadius: '12px',
            border: theme.border,
            boxShadow: theme.shadow,
            alignItems: 'center',
            width: 'fit-content'
        }}>
            <KioskButton onClick={decreaseFontSize} disabled={fontSize <= 1.0} aria-label="Decrease text size" variant="secondary" style={{ padding: '8px' }}>
                <Minus size={24} />
                <span style={{ fontSize: '0.8em' }}>A</span>
            </KioskButton>
            <KioskButton onClick={increaseFontSize} disabled={fontSize >= 1.5} aria-label="Increase text size" variant="secondary" style={{ padding: '8px' }}>
                <Plus size={24} />
                <span style={{ fontSize: '1.2em' }}>A</span>
            </KioskButton>

            <div style={{ height: '1px', width: '100%', backgroundColor: '#ccc' }}></div>

            <KioskButton onClick={toggleContrast} aria-label="Toggle high contrast" variant="secondary" style={{ padding: '8px' }}>
                {highContrast ? <Sun size={24} /> : <Moon size={24} />}
            </KioskButton>

            <KioskButton
                onClick={toggleTts}
                aria-label={ttsEnabled ? "Disable Text to Speech" : "Enable Text to Speech"}
                variant={ttsEnabled ? 'primary' : 'secondary'}
                style={{ padding: '8px' }}
            >
                {ttsEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </KioskButton>

            <div style={{ height: '1px', width: '100%', backgroundColor: '#ccc' }}></div>

            {/* Google Translate Container - Styled as a button with icon */}
            <div style={{ position: 'relative', width: '44px', height: '44px', cursor: 'pointer' }}>
                <KioskButton
                    variant="secondary"
                    style={{
                        padding: '0',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none' // Let clicks pass through to the select element
                    }}
                >
                    <Globe size={24} />
                </KioskButton>

                <div
                    id="google_translate_element"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        opacity: 0,
                        zIndex: 10
                    }}
                />
            </div>
        </div>
    );
}
