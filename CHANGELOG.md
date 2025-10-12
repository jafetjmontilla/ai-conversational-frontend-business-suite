# Changelog

Todos los cambios notables de este proyecto serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2024-10-12

### Added

#### PWA - Sistema de Versionado Automático ⭐
- Sistema completo de versionado automático para PWA
- Scripts de Node.js para gestión de versiones:
  - `update-sw-version.js` - Actualiza versión del Service Worker
  - `bump-version.js` - Incrementa versión del proyecto
- Comandos npm para versionado:
  - `npm run version:patch` - Incrementar versión patch
  - `npm run version:minor` - Incrementar versión minor
  - `npm run version:major` - Incrementar versión major
  - `npm run pwa:version` - Actualizar versión manualmente
- Integración automática con `npm run build`
- Sincronización con versión de `package.json`

#### PWA - Modal de Actualización
- Hook personalizado `usePWAUpdate` para detectar actualizaciones
- Componente `PWAUpdateDialog` con UI elegante (shadcn/ui)
- Verificación automática al entrar al dashboard
- Opciones de actualizar inmediatamente o postergar
- Recarga automática al aceptar actualización

#### Reportes
- Nuevo reporte de facturas por forma de pago (`/reportInvoices`)
- Agrupación por tienda (Guardians/Jaihom)
- Discriminación por método de pago
- Totales en USD y Bs
- Resumen consolidado general
- Filtros por fecha, estado y búsqueda
- Restricciones por rol de usuario

### Changed
- `npm run build` ahora actualiza automáticamente la versión del Service Worker
- Menú de navegación incluye nuevo reporte de facturas
- Service Worker actualizado con comentarios de versión y fecha

### Documentation
- Nueva documentación completa de PWA:
  - `docs/PWA.md` - Guía completa (actualizada)
  - `docs/PWA-VERSIONING.md` - Sistema de versionado
  - `docs/WORKFLOW-EXAMPLE.md` - Ejemplos prácticos
  - `docs/INDEX.md` - Índice de documentación
- Documentación de scripts:
  - `scripts/README.md` - Scripts de automatización
- README.md actualizado con sección de PWA
- CHANGELOG.md creado

### Technical Details

#### Archivos Creados
```
hooks/
└── usePWAUpdate.ts              # Hook de detección de actualizaciones

components/
└── PWAUpdateDialog.tsx          # Modal de actualización

scripts/
├── update-sw-version.js         # Actualizar versión SW
├── bump-version.js              # Incrementar versión proyecto
└── README.md                    # Documentación scripts

app/(sidebar)/
└── reportInvoices/
    └── page.tsx                 # Reporte de facturas

docs/
├── PWA-VERSIONING.md           # Guía de versionado
├── WORKFLOW-EXAMPLE.md         # Ejemplos prácticos
└── INDEX.md                    # Índice documentación
```

#### Archivos Modificados
```
package.json                     # Nuevos scripts agregados
public/service-worker.js        # Versiones actualizadas
public/register-sw.js           # Removido confirm() nativo
app/(sidebar)/dashboard/page.tsx # Integración modal
components/navigation/AppSidebar.tsx # Nuevo item menú
docs/PWA.md                     # Documentación actualizada
README.md                       # Sección PWA agregada
```

### Migration Guide

No se requieren cambios de migración. El sistema es retrocompatible.

#### Para empezar a usar el versionado:

```bash
# 1. Incrementar versión cuando hagas cambios importantes
npm run version:minor

# 2. Build (actualiza automáticamente)
npm run build

# 3. Deploy
npm start

# ✨ Los usuarios verán el modal de actualización
```

### Breaking Changes

Ninguno. Todos los cambios son aditivos.

### Deprecations

- Editar manualmente las versiones en `service-worker.js` está deprecado
- Usar `confirm()` nativo para actualizaciones está deprecado
- Usar: `npm run version:patch` en su lugar

---

## Versiones Anteriores

### [Pre-1.0.0]
- Sistema base de PWA manual
- Autenticación con Firebase
- Gestión de facturas e inventario
- Reporte de pagos
- Sistema de temas

---

## Notas de Versión

### Semantic Versioning

Este proyecto sigue Semantic Versioning (semver):

- **MAJOR** (X.0.0): Cambios que rompen compatibilidad
- **MINOR** (0.X.0): Nuevas características compatibles
- **PATCH** (0.0.X): Corrección de bugs

### Cómo Contribuir al Changelog

Al hacer cambios, actualiza este archivo siguiendo el formato:

```markdown
## [Unreleased]

### Added
- Nueva característica X

### Changed
- Mejora en componente Y

### Fixed
- Corrección de bug Z
```

Cuando se haga release, cambia `[Unreleased]` por `[X.Y.Z] - YYYY-MM-DD`.

---

**Mantenido por:** sistemasJaihom Team

**Última actualización:** 2024-10-12

