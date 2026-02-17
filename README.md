# Frontend Business Suite

Aplicación web frontend para **Frontend Business Suite**, construida con Next.js, TypeScript, Tailwind CSS y Firebase. Conecta con la API **Api Business Suite** (https://api-v1-business-suite.sistemasjaihom.com).

**URL producción:** https://suite.sistemasjaihom.com

## Características

- **Next.js 14** con App Router
- **TypeScript**, **Tailwind CSS**
- **Firebase Authentication** (email/contraseña y Google)
- **Context API** para estado y autenticación
- **Axios** para la API (Api Business Suite)
- **Socket.IO** para notificaciones en tiempo real (`NEXT_PUBLIC_WEBSOCKET_URL`)
- **PWA** con versionado automático (instalable, caché, modal de actualización)

## Prerrequisitos

- Node.js (v16+)
- npm o yarn
- Proyecto Firebase configurado

## Instalación

1. **Clonar e instalar**
```bash
cd frontend-business-suite
npm install
```

2. **Variables de entorno**
```bash
cp environment.local.example .env.local
```

Editar `.env.local`:
```env
# Api Business Suite (backend)
NEXT_PUBLIC_API_URL=http://localhost:2000
# Producción: https://api-v1-business-suite.sistemasjaihom.com

# WebSocket (Socket.IO)
NEXT_PUBLIC_WEBSOCKET_URL=
# Producción: https://api-v1-business-suite.sistemasjaihom.com

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... resto de Firebase
```

## Desarrollo

```bash
npm run dev    # http://localhost:3010
npm run build
npm start
```

## Estructura de rutas (sidebar)

- **Dashboard** — `/dashboard`
- **Televisión** — `/streaming` (según permisos)
- **Notificaciones** — `/notifications`
- **Usuarios** — `/users` (admin)
- **Demo componentes** — `/theme-demo` (admin)
- **Perfil** — `/profile`

Páginas públicas: `/login`, `/register`, `/register-invitation`.

## Scripts

- `npm run dev` — Desarrollo
- `npm run build` — Build (actualiza versión PWA)
- `npm run lint` — Linter
- `npm run pwa:version` — Actualizar versión del Service Worker
- `npm run version:patch|minor|major` — Incrementar versión
- `npm run release:patch|minor|major` — Versión + commit + tag + push

## Documentación

- [docs/INDEX.md](docs/INDEX.md) — Índice de documentación
- [docs/PWA.md](docs/PWA.md) — PWA
- [docs/PWA-VERSIONING.md](docs/PWA-VERSIONING.md) — Versionado PWA
- [docs/VERCEL-DEPLOY.md](docs/VERCEL-DEPLOY.md) — Deploy en Vercel
- [scripts/README.md](scripts/README.md) — Scripts de automatización

## Integración con backend

- **API:** `NEXT_PUBLIC_API_URL` → Api Business Suite (GraphQL en `/graphql`, REST en `/api/notifications`, `/api/worker`)
- **WebSocket:** `NEXT_PUBLIC_WEBSOCKET_URL` → mismo origen en producción para Socket.IO

## Licencia

MIT — ver [LICENSE](LICENSE).
