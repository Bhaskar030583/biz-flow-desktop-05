
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
        root.style.setProperty('--primary-color', '#1e40af');
        root.style.setProperty('--secondary-color', '#475569');
        root.style.setProperty('--accent-color', '#1e40af');
        break;
      case 'modern':
        root.style.setProperty('--primary-color', '#7c3aed');
        root.style.setProperty('--secondary-color', '#ec4899');
        root.style.setProperty('--accent-color', '#7c3aed');
        break;
      case 'vibrant':
        root.style.setProperty('--primary-color', '#059669');
        root.style.setProperty('--secondary-color', '#ea580c');
        root.style.setProperty('--accent-color', '#059669');
        break;
      default:
        root.style.setProperty('--primary-color', '#3b82f6');
        root.style.setProperty('--secondary-color', '#6b7280');
        root.style.setProperty('--accent-color', '#3b82f6');
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
