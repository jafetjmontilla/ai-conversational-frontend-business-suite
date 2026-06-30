/**
 * Capacidades desbloqueadas por apps instaladas.
 * Mantener sincronizado con api-business-suite/src/lib/appSuite.ts
 */

import { APP_SUITE_MODULES } from "@/lib/data/appSuiteApps";

export type InstalledAppStatus = "active" | "suspended" | "uninstalled";

export type BusinessInstalledAppLimits = {
  max_records: number;
  current_usage: number;
  features_enabled: string[];
};

export type BusinessInstalledApp = {
  app_id: string;
  status: InstalledAppStatus;
  limits: BusinessInstalledAppLimits;
  installed_at: string;
  updated_at: string;
  uninstalled_at: string | null;
  billing_cycle_ends: string | null;
};

export const CAPABILITIES = {
  PRODUCT_SELLABLE: "product.sellable",
  PRODUCT_RAW_MATERIAL: "product.rawMaterial",
  CATALOG_PUBLISH: "catalog.publish",
  BILLING_INVOICE: "billing.invoice",
  AI_BEHAVIOR: "ai.behavior",
  AI_KNOWLEDGE: "ai.knowledge",
  AI_TOOLS: "ai.tools",
  AI_MEMORY: "ai.memory",
  SUPPLIER_MANAGE: "supplier.manage",
  RECIPE_BOM: "recipe.bom",
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export type AppSuiteAppId = (typeof APP_SUITE_MODULES)[number]["id"];

export const APP_CAPABILITIES: Record<string, Capability[]> = {
  "gestion-citas": [],
  "organizador-eventos": [],
  "facturacion-inventario": [CAPABILITIES.BILLING_INVOICE],
  "gestion-proveedores": [CAPABILITIES.SUPPLIER_MANAGE],
  "gestion-insumos-materia-prima": [CAPABILITIES.PRODUCT_RAW_MATERIAL],
  "procesadora-alimentos": [CAPABILITIES.PRODUCT_RAW_MATERIAL, CAPABILITIES.RECIPE_BOM],
  "tienda-online": [CAPABILITIES.PRODUCT_SELLABLE, CAPABILITIES.CATALOG_PUBLISH],
  "productos-servicios": [],
  "agente-atencion-cliente": [
    CAPABILITIES.AI_BEHAVIOR,
    CAPABILITIES.AI_KNOWLEDGE,
    CAPABILITIES.AI_TOOLS,
  ],
  "agente-asistente-personal": [CAPABILITIES.AI_MEMORY],
  "landing-page": [],
  "catalogo-web": [CAPABILITIES.PRODUCT_SELLABLE, CAPABILITIES.CATALOG_PUBLISH],
  "finanzas-personales": [],
};

export const CAPABILITY_REQUIRED_APPS: Partial<Record<Capability, AppSuiteAppId[]>> = {
  [CAPABILITIES.PRODUCT_SELLABLE]: ["catalogo-web", "tienda-online"],
  [CAPABILITIES.PRODUCT_RAW_MATERIAL]: ["procesadora-alimentos", "gestion-insumos-materia-prima"],
  [CAPABILITIES.CATALOG_PUBLISH]: ["catalogo-web", "tienda-online"],
  [CAPABILITIES.BILLING_INVOICE]: ["facturacion-inventario"],
  [CAPABILITIES.AI_BEHAVIOR]: ["agente-atencion-cliente"],
  [CAPABILITIES.AI_KNOWLEDGE]: ["agente-atencion-cliente"],
  [CAPABILITIES.AI_TOOLS]: ["agente-atencion-cliente"],
  [CAPABILITIES.AI_MEMORY]: ["agente-asistente-personal"],
  [CAPABILITIES.SUPPLIER_MANAGE]: ["gestion-proveedores"],
  [CAPABILITIES.RECIPE_BOM]: ["procesadora-alimentos"],
};

export function isActiveInstalledApp(record: BusinessInstalledApp): boolean {
  return record.status === "active";
}

export function getActiveInstalledApps(
  installedApps?: BusinessInstalledApp[] | null
): BusinessInstalledApp[] {
  return (installedApps ?? []).filter(isActiveInstalledApp);
}

/** IDs de apps con status active (para menú y filtros). */
export function getEffectiveInstalledApps(
  installedApps?: BusinessInstalledApp[] | null
): string[] {
  return getActiveInstalledApps(installedApps).map((r) => r.app_id);
}

export function findInstalledAppRecord(
  installedApps: BusinessInstalledApp[] | null | undefined,
  appId: string
): BusinessInstalledApp | undefined {
  return (installedApps ?? []).find((r) => r.app_id === appId);
}

export function getBusinessCapabilities(
  installedApps?: BusinessInstalledApp[] | null
): Set<Capability> {
  const caps = new Set<Capability>();
  for (const appId of getEffectiveInstalledApps(installedApps)) {
    for (const cap of APP_CAPABILITIES[appId] ?? []) {
      caps.add(cap);
    }
  }
  return caps;
}

export function hasCapability(
  installedApps: BusinessInstalledApp[] | null | undefined,
  capability: Capability
): boolean {
  return getBusinessCapabilities(installedApps).has(capability);
}

export function hasAnyCapability(
  installedApps: BusinessInstalledApp[] | null | undefined,
  capabilities: Capability[]
): boolean {
  const caps = getBusinessCapabilities(installedApps);
  return capabilities.some((c) => caps.has(c));
}

export function isAppInstalled(
  installedApps: BusinessInstalledApp[] | null | undefined,
  appId: string
): boolean {
  const record = findInstalledAppRecord(installedApps, appId);
  return record != null && isActiveInstalledApp(record);
}

/** Producto en catálogo interno (no vendible en tienda ni insumo de producción). */
export function canUseOfferingsCatalogProduct(
  installedApps: BusinessInstalledApp[] | null | undefined
): boolean {
  return isAppInstalled(installedApps, "productos-servicios");
}

export function getAppTitle(appId: string): string {
  return APP_SUITE_MODULES.find((m) => m.id === appId)?.title ?? appId;
}

export function getInstalledAppTitles(installedApps: BusinessInstalledApp[] | null | undefined): string[] {
  return getEffectiveInstalledApps(installedApps).map(getAppTitle);
}
