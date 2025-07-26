# Sistema de Temas - Pestilo Frontend

## Descripción

El sistema de temas implementado en Pestilo permite a los usuarios cambiar entre modo claro, oscuro y automático (sistema) de manera fluida y sin recargar la página.

## Características

- ✅ **Tres modos de tema**: Claro, Oscuro y Sistema
- ✅ **Persistencia**: El tema se guarda automáticamente en el navegador
- ✅ **Transiciones suaves**: Cambios instantáneos con animaciones
- ✅ **Responsive**: Funciona perfectamente en móviles y desktop
- ✅ **Accesibilidad**: Contraste optimizado para ambos temas
- ✅ **Integración completa**: Todos los componentes soportan ambos temas

## Componentes Implementados

### 1. ThemeContext (`contexts/ThemeContext.tsx`)
Contexto de React que maneja el estado del tema usando `next-themes`.

```typescript
const { theme, setTheme, isDark, isLight, isSystem } = useThemeContext();
```

### 2. ThemeToggle (`components/ThemeToggle.tsx`)
Componente principal con dos variantes:
- `ThemeToggle`: Selector completo con tres opciones
- `SimpleThemeToggle`: Botón simple para alternar entre claro/oscuro

### 3. Navigation (`components/Navigation.tsx`)
Barra de navegación que incluye el selector de tema y está optimizada para ambos temas.

### 4. ThemeDemo (`components/ThemeDemo.tsx`)
Componente de demostración que muestra todas las funcionalidades del sistema de temas.

## Configuración

### Tailwind CSS
El modo oscuro está configurado usando la clase `dark:`:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ... resto de la configuración
}
```

### Layout Principal
El `ThemeProvider` está integrado en el layout principal:

```typescript
// app/layout.tsx
<ThemeProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

## Uso

### Cambiar tema programáticamente
```typescript
import { useThemeContext } from '../contexts/ThemeContext';

const { setTheme } = useThemeContext();

// Cambiar a tema oscuro
setTheme('dark');

// Cambiar a tema claro
setTheme('light');

// Usar preferencia del sistema
setTheme('system');
```

### Aplicar clases de tema oscuro
```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Contenido que se adapta al tema
</div>
```

## Clases CSS Comunes

### Fondos
- `bg-white dark:bg-gray-800` - Fondos principales
- `bg-gray-50 dark:bg-gray-700` - Fondos secundarios
- `bg-gray-900 dark:bg-gray-950` - Fondos oscuros

### Texto
- `text-gray-900 dark:text-white` - Texto principal
- `text-gray-600 dark:text-gray-300` - Texto secundario
- `text-gray-500 dark:text-gray-400` - Texto terciario

### Bordes
- `border-gray-200 dark:border-gray-700` - Bordes principales
- `border-gray-100 dark:border-gray-600` - Bordes secundarios

### Colores primarios
- `text-primary-600 dark:text-primary-400` - Texto primario
- `bg-primary-600 dark:bg-primary-500` - Fondo primario

## Páginas de Demostración

- **Página principal** (`/`): Aplicación completa con tema oscuro
- **Demo de temas** (`/theme-demo`): Demostración interactiva del sistema

## Consideraciones Técnicas

### Hydration
Se usa `suppressHydrationWarning` en el HTML para evitar warnings de hidratación:

```jsx
<html lang="es" suppressHydrationWarning>
```

### Estado de carga
El contexto maneja el estado de carga para evitar parpadeos:

```typescript
if (!mounted) {
  return <div className="min-h-screen bg-white dark:bg-gray-900" />;
}
```

### Transiciones
Las transiciones están configuradas globalmente:

```css
/* globals.css */
body {
  @apply transition-colors duration-200;
}
```

## Próximas Mejoras

- [ ] Animaciones más elaboradas para cambios de tema
- [ ] Temas personalizados por usuario
- [ ] Detección automática de preferencias de accesibilidad
- [ ] Temas estacionales o especiales
- [ ] Exportar/importar preferencias de tema

## Dependencias

- `next-themes`: Manejo del estado del tema
- `lucide-react`: Iconos para los selectores
- `tailwindcss`: Sistema de clases CSS

## Instalación

```bash
npm install next-themes
```

El sistema está completamente integrado y listo para usar. Solo asegúrate de que el `ThemeProvider` esté envolviendo tu aplicación en el layout principal. 