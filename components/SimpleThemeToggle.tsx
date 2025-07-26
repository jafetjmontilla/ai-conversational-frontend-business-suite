'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export const SimpleThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200">
        <Sun size={20} />
      </button>
    );
  }

  const toggleTheme = () => {
    console.log('Cambiando tema de', resolvedTheme, 'a', resolvedTheme === 'light' ? 'dark' : 'light');
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
      title={resolvedTheme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}; 