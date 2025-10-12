#!/usr/bin/env node

/**
 * Script para incrementar la versión del proyecto
 * y actualizar automáticamente el Service Worker
 * 
 * Uso:
 *   npm run version:patch  -> 1.0.0 → 1.0.1
 *   npm run version:minor  -> 1.0.0 → 1.1.0
 *   npm run version:major  -> 1.0.0 → 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Obtener el tipo de incremento (patch, minor, major)
const bumpType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  log('❌ Error: Tipo de versión inválido. Usa: patch, minor o major', 'red');
  process.exit(1);
}

try {
  // Leer package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version;

  // Incrementar versión
  const [major, minor, patch] = oldVersion.split('.').map(Number);
  let newVersion;

  switch (bumpType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  log('\n🚀 Incrementando versión del proyecto...', 'blue');
  log(`   Tipo: ${bumpType.toUpperCase()}`, 'cyan');
  log(`   Versión anterior: ${oldVersion}`, 'yellow');
  log(`   Nueva versión: ${newVersion}`, 'green');

  // Actualizar package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  log('\n✅ package.json actualizado', 'green');

  // Ejecutar script de actualización del service worker
  log('\n🔄 Actualizando Service Worker...', 'blue');
  execSync('node scripts/update-sw-version.js', { stdio: 'inherit' });

  log(`\n✨ Versión incrementada exitosamente: ${oldVersion} → ${newVersion}`, 'green');
  log('\n📋 Próximos pasos:', 'cyan');
  log('   1. Revisa los cambios en service-worker.js', 'reset');
  log('   2. Ejecuta: npm run build', 'reset');
  log('   3. Commit los cambios: git add . && git commit -m "chore: bump version to ' + newVersion + '"', 'reset');
  log('   4. Tag la versión: git tag v' + newVersion, 'reset');
  log('\n');

} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
}

