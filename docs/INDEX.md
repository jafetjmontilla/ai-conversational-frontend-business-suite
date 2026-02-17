# Índice de Documentación - Frontend Business Suite

Guía completa de toda la documentación del proyecto.

## 🎯 Guías Principales

### [README.md](../README.md)
**Descripción general del proyecto**
- Instalación y configuración
- Características principales
- Scripts disponibles
- Estructura del proyecto

---

## 📱 Progressive Web App (PWA)

### [PWA.md](./PWA.md)
**Guía completa de PWA**
- Descripción y características
- Estructura de archivos
- Service Worker y estrategias de caché
- Instalación en dispositivos
- Debugging y troubleshooting
- ⭐ Incluye información sobre versionado automático

### [PWA-VERSIONING.md](./PWA-VERSIONING.md) ⭐
**Sistema de versionado automático**
- Comandos de versionado (patch/minor/major)
- Flujo de trabajo recomendado
- Scripts de actualización
- Estrategia de versionado semántico
- Mejores prácticas
- Monitoreo de versiones

### [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md)
**Ejemplos prácticos de uso**
- Corrección de bugs (patch)
- Nuevas características (minor)
- Cambios importantes (major)
- Múltiples cambios sin actualización
- Testing de actualizaciones
- Sincronización con Git tags
- Mejores prácticas y anti-patrones

### [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md) 🚀
**Guía de deploy en Vercel**
- Cómo funciona el versionado en Vercel
- Comando release automatizado
- Flujo manual paso a paso
- Verificación de deploys
- Configuración de Vercel
- Casos de uso comunes
- Troubleshooting
- Best practices

---

## 🛠️ Scripts

### [scripts/README.md](../scripts/README.md)
**Documentación de scripts de automatización**
- `update-sw-version.js` - Actualiza versión del Service Worker
- `bump-version.js` - Incrementa versión del proyecto
- Integración con build
- Troubleshooting de scripts

---

## 🎨 Componentes y Hooks

### [lib/hooks/README.md](../lib/hooks/README.md)
**Hooks personalizados**
- `usePWAUpdate` - Hook para detectar actualizaciones de PWA
- Otros hooks del proyecto

---

## 🚀 Guías Rápidas

### Inicio Rápido

```bash
# Clonar e instalar
git clone [repo]
cd frontend-business-suite
npm install

# Configurar
cp .env.example .env
# Editar .env con tu configuración

# Desarrollar
npm run dev
```

### PWA - Inicio Rápido

```bash
# Build con versionado automático
npm run build

# Test en producción
npm start

# Incrementar versión
npm run version:patch  # o minor/major
```

### Versionado - Inicio Rápido

```bash
# Flujo completo
npm run version:minor    # Incrementar versión
npm run build           # Build con nueva versión
git add .               # Stage cambios
git commit -m "..."     # Commit
git tag v1.1.0         # Tag
git push --tags        # Push
npm start              # Deploy
```

---

## 📖 Por Tarea

### Quiero instalar el proyecto
→ [README.md](../README.md) - Sección "Instalación"

### Quiero entender la PWA
→ [PWA.md](./PWA.md) - Guía completa

### Quiero incrementar la versión
→ [PWA-VERSIONING.md](./PWA-VERSIONING.md) - Comandos de versionado

### Quiero ver ejemplos reales
→ [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Casos de uso

### Quiero entender los scripts
→ [scripts/README.md](../scripts/README.md) - Documentación de scripts

### Quiero agregar una nueva característica
1. [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Escenario 2
2. Desarrollar con `npm run dev`
3. `npm run version:minor`
4. `npm run build`
5. Deploy

### Quiero corregir un bug
1. [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Escenario 1
2. Arreglar código
3. `npm run version:patch`
4. `npm run build`
5. Deploy

### Quiero hacer un cambio importante
1. [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Escenario 3
2. Implementar cambios
3. `npm run version:major`
4. `npm run build`
5. Notificar usuarios
6. Deploy

### Quiero desplegar en Vercel
→ [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md) - Guía completa

### Quiero un deploy rápido en Vercel
1. `npm run release:minor` (o patch/major)
2. ✨ Vercel deploya automáticamente

---

## 🔗 Enlaces Externos

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Semantic Versioning](https://semver.org/)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)

---

## 📊 Estructura de Documentos

```
docs/
├── INDEX.md                    # 📍 Este archivo - Índice general
├── PWA.md                     # PWA - Guía completa
├── PWA-VERSIONING.md          # PWA - Sistema de versionado
└── WORKFLOW-EXAMPLE.md        # PWA - Ejemplos prácticos

scripts/
└── README.md                  # Scripts de automatización

lib/hooks/
└── README.md                  # Hooks personalizados

README.md                      # Raíz - Descripción general
```

---

## 🎯 Recomendaciones

### Para desarrolladores nuevos
1. Leer [README.md](../README.md) primero
2. Seguir la guía de instalación
3. Revisar [PWA.md](./PWA.md) para entender la PWA
4. Explorar [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) para casos prácticos

### Para desarrolladores experimentados
1. [PWA-VERSIONING.md](./PWA-VERSIONING.md) - Sistema de versionado
2. [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Mejores prácticas
3. [scripts/README.md](../scripts/README.md) - Scripts disponibles

### Para DevOps/Deploy
1. [PWA.md](./PWA.md) - Sección "Testing en local"
2. [PWA-VERSIONING.md](./PWA-VERSIONING.md) - Comandos de build
3. [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Escenario 6 (Git tags)

---

## ❓ FAQ

**¿Cómo incremento la versión?**
→ `npm run version:patch` (o minor/major)

**¿El build actualiza la versión automáticamente?**
→ Sí, `npm run build` ejecuta `update-sw-version.js` automáticamente

**¿Cuándo se muestra el modal de actualización?**
→ Al entrar al dashboard cuando hay una nueva versión

**¿Puedo saltarme actualizaciones?**
→ Sí, el usuario puede hacer clic en "Ahora no"

**¿Cómo funciona offline?**
→ Ver [PWA.md](./PWA.md) - Sección "Service Worker"

**¿Cómo pruebo actualizaciones?**
→ Ver [WORKFLOW-EXAMPLE.md](./WORKFLOW-EXAMPLE.md) - Escenario 5

---

## 📝 Notas

- Toda la documentación está en español
- Los ejemplos de código usan comentarios explicativos
- Las guías incluyen emojis para mejor navegación visual
- Los scripts incluyen mensajes coloridos en consola

---

**Última actualización:** 2024-01-15

**Versión de la documentación:** 1.0.0

**Mantenedores:** sistemasJaihom Team

