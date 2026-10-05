import { fetchApiV1, queries } from "@/lib/Fetching";
import type { CseProfilesPayload } from "@/lib/interfases";

export const cseProfileQueryKeys = {
  all: ["cseProfiles"] as const,
  list: (businessSlug: string | null) => [...cseProfileQueryKeys.all, businessSlug] as const,
};

export async function fetchCseProfiles(businessDocId: string): Promise<CseProfilesPayload> {
  return (await fetchApiV1({
    query: queries.cseProfiles,
    type: "json",
    variables: { businessDocId },
  })) as CseProfilesPayload;
}
