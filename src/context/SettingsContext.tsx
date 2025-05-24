import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type TimeFormat = '12h' | '24h';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type ColorTheme = 'default' | 'professional' | 'modern' | 'vibrant';

interface SettingsContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyType>('INR');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h');
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');

  // Apply theme styles to the document
  const applyThemeStyles = (theme: ColorTheme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-default', 'theme-professional', 'theme-modern', 'theme-vibrant');
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    
    // Apply CSS custom properties based on theme
    switch (theme) {
      case 'professional':
        root.style.setProperty('--primary', '222.2 84% 4.9%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--accent', '210 40% 96%');
        root.style.setProperty('--accent-foreground', '222.2 84% 4.9%');
        break;
      case 'modern':
        root.style.setProperty('--primary', '271.5 81% 56%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--accent', '270 95% 95%');
        root.style.setProperty('--accent-foreground', '271.5 81% 56%');
        break;
      case 'vibrant':
        root.style.setProperty('--primary', '142.1 76% 36%');
        root.style.setProperty('--primary-foreground', '355.7 100% 97%');
        root.style.setProperty('--accent', '142.1 76% 95%');
        root.style.setProperty('--accent-foreground', '142.1 76% 36%');
        break;
      default:
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--accent', '210 40% 96%');
        root.style.setProperty('--accent-foreground', '222.2 84% 4.9%');
        break;
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('app-currency') as CurrencyType;
    const savedTimeFormat = localStorage.getItem('app-timeformat') as TimeFormat;
    const savedDateFormat = localStorage.getItem('app-dateformat') as DateFormat;
    const savedColorTheme = localStorage.getItem('app-colortheme') as ColorTheme;

    if (savedCurrency) setCurrency(savedCurrency);
    if (savedTimeFormat) setTimeFormat(savedTimeFormat);
    if (savedDateFormat) setDateFormat(savedDateFormat);
    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
      applyThemeStyles(savedColorTheme);
    } else {
      applyThemeStyles('default');
    }
  }, []);

  // Save settings to localStorage when they change
  const handleSetCurrency = (newCurrency: CurrencyType) => {
    setCurrency(newCurrency);
    localStorage.setItem('app-currency', newCurrency);
  };

  const handleSetTimeFormat = (newFormat: TimeFormat) => {
    setTimeFormat(newFormat);
    localStorage.setItem('app-timeformat', newFormat);
  };

  const handleSetDateFormat = (newFormat: DateFormat) => {
    setDateFormat(newFormat);
    localStorage.setItem('app-dateformat', newFormat);
  };

  const handleSetColorTheme = (newTheme: ColorTheme) => {
    setColorTheme(newTheme);
    localStorage.setItem('app-colortheme', newTheme);
    applyThemeStyles(newTheme);
    console.log('Theme changed to:', newTheme);
    
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
      console.log('Theme application completed for:', newTheme);
    }, 100);
  };

  return (
    <SettingsContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        timeFormat,
        setTimeFormat: handleSetTimeFormat,
        dateFormat,
        setDateFormat: handleSetDateFormat,
        colorTheme,
        setColorTheme: handleSetColorTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
