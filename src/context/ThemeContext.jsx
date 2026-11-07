import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from '../constants';
import { storage } from '../utils/storage';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check saved theme in localStorage for this device
    const saved = storage.get('theme');
    if (saved && (saved === THEMES.DARK || saved === THEMES.LIGHT)) {
      return saved;
    }
    // Default theme is strictly DARK (Vault Black) across all devices
    return THEMES.DARK;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === THEMES.DARK) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    storage.set('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === THEMES.DARK }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

