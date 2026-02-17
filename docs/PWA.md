# Progressive Web App (PWA) - Frontend Business Suite

## 📱 Descripción

La aplicación ha sido convertida en una Progressive Web App (PWA) completamente manual, sin usar librerías externas. Esto permite que la aplicación funcione como una app nativa en dispositivos móviles y de escritorio.

## ✨ Características

- ✅ **Instalable**: Los usuarios pueden instalar la app en su dispositivo
- ✅ **Funciona offline**: Caché inteligente para usar la app sin conexión
- ✅ **Actualizaciones automáticas**: El service worker se actualiza automáticamente
- ✅ **Modal de actualización**: Interfaz elegante para notificar nuevas versiones
- ✅ **Verificación en dashboard**: Comprueba actualizaciones al entrar al dashboard
- ✅ **Atajos rápidos**: Accesos directos a Dashboard, Facturas e Inventario
- ✅ **Soporte multiplataforma**: Funciona en iOS, Android y Desktop
- ✅ **Sin librerías**: Implementación 100% manual

## 📂 Estructura de archivos

```
frontend-business-suite/
├── public/
│   ├── manifest.json           # Manifiesto de la PWA
│   ├── service-worker.js       # Service Worker manual
│   ├── register-sw.js          # Script de registro del SW
│   └── images/
│       ├── icon-192x192.png    # Icono 192x192
│       └── icon-512x512.png    # Icono 512x512
├── app/
│   ├── layout.tsx              # Layout con metadatos PWA
│   └── (sidebar)/
│       └── dashboard/
│           └── page.tsx        # Dashboard con verificación de actualizaciones
├── components/
│   ├── InstallPWA.tsx          # Componente de instalación (opcional)
│   └── PWAUpdateDialog.tsx     # Modal de actualización PWA
└── hooks/
    └── usePWAUpdate.ts         # Hook para detectar actualizaciones
```

## 🚀 Cómo funciona

### Service Worker

El service worker (`service-worker.js`) implementa tres estrategias de caché:

1. **Cache First**: Para assets estáticos e imágenes
2. **Network First**: Para páginas y contenido dinámico
3. **Network Only**: Para APIs y autenticación

### Registro automático

El service worker se registra automáticamente cuando la página carga gracias a `register-sw.js` que se incluye en el `layout.tsx`.

### Caché inteligente

- **CACHE_NAME**: Archivos estáticos principales
- **RUNTIME_CACHE**: Páginas y recursos dinámicos
- **IMAGE_CACHE**: Imágenes optimizadas

## 💻 Instalación de la app

### En dispositivos móviles (Android/iOS)

1. Abre la aplicación en Chrome/Safari
2. Toca el menú del navegador (⋮ o ⋯)
3. Selecciona "Agregar a pantalla de inicio" o "Instalar app"
4. La app aparecerá como una aplicación nativa

### En escritorio (Chrome/Edge)

1. Abre la aplicación en el navegador
2. Busca el ícono de instalación en la barra de direcciones (+)
3. Haz clic en "Instalar"
4. La app se abrirá en su propia ventana

### Usando el componente InstallPWA

Puedes agregar el componente `<InstallPWA />` en cualquier parte de tu app para mostrar un botón de instalación personalizado:

```tsx
import InstallPWA from '@/components/InstallPWA'

export default function MyComponent() {
  return (
    <div>
      <InstallPWA />
      {/* Resto del contenido */}
    </div>
  )
}
```

## 🔧 Desarrollo

### Testing en local

```bash
npm run build
npm start
```

La PWA solo funciona en producción (`npm start`), no en desarrollo (`npm run dev`).

### Sistema de versionado automático ⭐

**¡Nuevo!** Ahora el versionado es completamente automático. Lee la [documentación completa](./PWA-VERSIONING.md).

```bash
# Incrementar versión patch (bugs, cambios menores)
npm run version:patch  # 1.0.0 → 1.0.1

# Incrementar versión minor (nuevas características)
npm run version:minor  # 1.0.0 → 1.1.0

# Incrementar versión major (cambios importantes)
npm run version:major  # 1.0.0 → 2.0.0
```

El script actualiza automáticamente:
- ✅ Versión en `package.json`
- ✅ Versión del Service Worker
- ✅ Nombres de los cachés
- ✅ Comentarios con fecha y versión

**Ventajas:**
- No necesitas editar manualmente el `service-worker.js`
- La versión siempre está sincronizada
- `npm run build` actualiza automáticamente las versiones

### Actualizar caché (forma antigua - ya no necesaria)

~~Cuando hagas cambios importantes, actualiza la versión del caché en `service-worker.js`:~~

```javascript
// ❌ Ya no es necesario hacer esto manualmente
// ✅ Usa: npm run version:patch
const CACHE_NAME = 'frontend-business-suite-v2'; // Incrementa la versión
```

### Limpiar caché manualmente

Desde las DevTools del navegador:
1. Abre DevTools (F12)
2. Ve a la pestaña "Application"
3. En "Storage" → "Clear storage"
4. Marca todas las opciones y haz clic en "Clear site data"

## 📱 Atajos de aplicación

La PWA incluye atajos para acceso rápido:

- **Dashboard**: `/dashboard`
- **Facturas**: `/invoice`
- **Inventario**: `/inventory`

Los atajos aparecen cuando mantienes presionado el ícono de la app (Android) o haces clic derecho (Desktop).

## 🔄 Actualizaciones

El service worker verifica actualizaciones cada hora y automáticamente cuando el usuario entra al dashboard. Cuando hay una nueva versión:

1. Se descarga el nuevo service worker en segundo plano
2. Se muestra un modal elegante al usuario (solo en el dashboard)
3. El usuario puede elegir:
   - **Actualizar ahora**: Aplica la actualización y recarga la app inmediatamente
   - **Ahora no**: Continúa usando la versión actual, la actualización se aplicará en la próxima recarga

### Modal de actualización

El modal de actualización se muestra automáticamente en el dashboard cuando hay una nueva versión disponible. Este componente está implementado con:

- `usePWAUpdate` hook: Detecta actualizaciones del service worker
- `PWAUpdateDialog` component: UI elegante usando shadcn/ui Dialog
- Integración en `/dashboard`: Verificación automática al entrar

## 🧪 Probar actualizaciones

Para probar el modal de actualización en desarrollo:

1. **Construir la aplicación**:
   ```bash
   npm run build
   npm start
   ```

2. **Hacer cambios y reconstruir**:
   - Cambia el `CACHE_NAME` en `service-worker.js`:
     ```javascript
     const CACHE_NAME = 'frontend-business-suite-v2'; // Incrementa el número
     ```
   - Reconstruye: `npm run build`

3. **Recargar la página**:
   - El service worker detectará la nueva versión
   - Navega al dashboard
   - Deberías ver el modal de actualización

4. **Desde DevTools**:
   - Ve a Application → Service Workers
   - Marca "Update on reload" para forzar actualizaciones
   - Haz clic en "Update" para simular una nueva versión

## 🐛 Debugging

### Ver logs del service worker

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes con el prefijo `[SW]` o `[PWA]`

### Ver estado del service worker

1. Abre DevTools (F12)
2. Ve a la pestaña "Application"
3. En el menú lateral, selecciona "Service Workers"
4. Verás el estado actual del worker

### Desregistrar el service worker

```javascript
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((registration) => registration.unregister())
})
```

### Forzar actualización del service worker

```javascript
navigator.serviceWorker.getRegistration().then((registration) => {
  if (registration) {
    registration.update();
  }
})
```

## 🎨 Personalización

### Cambiar colores del tema

Edita `manifest.json`:

```json
{
  "theme_color": "#tu-color",
  "background_color": "#tu-color"
}
```

### Cambiar iconos

Reemplaza los archivos en `/public/images/`:
- `icon-192x192.png`
- `icon-512x512.png`

### Modificar atajos

Edita la sección `shortcuts` en `manifest.json`.

## 📊 Soporte de navegadores

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome    | ✅      | ✅     |
| Edge      | ✅      | ✅     |
| Safari    | ✅      | ✅     |
| Firefox   | ⚠️      | ⚠️     |

⚠️ Firefox tiene soporte limitado para PWAs

## 🔒 Consideraciones de seguridad

- La PWA requiere HTTPS en producción
- El service worker solo funciona en contextos seguros
- Los datos en caché están cifrados por el navegador

## 📝 Notas adicionales

- Los archivos `.env` están incluidos en el control de versiones según las preferencias del proyecto
- El service worker NO cachea peticiones a APIs para evitar datos obsoletos
- La estrategia de caché puede ajustarse según las necesidades

