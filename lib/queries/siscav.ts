import { fetchApiV1, queries } from "@/lib/Fetching";
import type { SiscavCseReadiness, SiscavInstallation } from "@/lib/interfases";

export const siscavQueryKeys = {
  all: ["siscavInstallation"] as const,
  detail: (businessSlug: string | null) => [...siscavQueryKeys.all, businessSlug] as const,
  readiness: (businessSlug: string | null) => [...siscavQueryKeys.all, "readiness", businessSlug] as const,
};

export async function fetchSiscavInstallation(businessDocId: string): Promise<SiscavInstallation | null> {
  return ((await fetchApiV1({
    query: queries.siscavInstallation,
    type: "json",
    variables: { businessDocId },
  })) ?? null) as SiscavInstallation | null;
}

export async function fetchSiscavCseReadiness(businessDocId: string): Promise<SiscavCseReadiness> {
  return (await fetchApiV1({
    query: queries.siscavCseReadiness,
    type: "json",
    variables: { businessDocId },
  })) as SiscavCseReadiness;
}
