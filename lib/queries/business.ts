import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business } from "@/lib/interfases";

export const businessQueryKeys = {
  all: ["business"] as const,
  detail: (slug: string | null) => [...businessQueryKeys.all, slug] as const,
};

export async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  let b = (await fetchApiV1({
    query: queries.getBusiness,
    type: "json",
    variables: { id: slug },
  })) as Business | null;
  if (!b) {
    b = (await fetchApiV1({
      query: queries.getBusiness,
      type: "json",
      variables: { businessId: slug },
    })) as Business | null;
  }
  return b || null;
}

/** staleTime para datos de negocio: navegación interna sin refetch hasta evento WS o focus. */
export const BUSINESS_STALE_TIME_MS = 60_000;
