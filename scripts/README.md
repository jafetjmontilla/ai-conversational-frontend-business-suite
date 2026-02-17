# Scripts del Proyecto

Scripts de automatización para **Frontend Business Suite** (suite.sistemasjaihom.com).

## Archivos

### `update-sw-version.js`

Actualiza la versión del Service Worker según `package.json`.

**Uso:**
```bash
npm run pwa:version
```

**Qué hace:**
1. Lee la versión de `package.json`
2. Actualiza en `public/service-worker.js`:
   - `CACHE_NAME` → `frontend-business-suite-vX-Y-Z`
   - `IMAGE_CACHE` → `frontend-business-suite-images-vX-Y-Z`
3. Añade comentario con versión y fecha

### `bump-version.js`

Incrementa la versión del proyecto y actualiza el Service Worker.

**Uso:**
```bash
npm run version:patch   # 1.0.0 → 1.0.1
npm run version:minor   # 1.0.0 → 1.1.0
npm run version:major   # 1.0.0 → 2.0.0
```

## Integración con build

`npm run build` ejecuta `update-sw-version.js` antes de construir, así el Service Worker queda con la versión actual.

## Documentación

- [PWA](../docs/PWA.md)
- [PWA Versioning](../docs/PWA-VERSIONING.md)
