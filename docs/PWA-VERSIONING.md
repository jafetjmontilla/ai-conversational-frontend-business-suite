# Sistema de Versionado Automático PWA 🔄

## 📋 Descripción

Sistema automático para gestionar versiones del Service Worker basándose en el `package.json`. Cada vez que incrementas la versión de tu app, el Service Worker se actualiza automáticamente.

## 🎯 ¿Por qué es importante?

- ✅ **Sincronización automática**: La versión del PWA siempre coincide con la del proyecto
- ✅ **Sin errores manuales**: No necesitas recordar cambiar versiones en múltiples lugares
- ✅ **Control total**: Decides exactamente cuándo notificar actualizaciones a los usuarios
- ✅ **Seguimiento**: Puedes ver qué versión tiene cada usuario

## 🚀 Comandos disponibles

### Incrementar versiones

```bash
# Incrementar versión PATCH (1.0.0 → 1.0.1)
# Para correcciones de bugs y cambios menores
npm run version:patch

# Incrementar versión MINOR (1.0.0 → 1.1.0)
# Para nuevas características compatibles
npm run version:minor

# Incrementar versión MAJOR (1.0.0 → 2.0.0)
# Para cambios que rompen compatibilidad
npm run version:major
```

### Actualizar Service Worker manualmente

```bash
# Actualiza el service-worker.js con la versión actual del package.json
npm run pwa:version
```

### Build automático

```bash
# El build ahora actualiza automáticamente el Service Worker
npm run build

# Esto ejecuta:
# 1. node scripts/update-sw-version.js (actualiza versiones)
# 2. next build (construye la app)
```

## 📖 Flujo de trabajo recomendado

### 1️⃣ Desarrollo diario (sin actualización PWA)

```bash
# Trabaja normalmente
npm run dev

# Los cambios se ven en tiempo real
# NO se notifican actualizaciones a usuarios
```

### 2️⃣ Cambios menores (bugs, ajustes)

```bash
# Incrementa versión patch
npm run version:patch

# Build y deploy
npm run build
npm start

# Los usuarios verán el modal de actualización
```

### 3️⃣ Nuevas características

```bash
# Incrementa versión minor
npm run version:minor

# Build y deploy
npm run build
npm start
```

### 4️⃣ Cambios importantes

```bash
# Incrementa versión major
npm run version:major

# Build y deploy
npm run build
npm start
```

## 🔍 Qué hace cada script

### `update-sw-version.js`

1. Lee la versión del `package.json`
2. Actualiza las constantes en `service-worker.js`:
   - `CACHE_NAME`
   - `RUNTIME_CACHE`
   - `IMAGE_CACHE`
3. Agrega comentario con versión y fecha

**Ejemplo:**
```javascript
// Antes
const CACHE_NAME = '4net-erp-erp-v1';

// Después (versión 1.2.3)
const CACHE_NAME = '4net-erp-erp-v1-2-3';
```

### `bump-version.js`

1. Incrementa la versión en `package.json`
2. Ejecuta `update-sw-version.js`
3. Muestra instrucciones para commit y tag

## 📝 Ejemplo completo

```bash
# Situación: Acabas de agregar un nuevo reporte
# Versión actual: 1.0.0

# 1. Incrementar versión minor (nueva característica)
npm run version:minor
# ✅ Versión actualizada: 1.0.0 → 1.1.0
# ✅ Service Worker actualizado

# 2. Build
npm run build
# ✅ App construida con nueva versión

# 3. Commit y tag
git add .
git commit -m "feat: agregar reporte de facturas"
git tag v1.1.0

# 4. Deploy
npm start

# 5. Los usuarios verán el modal de actualización
# cuando entren al dashboard
```

## 🎨 Personalización de versiones del caché

Si quieres cambiar el formato de las versiones, edita `scripts/update-sw-version.js`:

```javascript
// Formato actual: v1-2-3
const versionSuffix = `v${version.replace(/\./g, '-')}`;

// Alternativas:
const versionSuffix = `v${version}`;           // v1.2.3
const versionSuffix = version;                 // 1.2.3
const versionSuffix = `${version}-${Date.now()}`; // 1.2.3-1234567890
```

## 🔄 Estrategia de versionado semántico

Sigue [Semantic Versioning](https://semver.org/):

### MAJOR (X.0.0)
- Cambios que rompen compatibilidad
- Reestructuración completa
- Cambios en la API

**Ejemplo:** Migrar de Firebase a otro backend

### MINOR (0.X.0)
- Nuevas características
- Funcionalidad adicional
- Compatible con versión anterior

**Ejemplo:** Agregar nuevo módulo de reportes

### PATCH (0.0.X)
- Corrección de bugs
- Ajustes menores
- Mejoras de rendimiento

**Ejemplo:** Corregir error en cálculo de totales

## 📊 Monitoreo de versiones

Puedes ver la versión actual del Service Worker en:

1. **DevTools → Application → Service Workers**
   - Verás el nombre del caché: `4net-erp-erp-v1-2-3`

2. **Console del navegador**
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => {
     console.log('Service Worker version:', reg.active);
   });
   ```

3. **Comentario en service-worker.js**
   ```javascript
   // Versión: 1.2.3 - Generado: 2024-01-15T10:30:00.000Z
   ```

## 🐛 Troubleshooting

### El modal de actualización no aparece

1. Verifica que el build se haya ejecutado con la nueva versión:
   ```bash
   npm run pwa:version
   npm run build
   ```

2. Fuerza la actualización del Service Worker:
   - DevTools → Application → Service Workers
   - Clic en "Update"

3. Verifica los logs en la consola:
   - Busca `[PWA] Nueva versión encontrada`

### La versión no se incrementó

1. Verifica que el script se haya ejecutado:
   ```bash
   npm run version:patch
   ```

2. Verifica el `package.json`:
   ```bash
   cat package.json | grep version
   ```

3. Verifica el `service-worker.js`:
   ```bash
   head -n 5 public/service-worker.js
   ```

## 🎯 Mejores prácticas

1. **Incrementa versión antes de deploy importante**
   ```bash
   npm run version:minor && npm run build
   ```

2. **Usa Git tags para marcar versiones**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

3. **Documenta cambios en CHANGELOG.md**
   ```markdown
   ## [1.2.3] - 2024-01-15
   ### Added
   - Nuevo reporte de facturas
   ### Fixed
   - Corrección en cálculo de totales
   ```

4. **Testing antes de deploy**
   ```bash
   npm run pwa:test  # Build y ejecuta en modo producción
   ```

5. **No incrementes versión en cada commit**
   - Solo cuando quieras notificar actualizaciones
   - Agrupa varios cambios en una sola versión

## 📚 Referencias

- [Semantic Versioning](https://semver.org/)
- [Service Worker Update Process](https://web.dev/service-worker-lifecycle/)
- [PWA Update Patterns](https://web.dev/offline-cookbook/)

---

**Nota**: Este sistema es completamente automático. Solo necesitas ejecutar los comandos y todo se actualiza automáticamente. 🚀

