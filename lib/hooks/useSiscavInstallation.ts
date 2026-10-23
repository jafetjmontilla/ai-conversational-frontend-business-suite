"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { fetchSiscavCseReadiness, fetchSiscavInstallation, siscavQueryKeys } from "@/lib/queries/siscav";
import { cseProfileQueryKeys } from "@/lib/queries/cseProfiles";
import type { SiscavInstallation, SiscavPairingPayload } from "@/lib/interfases";
import type { BusinessUpdatedPayload } from "@/lib/types/businessRealtime";

/** mcp-siscav notifica vía Socket (scope siscav); el poll queda de respaldo. */
const POLL_IDLE_MS = 20_000;
const POLL_ALERT_MS = 5_000;
const POLL_PAIRING_MS = 5_000;

function pollIntervalMs(data: SiscavInstallation | null | undefined): number {
  if (data?.pairingExpiresAt) return POLL_PAIRING_MS;
  if (data?.status === "active" && (!data.connected || data.lastError)) return POLL_ALERT_MS;
  return POLL_IDLE_MS;
}

export function useSiscavInstallation(businessSlug: string | null) {
  const queryClient = useQueryClient();
  const { businessIdDoc } = useBusiness(businessSlug);
  const { onBusinessUpdated } = useWebSocketContext();
  const key = siscavQueryKeys.detail(businessSlug);
  const readinessKey = siscavQueryKeys.readiness(businessSlug);
  const [pairing, setPairing] = useState<SiscavPairingPayload | null>(null);
  const prevConnectedRef = useRef<boolean | null>(null);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSiscavInstallation(businessIdDoc as string),
    enabled: !!businessIdDoc,
    refetchInterval: (q) => pollIntervalMs(q.state.data as SiscavInstallation | null | undefined),
  });

  const readinessQuery = useQuery({
    queryKey: readinessKey,
    queryFn: () => fetchSiscavCseReadiness(businessIdDoc as string),
    enabled: !!businessIdDoc,
    refetchInterval: (q) => {
      const inst = queryClient.getQueryData(key) as SiscavInstallation | null | undefined;
      return pollIntervalMs(inst);
    },
  });

  const installation = query.data ?? null;
  const activePairing =
    pairing && installation?.pairingExpiresAt && installation.installationId === pairing.installation.installationId
      ? pairing
      : null;

  useEffect(() => {
    if (!businessSlug) return;
    return onBusinessUpdated((payload: BusinessUpdatedPayload) => {
      if (payload.businessId !== businessSlug) return;
      if (payload.scope !== "siscav" && payload.scope !== "all" && payload.scope !== "channels") return;
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: readinessKey });
    });
  }, [businessSlug, onBusinessUpdated, queryClient, key, readinessKey]);

  useEffect(() => {
    if (!installation || installation.status !== "active") {
      prevConnectedRef.current = installation?.connected ?? null;
      return;
    }
    const prev = prevConnectedRef.current;
    if (prev === true && installation.connected === false) {
      toast.error("SISCAV se desconectó", {
        description: installation.lastError?.message || "La PC dejó de enviar latidos.",
      });
    }
    prevConnectedRef.current = installation.connected;
  }, [installation]);

  const startMutation = useMutation({
    mutationFn: async (createProfiles: boolean) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.startSiscavPairing,
        type: "json",
        variables: { businessDocId: businessIdDoc, createProfiles },
      })) as SiscavPairingPayload;
    },
    onSuccess: (payload) => {
      setPairing(payload);
      queryClient.setQueryData(key, payload.installation);
      void queryClient.invalidateQueries({ queryKey: cseProfileQueryKeys.list(businessSlug) });
      void queryClient.invalidateQueries({ queryKey: readinessKey });
      toast.success("Código generado");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "No se pudo generar el código");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.revokeSiscavInstallation,
        type: "json",
        variables: { businessDocId: businessIdDoc },
      })) as boolean;
    },
    onSuccess: () => {
      setPairing(null);
      queryClient.setQueryData(key, null);
      void queryClient.invalidateQueries({ queryKey: cseProfileQueryKeys.list(businessSlug) });
      void queryClient.invalidateQueries({ queryKey: readinessKey });
      toast.success("SISCAV desconectado");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "No se pudo desconectar");
    },
  });

  return {
    installation,
    pairing: activePairing,
    readiness: readinessQuery.data ?? null,
    loading: query.isLoading || !businessIdDoc,
    refreshing: query.isFetching || readinessQuery.isFetching,
    refresh: async () => {
      await Promise.all([query.refetch(), readinessQuery.refetch()]);
    },
    startPairing: startMutation.mutateAsync,
    revoke: revokeMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}
