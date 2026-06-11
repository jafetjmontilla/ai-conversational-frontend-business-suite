"use client";

import { useCallback, useMemo } from "react";
import { useBusiness } from "@/lib/hooks/useBusiness";
import {
  findInstalledAppRecord,
  getActiveInstalledApps,
  getBusinessCapabilities,
  getEffectiveInstalledApps,
  hasAnyCapability,
  hasCapability,
  isAppInstalled,
  type BusinessInstalledApp,
  type Capability,
} from "@/lib/app-suite/capabilities";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";

export function useBusinessApps(businessSlug: string | null) {
  const { business, businessIdDoc, loading, refetch, ...rest } = useBusiness(businessSlug);

  const installedApps = business?.installedApps;
  const activeInstalledApps = useMemo(
    () => getActiveInstalledApps(installedApps),
    [installedApps]
  );
  const effectiveInstalledApps = useMemo(
    () => getEffectiveInstalledApps(installedApps),
    [installedApps]
  );

  const capabilities = useMemo(
    () => getBusinessCapabilities(installedApps),
    [installedApps]
  );

  const can = useCallback(
    (capability: Capability) => hasCapability(installedApps, capability),
    [installedApps]
  );

  const canAny = useCallback(
    (caps: Capability[]) => hasAnyCapability(installedApps, caps),
    [installedApps]
  );

  const hasApp = useCallback(
    (appId: string) => isAppInstalled(installedApps, appId),
    [installedApps]
  );

  const getAppRecord = useCallback(
    (appId: string): BusinessInstalledApp | undefined =>
      findInstalledAppRecord(installedApps, appId),
    [installedApps]
  );

  const installApp = useCallback(
    async (appId: string) => {
      if (!businessIdDoc) return false;
      try {
        await fetchApiV1({
          query: queries.installBusinessApp,
          type: "json",
          variables: { id: businessIdDoc, appId },
        });
        await refetch();
        toast.success("App instalada");
        return true;
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message || "Error al instalar app");
        return false;
      }
    },
    [businessIdDoc]
  );

  const uninstallApp = useCallback(
    async (appId: string) => {
      if (!businessIdDoc) return false;
      try {
        await fetchApiV1({
          query: queries.uninstallBusinessApp,
          type: "json",
          variables: { id: businessIdDoc, appId },
        });
        await refetch();
        toast.success("App desinstalada");
        return true;
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message || "Error al desinstalar app");
        return false;
      }
    },
    [businessIdDoc]
  );

  return {
    business,
    businessIdDoc,
    loading,
    installedApps,
    activeInstalledApps,
    effectiveInstalledApps,
    capabilities,
    can,
    canAny,
    hasApp,
    getAppRecord,
    installApp,
    uninstallApp,
    refetch,
    ...rest,
  };
}
