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
        <div className="bg-card rounded-lg p-4 border border-border">
          <h4 className="font-medium text-foreground mb-2">Estado Actual:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-muted-foreground">
              Tema seleccionado: <span className="font-medium text-primary">{theme}</span>
            </span>
            <div className="flex space-x-2">
              {isLight && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Claro</span>}
              {isDark && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Oscuro</span>}
              {isSystem && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">Sistema</span>}
            </div>
          </div>
        </div>

        {/* Paleta de colores */}
        <div>
          <h4 className="font-medium text-primary mb-2">Paleta de colores:</h4>
          <div className="flex flex-wrap gap-2">
            <div className="w-10 h-10 bg-primary text-yellow-500 text-[8px]">primary</div>
            <div className="w-10 h-10 bg-primary-foreground text-yellow-500 text-[8px]">primary-foreground</div>
            <div className="w-10 h-10 bg-secondary text-yellow-500 text-[8px]">secondary</div>
            <div className="w-10 h-10 bg-secondary-foreground text-yellow-500 text-[8px]">secondary-foreground</div>
            <div className="w-10 h-10 bg-accent text-yellow-500 text-[8px]">accent</div>
            <div className="w-10 h-10 bg-accent-foreground text-yellow-500 text-[8px]">accent-foreground</div>
            <div className="w-10 h-10 bg-destructive text-yellow-500 text-[8px]">destructive</div>
            <div className="w-10 h-10 bg-destructive-foreground text-yellow-500 text-[8px]">destructive-foreground</div>
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

        {/* Información del sistema */}
        <div className="bg-accent/20 border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Información del Sistema</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• El tema se guarda automáticamente en el navegador</li>
            <li>• El modo &quot;Sistema&quot; sigue la preferencia del sistema operativo</li>
            <li>• Los cambios se aplican instantáneamente sin recargar la página</li>
            <li>• Todos los componentes están optimizados para ambos temas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
