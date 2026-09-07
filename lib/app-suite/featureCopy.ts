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
): { capabilityHint?: string } {
  const canSell = hasCapability(installedApps, "product.sellable");
  const canRaw = hasCapability(installedApps, "product.rawMaterial");
  const canCatalog = canUseOfferingsCatalogProduct(installedApps);

  const hints: string[] = [];
  if (!canSell) {
    hints.push(getCapabilityHintPlain("product.sellable"));
  }
  if (!canRaw && !canCatalog) {
    hints.push(getCapabilityHintPlain("product.rawMaterial"));
  }

  return {
    capabilityHint: hints.length > 0 ? hints.join(" ") : undefined,
  };
}
