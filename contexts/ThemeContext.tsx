'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return {
      theme: 'system',
      setTheme: () => { },
      isDark: false,
      isLight: false,
      isSystem: true,
    };
  }

  return {
    theme: theme || 'system',
    setTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };
};

// Hook personalizado para verificar si el componente está montado
export const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}; 