'use client';

import { useThemeContext } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeContext();

  const themes = [
    { name: 'light', icon: Sun, label: 'Claro' },
    { name: 'dark', icon: Moon, label: 'Oscuro' },
    { name: 'system', icon: Monitor, label: 'Sistema' },
  ];

  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
      {themes.map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          onClick={() => setTheme(name)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${theme === name
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          title={label}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
