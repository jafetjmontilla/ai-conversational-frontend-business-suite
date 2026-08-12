const GUEST_UID_KEY = "kiter-guest-uid";

export function getStoredGuestUid(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = localStorage.getItem(GUEST_UID_KEY);
    return v?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function storeGuestUid(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_UID_KEY, uid);
  } catch {
    /* ignore quota / private mode */
  }
}
