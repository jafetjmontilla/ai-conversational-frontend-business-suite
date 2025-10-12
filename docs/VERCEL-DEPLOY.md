# Deploy en Vercel con Versionado Automático 🚀

Guía completa para desplegar el proyecto en Vercel con el sistema de versionado automático de PWA.

## 🎯 Cómo Funciona

Vercel ejecuta automáticamente `npm run build` cuando detecta un push. Nuestro build incluye:

```json
"build": "node scripts/update-sw-version.js && next build"
```

Esto significa que **la versión del Service Worker se actualiza automáticamente** en cada deploy basándose en la versión del `package.json`.

---

## ✅ **Flujo Recomendado: Comando Release**

### Uso Simple

```bash
# Para bugs y correcciones
npm run release:patch

# Para nuevas características
npm run release:minor

# Para cambios importantes
npm run release:major
```

### ¿Qué hace el comando?

```bash
npm run release:minor
```

1. ✅ Verifica que no hay cambios sin commitear
2. ✅ Pull de cambios remotos
3. ✅ Incrementa versión en `package.json`
4. ✅ Actualiza `service-worker.js` automáticamente
5. ✅ Crea commit con mensaje "chore: release vX.X.X"
6. ✅ Crea tag vX.X.X
7. ✅ Push a remoto (commit + tag)
8. ✅ Vercel detecta el push y redeploya automáticamente

### Resultado

- ✅ Deploy automático en Vercel
- ✅ Nueva versión de PWA
- ✅ Usuarios ven modal de actualización

---

## 📋 **Flujo Manual Paso a Paso**

Si prefieres hacer el proceso manualmente:

### 1. Desarrollar

```bash
# Trabajar en desarrollo
npm run dev
# ... hacer cambios ...
```

### 2. Incrementar Versión

```bash
# Elegir según tipo de cambio
npm run version:patch  # Bugs
npm run version:minor  # Características
npm run version:major  # Cambios importantes

# Resultado:
# ✅ package.json actualizado: 1.0.0 → 1.1.0
# ✅ service-worker.js actualizado con v1-1-0
```

### 3. Commit

```bash
git add .
git commit -m "feat: nueva característica"
```

### 4. Tag (Opcional pero recomendado)

```bash
# Obtener versión actual
VERSION=$(node -p "require('./package.json').version")

# Crear tag
git tag -a "v${VERSION}" -m "Release v${VERSION}"
```

### 5. Push

```bash
# Push commit
git push origin main

# Push tag (si lo creaste)
git push origin --tags
```

### 6. Vercel Deploy

Vercel detecta el push automáticamente y:

1. Ejecuta `npm install`
2. Ejecuta `npm run build`:
   - Ejecuta `node scripts/update-sw-version.js`
   - Lee versión del `package.json` (1.1.0)
   - Actualiza constantes en `service-worker.js`
   - Ejecuta `next build`
3. Deploya la nueva versión

### 7. Verificar

```bash
# Monitorear deploy en Vercel Dashboard
# https://vercel.com/[tu-proyecto]/deployments

# Una vez completado, los usuarios verán el modal al entrar al dashboard
```

---

## 🔍 **Verificación del Deploy**

### En Vercel Dashboard

1. Ve a tu proyecto en Vercel
2. Abre la pestaña "Deployments"
3. Busca tu último deploy
4. Verifica en los logs:

```
Running "npm run build"
> node scripts/update-sw-version.js && next build

🔄 Actualizando versión del Service Worker...
📦 Versión del package.json: 1.1.0
✅ Service Worker actualizado a versión 1.1.0
   - CACHE_NAME: jaihom-erp-v1-1-0
   - RUNTIME_CACHE: jaihom-runtime-v1-1-0
   - IMAGE_CACHE: jaihom-images-v1-1-0

Creating an optimized production build...
✓ Compiled successfully
```

### En la App Desplegada

1. Abre la app en producción
2. Abre DevTools (F12)
3. Ve a Application → Service Workers
4. Verifica que el nombre del caché sea correcto: `jaihom-erp-v1-1-0`

### Como Usuario

1. Entra al dashboard
2. Si había una versión anterior, verás el modal:
   - "Nueva Versión Disponible"
   - Botones: "Ahora no" / "Actualizar ahora"

---

## ⚙️ **Configuración de Vercel**

### Variables de Entorno

Asegúrate de configurar las variables en Vercel Dashboard:

1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega las variables necesarias:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# API
NEXT_PUBLIC_API_URL=https://tu-api.com
```

### Build Settings

Vercel detecta automáticamente Next.js, pero puedes verificar:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (detectado automáticamente)
- **Output Directory:** `.next` (detectado automáticamente)
- **Install Command:** `npm install` (detectado automáticamente)

### Root Directory

Si tu proyecto está en un subdirectorio:
- Configura el "Root Directory" en Vercel settings

---

## 🔄 **Casos de Uso Comunes**

### Caso 1: Deploy Rápido de Bug Fix

```bash
# Un solo comando hace todo
npm run release:patch

# ✅ Versión incrementada
# ✅ Commit creado
# ✅ Tag creado
# ✅ Push realizado
# ✅ Vercel deployando
```

### Caso 2: Deploy con Múltiples Commits

```bash
# Varios commits durante la semana
git commit -m "fix: bug 1"
git commit -m "feat: característica A"
git commit -m "style: ajustes visuales"

# Al final de la semana, release
npm run release:minor

# ✅ Agrupa todos los commits en una versión
# ✅ Los usuarios ven un solo modal de actualización
```

### Caso 3: Deploy con Feature Branch

```bash
# Trabajar en feature branch
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"

# Merge a main
git checkout main
git merge feature/nueva-funcionalidad

# Release
npm run release:minor

# ✅ Deploy con nueva versión
```

### Caso 4: Rollback de Versión

```bash
# Si necesitas volver a una versión anterior
git checkout v1.0.0

# Crear nueva rama desde ese tag
git checkout -b hotfix-rollback

# Incrementar versión desde ahí
npm run version:patch

# Deploy
git push origin hotfix-rollback

# En Vercel, configura esta rama como production branch temporalmente
```

---

## 🚨 **Errores Comunes**

### Error: "Scripts not found"

**Problema:** Vercel no encuentra los scripts

**Solución:** Asegúrate de que la carpeta `scripts/` esté commiteada:

```bash
git add scripts/
git commit -m "chore: add scripts"
git push
```

### Error: "Permission denied"

**Problema:** Scripts no tienen permisos de ejecución

**Solución:** Ya configurado en el proyecto, pero si falla:

```bash
chmod +x scripts/*.js scripts/*.sh
git add scripts/
git commit -m "chore: update script permissions"
git push
```

### Build Success pero Service Worker no actualiza

**Problema:** La versión en `package.json` no cambió

**Solución:** Verifica que incrementaste la versión antes del push:

```bash
# Ver versión actual
cat package.json | grep version

# Si no incrementaste, hazlo ahora
npm run version:patch
git add package.json public/service-worker.js
git commit -m "chore: update version"
git push
```

### Modal no aparece en producción

**Problema:** El Service Worker no detecta cambios

**Soluciones:**

1. Espera 1-2 minutos después del deploy
2. Fuerza la actualización:
   ```javascript
   // En DevTools Console
   navigator.serviceWorker.getRegistration().then(r => r.update())
   ```
3. Recarga la página (Ctrl+Shift+R)
4. Navega al dashboard

---

## 🎯 **Best Practices para Vercel**

### 1. Usa el comando `release:`

```bash
# ✅ Bueno - Todo automatizado
npm run release:minor

# ❌ Malo - Propenso a errores
npm run version:minor
git add .
git commit -m "..."
# ... olvidar tag o push ...
```

### 2. Monitorea los Deploys

- Activa notificaciones de Vercel (Slack, Discord, Email)
- Revisa los logs de build
- Verifica el Service Worker después del deploy

### 3. Usa Preview Deployments

```bash
# Deploy en branch de preview
git checkout -b preview/test-feature
# ... cambios ...
git push origin preview/test-feature

# Vercel crea un preview deployment automáticamente
# Prueba ahí antes de merge a main
```

### 4. Tags Semánticos

```bash
# ✅ Bueno
v1.2.3

# ❌ Malo
release-january
version-new
```

### 5. CHANGELOG

Actualiza el CHANGELOG.md antes del release:

```bash
# Editar CHANGELOG.md
# Documentar cambios de la versión

npm run release:minor
```

---

## 📊 **Workflow Completo Recomendado**

```bash
# 1. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar
npm run dev
# ... hacer cambios ...

# 3. Commits frecuentes
git add .
git commit -m "feat: agregar X"

# 4. Push a preview
git push origin feature/nueva-funcionalidad
# Vercel crea preview deployment

# 5. Probar en preview
# https://[proyecto]-[branch]-[usuario].vercel.app

# 6. Merge a main
git checkout main
git pull origin main
git merge feature/nueva-funcionalidad

# 7. Actualizar CHANGELOG
# Editar CHANGELOG.md con los cambios

# 8. Release automatizado
npm run release:minor

# 9. Monitorear deploy en Vercel
# https://vercel.com/[proyecto]/deployments

# 10. Verificar en producción
# Abrir app, ir al dashboard, ver modal

# ✅ Done!
```

---

## 🔗 **Enlaces Útiles**

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [PWA Documentation](./PWA.md)
- [Versioning Documentation](./PWA-VERSIONING.md)

---

## 💡 **Resumen**

### Para deploy simple:

```bash
npm run release:minor  # Un comando hace todo
```

### Para deploy manual:

```bash
npm run version:minor  # Incrementar versión
git add .             # Stage cambios
git commit -m "..."   # Commit
git tag v1.1.0       # Tag
git push --tags      # Push
# Vercel deploya automáticamente
```

### Vercel ejecuta:

```bash
npm install
npm run build  # ← Actualiza versión automáticamente
# Deploy
```

### Usuarios ven:

```
Modal en dashboard:
"Nueva Versión Disponible"
[Ahora no] [Actualizar ahora]
```

---

**¡Listo para deploy en Vercel! 🚀**

