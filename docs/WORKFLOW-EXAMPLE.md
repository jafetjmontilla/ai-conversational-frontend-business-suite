# Ejemplo de Flujo de Trabajo con Versionado Automático 🚀

Este documento muestra ejemplos reales de cómo usar el sistema de versionado automático en diferentes escenarios.

## 🐛 Escenario 1: Corrección de un bug

**Situación:** Encontraste un error en el cálculo de totales en las facturas.

```bash
# 1. Arreglar el bug en tu código
# ... editar archivos ...

# 2. Incrementar versión patch
npm run version:patch
# ✅ 1.0.0 → 1.0.1

# 3. Build
npm run build
# ✅ Service Worker actualizado automáticamente

# 4. Commit
git add .
git commit -m "fix: corregir cálculo de totales en facturas"
git tag v1.0.1

# 5. Deploy
npm start

# ✨ Los usuarios verán el modal de actualización
```

**Resultado:**
- ✅ Versión incrementada: `1.0.0` → `1.0.1`
- ✅ Service Worker actualizado: `frontend-business-suite-v1-0-1`
- ✅ Modal de actualización se muestra a usuarios
- ✅ Bug corregido disponible inmediatamente

---

## ✨ Escenario 2: Nueva característica

**Situación:** Agregaste el nuevo reporte de facturas por forma de pago.

```bash
# 1. Desarrollar la nueva característica
# ... crear componentes, páginas, etc ...

# 2. Testing en desarrollo
npm run dev
# Probar que todo funciona

# 3. Incrementar versión minor
npm run version:minor
# ✅ 1.0.1 → 1.1.0

# 4. Build y test en producción
npm run build
npm start
# Probar en modo producción

# 5. Commit con descripción detallada
git add .
git commit -m "feat: agregar reporte de facturas por forma de pago

- Agrupación por tienda y método de pago
- Totales en USD y Bs
- Filtros por fecha y estado
- Resumen general consolidado"

git tag v1.1.0

# 6. Deploy
# ... proceso de deploy ...

# ✨ Los usuarios verán el modal al entrar al dashboard
```

**Resultado:**
- ✅ Nueva característica disponible
- ✅ Versión: `1.1.0`
- ✅ Modal notifica a usuarios de nueva funcionalidad
- ✅ Historial de versiones en Git

---

## 🔥 Escenario 3: Cambio mayor (Breaking Change)

**Situación:** Migración de Firebase Authentication a otro sistema.

```bash
# 1. Implementar el cambio mayor
# ... refactorizar código ...

# 2. Actualizar documentación
# ... actualizar README, docs ...

# 3. Incrementar versión major
npm run version:major
# ✅ 1.1.0 → 2.0.0

# 4. Build
npm run build

# 5. Commit con BREAKING CHANGE
git add .
git commit -m "feat!: migrar a nuevo sistema de autenticación

BREAKING CHANGE: Se requiere re-login de todos los usuarios.
El sistema de autenticación ha sido migrado completamente."

git tag v2.0.0

# 6. Notificar a usuarios (email, avisos)
# 7. Deploy
npm start

# ⚠️ Los usuarios verán actualización crítica
```

**Resultado:**
- ✅ Cambio mayor implementado
- ✅ Versión: `2.0.0`
- ✅ Usuarios notificados de cambio importante
- ✅ Documentación actualizada

---

## 🔄 Escenario 4: Múltiples cambios sin actualización

**Situación:** Trabajando en varias mejoras a lo largo de la semana.

```bash
# Lunes: Ajustar estilos
git add .
git commit -m "style: ajustar padding en cards"
# ❌ NO incrementar versión todavía

# Martes: Optimizar queries
git add .
git commit -m "perf: optimizar consultas de reportes"
# ❌ NO incrementar versión todavía

# Miércoles: Agregar validaciones
git add .
git commit -m "feat: agregar validaciones en formularios"
# ❌ NO incrementar versión todavía

# Jueves: Revisar todo y decidir versión
# Hay una nueva característica (validaciones) → minor
npm run version:minor
# ✅ 1.1.0 → 1.2.0

git add .
git commit -m "chore: bump version to 1.2.0

Cambios en esta versión:
- Ajustes en estilos
- Optimización de queries
- Nuevas validaciones en formularios"

git tag v1.2.0

# Viernes: Deploy
npm run build
npm start

# ✨ Usuarios ven todos los cambios de la semana
```

**Resultado:**
- ✅ Múltiples mejoras agrupadas en una versión
- ✅ Un solo modal de actualización
- ✅ Mejor experiencia de usuario (no interrupciones constantes)

---

## 🧪 Escenario 5: Testing de actualizaciones

**Situación:** Quieres probar el sistema de actualizaciones.

```bash
# 1. Estado inicial
npm run build
npm start
# Versión actual: 1.0.0

# 2. En otra terminal, incrementar versión
npm run version:patch
# ✅ 1.0.0 → 1.0.1

# 3. Rebuild
npm run build

# 4. En el navegador:
# - Espera 1-2 minutos (o recarga la página)
# - El Service Worker detectará la nueva versión
# - Navega al dashboard
# - Verás el modal de actualización

# 5. Hacer clic en "Actualizar ahora"
# - La app se recarga
# - Versión actualizada: 1.0.1

# 6. Verificar en DevTools
# F12 → Application → Service Workers
# Verás: frontend-business-suite-v1-0-1
```

---

## 📊 Escenario 6: Sincronización con Git tags

**Situación:** Mantener sincronizadas las versiones con Git.

```bash
# Script completo de release
#!/bin/bash

# 1. Asegurar que estamos en main
git checkout main
git pull

# 2. Incrementar versión
npm run version:minor

# 3. Obtener la nueva versión
VERSION=$(node -p "require('./package.json').version")

# 4. Build
npm run build

# 5. Commit y tag
git add .
git commit -m "chore: release v${VERSION}"
git tag "v${VERSION}"

# 6. Push
git push origin main
git push origin "v${VERSION}"

# 7. Deploy
npm start

echo "✅ Release v${VERSION} completado"
```

Guarda esto como `scripts/release.sh` y hazlo ejecutable:
```bash
chmod +x scripts/release.sh
./scripts/release.sh
```

---

## 🎯 Mejores Prácticas

### ✅ DO - Hacer

1. **Incrementar versión antes de deploy importante**
   ```bash
   npm run version:minor && npm run build
   ```

2. **Agrupar cambios relacionados**
   ```bash
   # Varios commits → Una versión
   git commit -m "fix: bug 1"
   git commit -m "fix: bug 2"
   npm run version:patch
   ```

3. **Usar mensajes de commit descriptivos**
   ```bash
   git commit -m "feat: agregar reporte X con filtros Y y Z"
   ```

4. **Testing antes de incrementar versión**
   ```bash
   npm run dev  # Probar en desarrollo
   npm run build && npm start  # Probar en producción
   npm run version:minor  # Solo si todo funciona
   ```

### ❌ DON'T - Evitar

1. **Incrementar versión en cada commit**
   ```bash
   # ❌ Malo
   git commit -m "fix typo"
   npm run version:patch
   git commit -m "fix another typo"
   npm run version:patch
   ```

2. **Olvidar el build después de incrementar**
   ```bash
   # ❌ Malo
   npm run version:minor
   # ... y olvidar hacer npm run build
   ```

3. **Incrementar versión en desarrollo**
   ```bash
   # ❌ Malo
   npm run dev
   npm run version:patch  # Innecesario en desarrollo
   ```

4. **Usar versión incorrecta para el tipo de cambio**
   ```bash
   # ❌ Malo - breaking change con versión minor
   # Cambio que rompe compatibilidad
   npm run version:minor  # Debería ser major
   ```

---

## 📝 Plantilla de CHANGELOG

Mantén un archivo `CHANGELOG.md`:

```markdown
# Changelog

Todos los cambios notables de este proyecto serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.0] - 2024-01-15

### Added
- Nuevo reporte de facturas por forma de pago
- Filtros por fecha y estado en reportes
- Resumen consolidado por tienda

### Fixed
- Corrección en cálculo de totales con múltiples monedas
- Ajuste en formato de fechas

### Changed
- Mejora en rendimiento de queries de reportes

## [1.1.0] - 2024-01-10

### Added
- Sistema de versionado automático para PWA
- Modal de actualización en dashboard

### Fixed
- Error en validación de formularios

## [1.0.0] - 2024-01-05

### Added
- Versión inicial del sistema
- Autenticación con Firebase
- Gestión de facturas
- Gestión de inventario
```

---

## 🎓 Resumen

**Comandos principales:**
```bash
npm run version:patch  # Bugs y cambios menores
npm run version:minor  # Nuevas características
npm run version:major  # Cambios importantes
npm run build          # Siempre después de incrementar
```

**Flujo típico:**
```bash
# Desarrollo → Testing → Versión → Build → Deploy
npm run dev           # Desarrollar
# ... testing ...
npm run version:minor # Incrementar
npm run build         # Construir
npm start            # Deploy
```

**Recuerda:**
- ✅ Una versión = Uno o más cambios relacionados
- ✅ Testing antes de incrementar versión
- ✅ Build siempre después de incrementar
- ✅ Commit descriptivos y tags en Git

---

¡Listo para usar el sistema de versionado automático! 🚀

