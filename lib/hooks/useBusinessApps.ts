"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { businessQueryKeys } from "@/lib/queries/business";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business } from "@/lib/interfases";
import { toast } from "sonner";

function mergeBusinessCache(
  old: Business | null | undefined,
  updated: Business
): Business {
  if (!old) return updated;
  return { ...old, ...updated, installedApps: updated.installedApps ?? old.installedApps };
}

export function useBusinessApps(businessSlug: string | null) {
  const queryClient = useQueryClient();
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

  const patchBusinessCache = useCallback(
    (updated: Business) => {
      if (!businessSlug) return;
      queryClient.setQueryData<Business | null>(
        businessQueryKeys.detail(businessSlug),
        (old) => mergeBusinessCache(old, updated)
      );
    },
    [businessSlug, queryClient]
  );

  const installMutation = useMutation({
    mutationFn: async (appId: string) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.installBusinessApp,
        type: "json",
        variables: { id: businessIdDoc, appId },
      })) as Business;
    },
    onSuccess: (updated) => {
      patchBusinessCache(updated);
      toast.success("App instalada");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al instalar app");
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: async (appId: string) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.uninstallBusinessApp,
        type: "json",
        variables: { id: businessIdDoc, appId },
      })) as Business;
    },
    onSuccess: (updated) => {
      patchBusinessCache(updated);
      toast.success("App desinstalada");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al desinstalar app");
    },
  });

  const installApp = useCallback(
    async (appId: string) => {
      if (!businessIdDoc) return false;
      try {
        await installMutation.mutateAsync(appId);
        return true;
      } catch {
        return false;
      }
    },
    [businessIdDoc, installMutation]
  );

  const uninstallApp = useCallback(
    async (appId: string) => {
      if (!businessIdDoc) return false;
      try {
        await uninstallMutation.mutateAsync(appId);
        return true;
      } catch {
        return false;
      }
    },
    [businessIdDoc, uninstallMutation]
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
