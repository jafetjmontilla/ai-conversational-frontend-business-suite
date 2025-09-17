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
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Efecto para detectar automáticamente el tema del sistema y setear dark cuando corresponda
  useEffect(() => {
    if (mounted && theme === 'system') {
      // Si el tema del sistema es dark, forzar el tema dark
      if (systemTheme === 'dark') {
        setTheme('dark');
      } else if (systemTheme === 'light') {
        setTheme('light');
      }
    }
  }, [mounted, theme, systemTheme, setTheme]);

  if (!mounted) {
    return {
      theme: 'system',
      setTheme: () => { },
      isDark: false,
      isLight: false,
      isSystem: true,
    };
  }

  // Determinar si es dark basado en el tema resuelto
  const isDarkMode = resolvedTheme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return {
    theme: theme || 'system',
    setTheme,
    isDark: isDarkMode,
    isLight: !isDarkMode,
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