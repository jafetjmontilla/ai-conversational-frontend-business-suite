'use client';

import { FC } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useThemeContext } from '../contexts/ThemeContext';
import { SimpleThemeToggle } from './SimpleThemeToggle';

export const ThemeDemo: FC = () => {
  const { theme, isDark, isLight, isSystem } = useThemeContext();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Demostración del Sistema de Temas
      </h3>

      <div className="space-y-6">
        {/* Estado actual del tema */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Estado Actual:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Tema seleccionado: <span className="font-medium text-primary-600 dark:text-primary-400">{theme}</span>
            </span>
            <div className="flex space-x-2">
              {isLight && <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">Claro</span>}
              {isDark && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">Oscuro</span>}
              {isSystem && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">Sistema</span>}
            </div>
          </div>
        </div>

        {/* Selector completo de temas */}
        <div>
          <h4 className="font-medium text-primary mb-2">Selector Completo:</h4>
          <ThemeToggle />
        </div>

        {/* Selector simple */}
        <div>
          <h4 className="font-medium text-primary mb-2">Selector Simple:</h4>
          <SimpleThemeToggle />
        </div>

        {/* Ejemplos de componentes */}
        <div>
          <h4 className="font-medium text-primary mb-2">Ejemplos de Componentes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Tarjeta de Ejemplo</h5>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Este es un ejemplo de cómo se ven los componentes en el tema actual.
              </p>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Botón Primario
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Tarjeta con Borde</h5>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Componente con borde para mostrar contraste.
              </p>
              <button className="border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-4 py-2 rounded-lg text-sm transition-colors">
                Botón Secundario
              </button>
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Información del Sistema</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• El tema se guarda automáticamente en el navegador</li>
            <li>• El modo "Sistema" sigue la preferencia del sistema operativo</li>
            <li>• Los cambios se aplican instantáneamente sin recargar la página</li>
            <li>• Todos los componentes están optimizados para ambos temas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 