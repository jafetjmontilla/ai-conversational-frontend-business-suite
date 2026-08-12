const STORAGE_KEY = "recent-businesses"
const MAX_RECENT = 8

export interface RecentBusiness {
  businessId: string
  name: string
  _id: string
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export function getRecentBusinesses(): RecentBusiness[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is RecentBusiness =>
          !!item &&
          typeof item === "object" &&
          typeof (item as RecentBusiness).businessId === "string" &&
          typeof (item as RecentBusiness).name === "string" &&
          typeof (item as RecentBusiness)._id === "string"
      )
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function pushRecentBusiness(business: RecentBusiness): RecentBusiness[] {
  if (!canUseStorage()) return []
  const next = [
    business,
    ...getRecentBusinesses().filter((b) => b.businessId !== business.businessId),
  ].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // quota / private mode — ignore
  }
  return next
}
