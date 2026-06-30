"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { businessQueryKeys } from "@/lib/queries/business";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { Business, BusinessChannel } from "@/lib/interfases";
import { toast } from "sonner";

export type BusinessChannelInput = {
  channelId?: string;
  name: string;
  type: BusinessChannel["type"];
  active?: boolean;
  agentEngine?: BusinessChannel["agentEngine"];
  allowedPhoneNumbers?: string[];
  sessionId?: string | null;
  phoneNumber?: string | null;
  phoneNumberId?: string | null;
  accessToken?: string | null;
  verifyToken?: string | null;
  callbackUrl?: string | null;
  webhookSecret?: string | null;
};

export type CreateBaileysSessionResult = {
  success: boolean;
  qrCode?: string | null;
  error?: string | null;
  session?: { isConnected?: boolean; phoneNumber?: string };
};

const EMPTY_CHANNELS: BusinessChannel[] = [];

function mergeBusinessCache(
  old: Business | null | undefined,
  updated: Business
): Business {
  if (!old) return updated;
  return {
    ...old,
    ...updated,
    channels: updated.channels ?? old.channels,
    installedApps: updated.installedApps ?? old.installedApps,
  };
}

export function useBusinessChannels(businessSlug: string | null) {
  const queryClient = useQueryClient();
  const { business, businessIdDoc, loading, refetch, ...rest } = useBusiness(businessSlug);

  const channels = useMemo(
    () => business?.channels ?? EMPTY_CHANNELS,
    [business?.channels]
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

  const refreshBusiness = useCallback(async () => {
    if (!businessSlug) return null;
    return refetch();
  }, [businessSlug, refetch]);

  const upsertMutation = useMutation({
    mutationFn: async (input: BusinessChannelInput) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.upsertBusinessChannel,
        type: "json",
        variables: { id: businessIdDoc, input },
      })) as Business;
    },
    onSuccess: (updated) => {
      patchBusinessCache(updated);
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al guardar canal");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.deleteBusinessChannel,
        type: "json",
        variables: { id: businessIdDoc, channelId },
      })) as Business;
    },
    onSuccess: (updated) => {
      patchBusinessCache(updated);
      toast.success("Canal eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar canal");
    },
  });

  const createBaileysMutation = useMutation({
    mutationFn: async (vars: {
      sessionId: string;
      phoneNumber?: string;
      agentEngine: BusinessChannel["agentEngine"];
    }) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.createBaileysSession,
        type: "json",
        variables: {
          id: businessIdDoc,
          sessionId: vars.sessionId,
          phoneNumber: vars.phoneNumber,
          agentEngine: vars.agentEngine,
        },
      })) as CreateBaileysSessionResult;
    },
    onSuccess: async (result) => {
      if (!result?.success) {
        toast.error(result?.error ?? "Error al crear sesión");
        return;
      }
      await refreshBusiness();
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al crear sesión");
    },
  });

  const upsertChannel = useCallback(
    async (input: BusinessChannelInput) => {
      if (!businessIdDoc) return null;
      try {
        return await upsertMutation.mutateAsync(input);
      } catch {
        return null;
      }
    },
    [businessIdDoc, upsertMutation]
  );

  const deleteChannel = useCallback(
    async (channelId: string) => {
      if (!businessIdDoc) return null;
      try {
        return await deleteMutation.mutateAsync(channelId);
      } catch {
        return null;
      }
    },
    [businessIdDoc, deleteMutation]
  );

  const createBaileysSession = useCallback(
    async (vars: {
      sessionId: string;
      phoneNumber?: string;
      agentEngine: BusinessChannel["agentEngine"];
    }) => {
      if (!businessIdDoc) return null;
      try {
        return await createBaileysMutation.mutateAsync(vars);
      } catch {
        return null;
      }
    },
    [businessIdDoc, createBaileysMutation]
  );

  return {
    business,
    businessIdDoc,
    channels,
    loading,
    upsertChannel,
    deleteChannel,
    createBaileysSession,
    isUpserting: upsertMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreatingBaileys: createBaileysMutation.isPending,
    refetch: refreshBusiness,
    ...rest,
  };
}
