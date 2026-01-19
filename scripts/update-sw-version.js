#!/usr/bin/env node

/**
 * Script para actualizar automáticamente la versión del Service Worker
 * basándose en la versión del package.json
 * 
 * Uso:
 *   node scripts/update-sw-version.js
 *   npm run pwa:version
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

try {
  // Leer package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  log('\n🔄 Actualizando versión del Service Worker...', 'blue');
  log(`📦 Versión del package.json: ${version}`, 'yellow');

  // Leer el service-worker.js
  const swPath = path.join(__dirname, '..', 'public', 'service-worker.js');
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Reemplazar las versiones de los cachés
  const versionSuffix = `v${version.replace(/\./g, '-')}`;

  swContent = swContent.replace(
    /const CACHE_NAME = ['"]4net-erp-erp-v[^'"]+['"]/,
    `const CACHE_NAME = '4net-erp-erp-${versionSuffix}'`
  );

  swContent = swContent.replace(
    /const RUNTIME_CACHE = ['"]4net-erp-runtime-v[^'"]+['"]/,
    `const RUNTIME_CACHE = '4net-erp-runtime-${versionSuffix}'`
  );

  swContent = swContent.replace(
    /const IMAGE_CACHE = ['"]4net-erp-images-v[^'"]+['"]/,
    `const IMAGE_CACHE = '4net-erp-images-${versionSuffix}'`
  );

  // Agregar comentario con la versión y fecha
  const date = new Date().toISOString();
  const versionComment = `// Service Worker Manual para PWA - 4NET-ERP\n// Versión: ${version} - Generado: ${date}\n`;

  swContent = swContent.replace(
    /\/\/ Service Worker Manual para PWA - 4NET-ERP\n/,
    versionComment
  );

  // Escribir el archivo actualizado
  fs.writeFileSync(swPath, swContent, 'utf8');

  log(`✅ Service Worker actualizado a versión ${version}`, 'green');
  log(`   - CACHE_NAME: 4net-erp-erp-${versionSuffix}`, 'reset');
  log(`   - RUNTIME_CACHE: 4net-erp-runtime-${versionSuffix}`, 'reset');
  log(`   - IMAGE_CACHE: 4net-erp-images-${versionSuffix}`, 'reset');
  log('\n✨ Listo! Ahora ejecuta "npm run build" para aplicar los cambios.\n', 'green');

} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
}

