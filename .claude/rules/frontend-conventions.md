---
paths:
  - "app/**"
  - "components/**"
  - "lib/**"
  - "contexts/**"
  - "hooks/**"
---
<!-- GENERADO por scripts/sync-agent-rules.mjs desde la fuente única (.cursor/rules/frontend-conventions.mdc del repo raíz ai-conversational) — no editar aquí -->

> Convenciones y patrones del frontend

# Convenciones Frontend

Proyecto: `frontend-business-suite/` (Next.js 14, puerto **3010**).

## Estructura de Archivos

```
frontend-business-suite/
├── app/                              ← App Router
│   ├── (public)/                     ← Rutas públicas: login, register, register-invitation
│   ├── (sidebar)/                    ← Rutas autenticadas con sidebar
│   │   ├── dashboard/, businesses/, users/, profile/, theme-demo/
│   │   └── [businessId]/             ← Rutas por negocio (catalog, billing, knowledge, ai, ops, etc.)
│   ├── layout.tsx                    ← Providers globales (Theme, Auth, AuthGuard)
│   ├── page.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                           ← shadcn/ui (Radix + Tailwind) — primitivos reutilizables
│   ├── auth/                         ← LoginForm, RegisterStep1/2, PasswordRecovery, RegisterInvitation
│   ├── layouts/                      ← SidebarLayout, SectionTabLayout
│   ├── navigation/                   ← AppSidebar
│   ├── billing/, catalog/, inventory/, invoice/, business-config/
│   ├── ops/, pae/, profile/, users/, user-memories/
│   └── [raíz]                        ← AuthGuard, BusinessFormCreateEdit, modales compartidos, etc.
├── contexts/                         ← AuthContext, WebSocketContext, QueryProvider, BusinessProvider, ThemeContext
├── hooks/                            ← usePWAUpdate, use-mobile
├── lib/
│   ├── firebase.ts                   ← Firebase client SDK (auth, getIdToken)
│   ├── api.ts                        ← Instancias Axios + interceptores (Bearer token)
│   ├── Fetching.ts                   ← fetchApiV1() + objeto queries (GraphQL centralizado)
│   ├── interfases.ts                 ← Tipos, roles y PermissionConfig
│   ├── utils.ts                      ← cn() y utilidades
│   ├── navigation/                   ← businessNav.ts (menú por negocio)
│   ├── queries/                      ← Claves React Query + fetchers (ej. business.ts)
│   ├── hooks/                        ← useAllowed, useWebSocket, useBusiness, useBusinessApps, useBusinessRealtimeSync
│   ├── schemas/                      ← Schemas Zod por módulo (ej. invoice.ts)
│   └── types/                        ← Tipos auxiliares (businessRealtime, knowledgeTypes, etc.)
├── types/                            ← Declaraciones .d.ts (ej. react-file-icon)
├── scripts/                          ← update-sw-version.js, bump-version.js, release.sh
├── vitest.config.ts
├── vitest.setup.ts
└── middleware.ts                     ← Pass-through (protección real en AuthGuard cliente)
```

## Importaciones

- **SIEMPRE** usar `@/` para importaciones absolutas desde la raíz del frontend
- **NUNCA** usar rutas relativas largas (`../../../`)
- Alias en `tsconfig.json`: `"@/*" → "./*"`

## Componentes

### Component Driven Development (CDD)
- Construir UI de abajo arriba: átomos → moléculas → organismos → páginas
- Primitivos en `components/ui/`; compuestos por dominio en subcarpetas de `components/`
- Variantes con CVA (`class-variance-authority`)
- Usar `cn()` de `lib/utils.ts` para combinar clases Tailwind
- Páginas delgadas: lógica de negocio en componentes `*Content.tsx` del dominio

### shadcn/ui
- Componentes copiados en `components/ui/` — se pueden modificar
- Usar `Form` de shadcn para formularios (integra RHF + accesibilidad)
- Notificaciones con `sonner` (`components/ui/sonner.tsx`)

## Formularios

- Stack: React Hook Form + Zod + `@hookform/resolvers`
- Schemas en `lib/schemas/[módulo].ts`
- **SIEMPRE** inferir tipos con `z.infer<typeof schema>`, nunca duplicar interfaces manuales
- Usar `zodResolver(schema)` en `useForm()`

## GraphQL

- **NO** usar Apollo Client
- Queries centralizadas en `lib/Fetching.ts` (objeto `queries`)
- Consumir vía `fetchApiV1({ query, variables, type: 'json' | 'formData' })`
- Axios en `lib/api.ts` con interceptor que adjunta Firebase `idToken` en `Authorization: Bearer`
- API base: `NEXT_PUBLIC_API_URL` (default `http://localhost:2000`)
- Soporte uploads GraphQL con `type: 'formData'` (multipart)
- Tipos manuales en `lib/interfases.ts` y `lib/types/` (sin GraphQL Codegen)

## Autenticación

- Firebase client SDK en `lib/firebase.ts` (email/password + Google)
- `AuthContext` expone: `user`, `authUser` (customClaims), `meData` (getMe: user + business + businessRole), `signIn`, `signInGoogle`, `logout`, `getToken`
- Protección de rutas con `AuthGuard` (cliente, `ssr: false` en layout) — **no** depende de session cookie en middleware
- Rutas públicas: `/login`, `/register`, `/register-invitation`, `/forgot-password`
- Redirección por rol:
  - Roles de sistema (`system_admin`, `system_operator`, `system_viewer`) → `/dashboard`
  - Roles de negocio → `/{businessId}` del primer negocio asignado
- `middleware.ts` solo filtra estáticos; no valida sesión
- Formularios de auth en `components/auth/`, páginas en `app/(public)/`

## RBAC

- Hook `useAllowed()` en `lib/hooks/useAllowed.ts`: `can()`, `canAll()`, `canAny()`, `hasRole()`, `hasAnyRole()`, `getCurrentRole()`
- Permisos en mapa estático `DEFAULT_PERMISSIONS` (formato `recurso:acción`)
- Roles de sistema: `system_admin`, `system_operator`, `system_viewer`
- Roles de negocio: `business_admin`, `business_editor`, `business_viewer`
- Hooks auxiliares: `useBusinessPermissions`, `useSystemPermissions`, `useConfigPermissions`, `useBusinessRole`, `useMyBusinesses`
- Pasar `businessRole` a `useAllowed({ businessRole })` en rutas `/{businessId}/*`

## Estado Global

- React Context para auth/tema/socket; **datos de servidor** vía **TanStack React Query** (`@tanstack/react-query`)
- `AuthProvider` en `app/layout.tsx`
- `QueryProvider` + `WebSocketProvider` en `app/(sidebar)/providers.tsx` (rutas con sidebar)
- `BusinessProvider` en `SidebarLayout` cuando hay `businessId` activo (sync WS → caché)
- Tema con `next-themes` (`ThemeProvider` en layout); `ThemeContext` como wrapper opcional
- Socket estable en refs dentro de `WebSocketContext`; estado reactivo separado

## React Query (estado de servidor)

- **NO** usar `useState` + `useEffect` para `getBusiness` ni duplicar fetch del negocio en componentes
- Claves centralizadas en `lib/queries/` (ej. `businessQueryKeys.detail(slug)` → `['business', slug]`)
- Fetcher compartido: `fetchBusinessBySlug` en `lib/queries/business.ts`
- Lectura: `useBusiness(businessSlug)` envuelve `useQuery` (dedup automático entre sidebar, layout y páginas)
- Apps/capabilities: `useBusinessApps(businessSlug)` — derivar de `useBusiness`, no fetch propio
- `staleTime` del negocio: `BUSINESS_STALE_TIME_MS` (60s) — navegación interna sin refetch hasta evento WS o focus
- Mutaciones locales: `useMutation` + `queryClient.setQueryData` con la respuesta GraphQL; **evitar** `refetch()` redundante tras éxito
- Al migrar otros módulos (inventario, knowledge): misma convención de claves `['entidad', businessId, ...]`

## Estilos

- Tailwind CSS con variables CSS HSL en `app/globals.css`
- Tokens mapeados en `tailwind.config.js` (primary, wellness, background, foreground, etc.)
- Dark/light con `next-themes` (`attribute="class"`, `storageKey="4netERP-theme"`)
- Colores como variables HSL: `hsl(var(--primary))`, clases `dark:` para modo oscuro
- Fuente: Manrope (Google Fonts en layout)

## WebSocket

- Socket.IO centralizado en `WebSocketContext` + hook `lib/hooks/useWebSocket.ts`
- Auth con Firebase `idToken` (mismo token que GraphQL)
- URL: `NEXT_PUBLIC_WEBSOCKET_URL`
- Reconexión automática con backoff de **2s**
- Renovación proactiva de token cada **5 min** (`getIdToken(true)`)
- Eventos: notificaciones, streaming, tickets colaborativos, knowledge (`protocolDraft:updated`), negocio (`business:updated`)
- **Sync de negocio:** un solo listener en `useBusinessRealtimeSync` (montado vía `BusinessProvider`), no en cada página
- Suscripción: `subscribeToBusiness(businessId)` → room `business:${businessId}`
- Payload tipado: `BusinessUpdatedPayload` en `lib/types/businessRealtime.ts` (`scope`, `actor`, `installedApps?`)
- Al recibir evento: `setQueryData` si hay payload completo; si no, `invalidateQueries` — **no** usar `router.refresh()` para sync colaborativo
- `onReconnect` debe devolver unsubscribe; al reconectar, invalidar queries del negocio activo
- Origen del cambio (usuario, agente, otro cliente): da igual en el front — la API emite tras mutar

## PWA

- Service Worker custom en `public/service-worker.js` (no Serwist/next-pwa)
- Registro en `public/register-sw.js`, cargado desde `app/layout.tsx`
- `hooks/usePWAUpdate.ts` + `PWAUpdateDialog` para actualizaciones
- Versión del SW actualizada en build vía `scripts/update-sw-version.js`
- **NO** cachear respuestas GraphQL en el Service Worker

## Testing

- Vitest + Testing Library + jsdom
- Tests colocalizados: `**/*.test.{ts,tsx}` (ej. `lib/utils.test.ts`)
- Config en `vitest.config.ts`, setup en `vitest.setup.ts`
- Comandos: `npm test`, `npm run test:watch`, `npm run test:coverage`

## Variables de Entorno Clave

- `NEXT_PUBLIC_API_URL` — API Business Suite (GraphQL)
- `NEXT_PUBLIC_WEBSOCKET_URL` — Socket.IO
- `NEXT_PUBLIC_FIREBASE_*` — Config Firebase
- `NEXT_PUBLIC_APP_URL` — URL base en desarrollo
