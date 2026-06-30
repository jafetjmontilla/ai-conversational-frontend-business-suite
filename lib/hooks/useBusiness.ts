"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BUSINESS_STALE_TIME_MS,
  businessQueryKeys,
  fetchBusinessBySlug,
} from "@/lib/queries/business";

export function useBusiness(businessSlug: string | null) {
  const {
    data: business = null,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: businessQueryKeys.detail(businessSlug),
    queryFn: async () => {
      try {
        return await fetchBusinessBySlug(businessSlug!);
      } catch {
        toast.error("Error al cargar el negocio");
        throw new Error("Error al cargar el negocio");
      }
    },
    enabled: !!businessSlug,
    staleTime: BUSINESS_STALE_TIME_MS,
  });

  const businessIdDoc = business?._id ?? null;

  return {
    business,
    businessIdDoc,
    loading: isLoading,
    isFetching,
    error,
    refetch: async () => {
      const result = await refetch();
      return result.data ?? null;
    },
  };
}
