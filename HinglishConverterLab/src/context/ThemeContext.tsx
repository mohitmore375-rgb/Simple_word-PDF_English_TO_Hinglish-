import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DarkColors, LightColors, ColorScheme } from '../theme/colors';
import { themeService } from '../services/themeService';

interface ThemeContextType {
  isDark: boolean;
  colors: ColorScheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: DarkColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    themeService.loadTheme().then((saved) => {
      if (saved !== null) setIsDark(saved);
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    themeService.saveTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DarkColors : LightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
