const PANEL_OPEN_KEY_PREFIX = "business-edit-panel-open:";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function businessEditPanelsGroupId(businessId: string): string {
  return `business-edit-panels-${businessId}`;
}

export function readDesktopPanelOpen(businessId: string, fallback = true): boolean {
  if (!canUseStorage() || !businessId) return fallback;
  try {
    const raw = localStorage.getItem(`${PANEL_OPEN_KEY_PREFIX}${businessId}`);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

export function writeDesktopPanelOpen(businessId: string, open: boolean): void {
  if (!canUseStorage() || !businessId) return;
  try {
    localStorage.setItem(`${PANEL_OPEN_KEY_PREFIX}${businessId}`, String(open));
  } catch {
    // ignore quota / private mode errors
  }
}
