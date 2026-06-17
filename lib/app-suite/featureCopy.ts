import {
  CAPABILITY_REQUIRED_APPS,
  canUseOfferingsCatalogProduct,
  getAppTitle,
  hasCapability,
  type BusinessInstalledApp,
  type Capability,
} from "@/lib/app-suite/capabilities";

function formatAppList(appIds: string[]): string {
  const titles = appIds.map(getAppTitle);
  if (titles.length === 0) return "";
  if (titles.length === 1) return `**${titles[0]}**`;
  if (titles.length === 2) return `**${titles[0]}** o **${titles[1]}**`;
  const last = titles[titles.length - 1];
  return `${titles.slice(0, -1).map((t) => `**${t}**`).join(", ")} o **${last}**`;
}

/** Texto de ayuda cuando una capability no está disponible. */
export function getCapabilityHint(
  capability: Capability,
  businessId: string
): string {
  const appIds = CAPABILITY_REQUIRED_APPS[capability] ?? [];
  const appsText = formatAppList(appIds);
  return `Disponible con la app ${appsText}. [Instalar en Suite](/${businessId}/app-suite)`;
}

/** Mensaje corto sin markdown para toasts/labels. */
export function getCapabilityHintPlain(capability: Capability): string {
  const appIds = CAPABILITY_REQUIRED_APPS[capability] ?? [];
  const titles = appIds.map(getAppTitle);
  if (titles.length === 0) return "Instala la app correspondiente en Suite de aplicaciones.";
  if (titles.length === 1) return `Requiere ${titles[0]}.`;
  return `Requiere ${titles.slice(0, -1).join(", ")} o ${titles[titles.length - 1]}.`;
}

export function getProductSellableFieldCopy(
  installedApps: BusinessInstalledApp[] | null | undefined,
  _businessId: string
): { label: string; hint?: string } {
  const canSell = hasCapability(installedApps, "product.sellable");
  const canRaw = hasCapability(installedApps, "product.rawMaterial");
  const canCatalog = canUseOfferingsCatalogProduct(installedApps);

  const sellApps = CAPABILITY_REQUIRED_APPS["product.sellable"] ?? [];
  const rawApps = CAPABILITY_REQUIRED_APPS["product.rawMaterial"] ?? [];

  let sellPart: string;
  if (canSell) {
    sellPart = "aparece en catálogo de ventas";
  } else {
    sellPart = `requiere ${formatAppList(sellApps).replace(/\*\*/g, "")}`;
  }

  let rawPart: string;
  if (canRaw) {
    rawPart = "puede usarse como insumo/materia prima";
  } else if (canCatalog) {
    rawPart = "queda en tu catálogo interno (Productos y Servicios)";
  } else {
    rawPart = `como insumo/materia prima requiere ${formatAppList(rawApps).replace(/\*\*/g, "")}`;
  }

  const label = `Vendible (${sellPart}). Si está desactivado, ${rawPart}.`;

  const hints: string[] = [];
  if (!canSell) {
    hints.push(getCapabilityHintPlain("product.sellable"));
  }
  if (!canRaw) {
    if (!canCatalog) hints.push(getCapabilityHintPlain("product.rawMaterial"));
  }

  return {
    label,
    hint: hints.length > 0 ? `${hints.join(" ")} Ver Suite de aplicaciones.` : undefined,
  };
}
