# Scripts del Proyecto 🛠️

Scripts de automatización para el proyecto 4NET-ERP.

## 📂 Archivos

### `update-sw-version.js`

Actualiza automáticamente la versión del Service Worker basándose en `package.json`.

**Uso:**
```bash
npm run pwa:version
```

**Qué hace:**
1. Lee la versión del `package.json`
2. Actualiza las constantes de caché en `service-worker.js`:
   - `CACHE_NAME`
   - `RUNTIME_CACHE`
   - `IMAGE_CACHE`
3. Agrega comentario con versión y fecha de generación

**Ejemplo:**
```javascript
// Versión en package.json: 1.2.3
// Resultado en service-worker.js:
const CACHE_NAME = 'jaihom-erp-v1-2-3';
const RUNTIME_CACHE = 'jaihom-runtime-v1-2-3';
const IMAGE_CACHE = 'jaihom-images-v1-2-3';
```

### `bump-version.js`

Incrementa la versión del proyecto y actualiza el Service Worker automáticamente.

**Uso:**
```bash
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.0 → 1.1.0
npm run version:major  # 1.0.0 → 2.0.0
```

**Qué hace:**
1. Incrementa la versión en `package.json` según el tipo
2. Ejecuta `update-sw-version.js`
3. Muestra instrucciones para commit y tag

**Flujo completo:**
```bash
# Incrementar versión
npm run version:minor

# Build
npm run build

# Commit y tag
git add .
git commit -m "feat: nueva característica"
git tag v1.1.0
git push && git push --tags
```

## 🔄 Integración con build

El comando `npm run build` ejecuta automáticamente `update-sw-version.js` antes de construir:

```json
"build": "node scripts/update-sw-version.js && next build"
```

Esto garantiza que el Service Worker siempre tenga la versión correcta.

## 📚 Documentación adicional

- [PWA Documentation](../docs/PWA.md)
- [PWA Versioning](../docs/PWA-VERSIONING.md)

## 🐛 Troubleshooting

### Error: Cannot find module

Asegúrate de estar en el directorio raíz del proyecto:
```bash
cd /root/facturador/frontend-facturador
npm run pwa:version
```

### Los scripts no se ejecutan

Verifica los permisos:
```bash
chmod +x scripts/*.js
```

### La versión no se actualiza

1. Verifica que el `package.json` tenga la versión correcta
2. Ejecuta manualmente: `node scripts/update-sw-version.js`
3. Revisa los logs en la consola

## 💡 Tips

- **Desarrollo normal**: No necesitas incrementar versión en cada cambio
- **Bug fixes**: Usa `version:patch`
- **Nuevas características**: Usa `version:minor`
- **Cambios importantes**: Usa `version:major`
- **Build automático**: `npm run build` actualiza versiones automáticamente

---

Creado como parte del sistema PWA de sistemasJaihom 🚀

