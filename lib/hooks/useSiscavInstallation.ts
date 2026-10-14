"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { fetchSiscavInstallation, siscavQueryKeys } from "@/lib/queries/siscav";
import { cseProfileQueryKeys } from "@/lib/queries/cseProfiles";
import type { SiscavInstallation, SiscavPairingPayload } from "@/lib/interfases";

/** mcp-siscav no emite eventos al panel: el estado de conexión se consulta periódicamente. */
const POLL_IDLE_MS = 20_000;
const POLL_PAIRING_MS = 5_000;

export function useSiscavInstallation(businessSlug: string | null) {
  const queryClient = useQueryClient();
  const { businessIdDoc } = useBusiness(businessSlug);
  const key = siscavQueryKeys.detail(businessSlug);
  const [pairing, setPairing] = useState<SiscavPairingPayload | null>(null);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSiscavInstallation(businessIdDoc as string),
    enabled: !!businessIdDoc,
    refetchInterval: (q) => {
      const data = q.state.data as SiscavInstallation | null | undefined;
      return data?.pairingExpiresAt ? POLL_PAIRING_MS : POLL_IDLE_MS;
    },
  });

  const installation = query.data ?? null;
  const activePairing =
    pairing && installation?.pairingExpiresAt && installation.installationId === pairing.installation.installationId
      ? pairing
      : null;

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
      toast.success("SISCAV desconectado");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "No se pudo desconectar");
    },
  });

  return {
    installation,
    pairing: activePairing,
    loading: query.isLoading || !businessIdDoc,
    refreshing: query.isFetching,
    refresh: query.refetch,
    startPairing: startMutation.mutateAsync,
    revoke: revokeMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}
