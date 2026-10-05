"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { cseProfileQueryKeys, fetchCseProfiles } from "@/lib/queries/cseProfiles";
import type { CseProfile, CseProfilesPayload } from "@/lib/interfases";

export type CseProfileDetailInput = {
  customInstructions?: string | null;
  tools?: string[];
  knowledgeSourceIds?: string[];
  escalation?: { enabled: boolean; onNoData?: boolean };
  name?: string;
  active?: boolean;
};

const EMPTY: CseProfilesPayload = { profiles: [], availableTools: [], availableKnowledgeSources: [] };

export function useCseProfiles(businessSlug: string | null) {
  const queryClient = useQueryClient();
  const { businessIdDoc } = useBusiness(businessSlug);
  const key = cseProfileQueryKeys.list(businessSlug);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchCseProfiles(businessIdDoc as string),
    enabled: !!businessIdDoc,
    staleTime: 60_000,
  });

  const patchProfile = useCallback(
    (profile: CseProfile) => {
      queryClient.setQueryData<CseProfilesPayload>(key, (old) => {
        const base = old ?? EMPTY;
        const exists = base.profiles.some((p) => p.profileId === profile.profileId);
        return {
          ...base,
          profiles: exists
            ? base.profiles.map((p) => (p.profileId === profile.profileId ? profile : p))
            : [...base.profiles, profile],
        };
      });
    },
    [key, queryClient]
  );

  const updateMutation = useMutation({
    mutationFn: async (vars: { profileId: string; input: CseProfileDetailInput }) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.updateCseProfileDetail,
        type: "json",
        variables: { businessDocId: businessIdDoc, ...vars },
      })) as CseProfile;
    },
    onSuccess: (profile) => {
      patchProfile(profile);
      toast.success("Perfil guardado");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al guardar perfil");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      return (await fetchApiV1({
        query: queries.createCseProfile,
        type: "json",
        variables: { businessDocId: businessIdDoc, name },
      })) as CseProfile;
    },
    onSuccess: (profile) => {
      patchProfile(profile);
      toast.success("Perfil creado");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al crear perfil");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      if (!businessIdDoc) throw new Error("Negocio no cargado");
      await fetchApiV1({
        query: queries.deleteCseProfile,
        type: "json",
        variables: { businessDocId: businessIdDoc, profileId },
      });
      return profileId;
    },
    onSuccess: (profileId) => {
      queryClient.setQueryData<CseProfilesPayload>(key, (old) =>
        old ? { ...old, profiles: old.profiles.filter((p) => p.profileId !== profileId) } : old
      );
      toast.success("Perfil eliminado");
    },
    onError: (e: unknown) => {
      toast.error((e as { message?: string })?.message || "Error al eliminar perfil");
    },
  });

  return {
    data: query.data ?? EMPTY,
    loading: query.isLoading || !businessIdDoc,
    updateProfile: updateMutation.mutateAsync,
    createProfile: createMutation.mutateAsync,
    deleteProfile: deleteMutation.mutateAsync,
    isSaving: updateMutation.isPending,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
