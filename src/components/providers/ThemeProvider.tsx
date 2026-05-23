'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'theme-reading';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Lấy theme từ localStorage hoặc hệ thống
    const savedTheme = localStorage.getItem('kingdragon-theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    // Convert old 'sepia' to 'theme-reading' if exists in localstorage
    const safeInitialTheme = initialTheme === 'sepia' as any ? 'theme-reading' : initialTheme;
    
    setThemeState(safeInitialTheme);
    applyTheme(safeInitialTheme);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'sepia', 'theme-reading');
    root.classList.add(t);
    localStorage.setItem('kingdragon-theme', t);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    // Cycle: light -> theme-reading -> dark -> light
    const newTheme = theme === 'light' ? 'theme-reading' : theme === 'theme-reading' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
