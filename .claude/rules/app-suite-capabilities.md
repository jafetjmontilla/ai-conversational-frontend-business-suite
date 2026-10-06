---
paths:
  - "lib/app-suite/**"
  - "lib/data/appSuiteApps.ts"
  - "lib/hooks/useBusinessApps.ts"
  - "components/app-suite/**"
  - "lib/navigation/businessNav.ts"
  - "lib/queries/business.ts"
  - "contexts/BusinessProvider.tsx"
  - "lib/hooks/useBusinessRealtimeSync.ts"
---
<!-- GENERADO por scripts/sync-agent-rules.mjs desde la fuente única (.cursor/rules/app-suite-capabilities.mdc del repo raíz ai-conversational) — no editar aquí -->

> Apps instaladas, capacidades del negocio y FeatureGate (Suite de aplicaciones)

# Suite de aplicaciones y capacidades

## Modelo mental

Dos dimensiones independientes:

| Dimensión | Pregunta | Implementación |
|-----------|----------|----------------|
| **RBAC** | ¿Puede este **usuario** hacer la acción? | `useAllowed()`, `negocio:ver`, `negocio:editar`, etc. |
| **Apps / capabilities** | ¿Tiene este **negocio** la funcionalidad? | `Business.installedApps` → `capabilities` |

No mezclar permisos de rol con apps en `DEFAULT_PERMISSIONS`.

## Fuente de verdad

- **Backend:** `api-business-suite/src/lib/appSuite.ts`
- **Frontend:** `frontend-business-suite/lib/app-suite/capabilities.ts`

Al agregar app o capability, **actualizar ambos archivos** con los mismos ids y mappings.

### Datos en Mongo

```ts
Business.installedApps: BusinessInstalledApp[]  // default []

type BusinessInstalledApp = {
  app_id: string;                    // ej. "tienda-online"
  status: "active" | "suspended" | "uninstalled";
  limits: {
    max_records: number;
    current_usage: number;
    features_enabled: string[];      // flags opcionales por app/plan
  };
  installed_at: Date;
  updated_at: Date;
  uninstalled_at: Date | null;       // soft uninstall
  billing_cycle_ends: Date | null;
};
```

- Solo `status === "active"` otorga capabilities y aparece en menú.
- **Install:** crea registro o reactiva uno `uninstalled` (nuevo ciclo de billing).
- **Uninstall:** soft — `status: uninstalled`, `uninstalled_at: now` (no borrar el registro).
- Negocio nuevo: `installedApps: []` hasta instalar desde Suite.
- Helpers backend: `createInstalledAppRecord`, `markAppUninstalled`, `reactivateInstalledAppRecord` en `appSuite.ts`.

### GraphQL

- Query: `getBusiness.installedApps` — consumir vía `useBusiness` / `useBusinessApps` (React Query), no fetch manual
- Mutations: `installBusinessApp(id, appId)`, `uninstallBusinessApp(id, appId)` (requiere `business_admin` o rol sistema)

### Caché y sync en tiempo real (install / uninstall)

- Tras install/uninstall **local**: `queryClient.setQueryData(businessQueryKeys.detail(slug), merged)` con la respuesta de la mutación — **no** `refetch()` extra
- Sidebar y páginas leen la misma caché (`useBusinessApps`); el menú se actualiza sin recargar la página
- Tras install/uninstall **desde otro cliente** (otro usuario, agente, UI de IA): la API emite `business:updated` (`scope: 'apps'`, `installedApps`) → `useBusinessRealtimeSync` parchea la caché
- Backend: llamar `emitBusinessAppsUpdated(business.businessId, installedApps)` en el resolver **después** de `save()` — venga quien venga la mutación
- Room Socket.IO: `business:${businessId}` (slug, no `_id` de Mongo)
- Toast opcional si `actor === 'agent'`; el usuario que mutó localmente ya recibe toast de la mutación

## Capabilities

Claves en `CAPABILITIES` (ej. `product.sellable`, `product.rawMaterial`).

Cada app declara qué desbloquea en `APP_CAPABILITIES`.  
Qué apps habilitan una capability: `CAPABILITY_REQUIRED_APPS` (lógica **OR**).

## Reglas de UX (obligatorias)

### 1. Menú / sidebar / rutas

- **Ocultar** ítems cuya app no esté instalada.
- En `businessNav.ts`: `requiredAnyApps?: string[]` en `NavItem`.
- Filtrar con `isAppInstalled(installedApps, appId)` — ver `filterItemsByInstalledApps`.
- **Core** (sin `requiredAnyApps`): Resumen, Suite de aplicaciones, Datos del negocio, Usuarios, Canales, Logs.

### 2. Formularios, switches, botones, secciones

- **Siempre mostrar** el control aunque la app no esté instalada.
- Si falta capability: control **deshabilitado** + texto que nombre la(s) app(s) + enlace a `/{businessId}/app-suite`.
- **No ocultar** opciones por app faltante (salvo en menú).

Usar:

- `useBusinessApps(businessSlug)` → `can(capability)`, `hasApp(appId)`, `installedApps`
- `<FeatureGate capability="..." installedApps={...} businessId={...}>` para bloques genéricos
- `ProductSellableField` como referencia para campos compuestos (varias capabilities)
- Copy centralizado en `lib/app-suite/featureCopy.ts`

## Backend: validar siempre

La UI no basta. En mutations que dependan de una capability:

```ts
import { assertProductSellableFlags } from '../../lib/appSuite';
const business = await ModelBusiness.findById(id);
assertProductSellableFlags(business.installedApps, isSellable);
```

Mensajes de error deben coincidir con los hints del frontend.

## Checklist al añadir funcionalidad gated

1. Definir `Capability` en backend + frontend.
2. Asignar a app(s) en `APP_CAPABILITIES` y `CAPABILITY_REQUIRED_APPS`.
3. Registrar app en `APP_SUITE_MODULES` (`lib/data/appSuiteApps.ts`) si es nueva en el catálogo.
4. Si tiene ruta ERP: `routePath` + `requiredAnyApps` en `businessNav.ts`.
5. UI: `FeatureGate` o campo dedicado con hint (no `display: none`).
6. API: validación en mutation/resolver + `emitBusinessAppsUpdated` si afecta `installedApps`.
7. Probar: negocio sin apps, negocio con app instalada, desinstalar y verificar menú + formularios (sin F5).
8. Probar sync: dos pestañas o mutación vía API/agente → menú actualizado vía WebSocket.

## Hooks y componentes

```tsx
const { installedApps, can, hasApp, installApp, uninstallApp } = useBusinessApps(businessSlug);

if (!can("product.sellable")) { /* deshabilitar + hint */ }
```

```tsx
<FeatureGate capability="supplier.manage" installedApps={installedApps} businessId={businessId}>
  <SupplierSelect ... />
</FeatureGate>
```

## Catálogo de apps

Metadatos (título, icono, descripción): `lib/data/appSuiteApps.ts`  
Lógica de negocio (capabilities, validación): `lib/app-suite/capabilities.ts` + `api-business-suite/src/lib/appSuite.ts`
