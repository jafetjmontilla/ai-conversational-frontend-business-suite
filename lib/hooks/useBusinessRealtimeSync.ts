"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { businessQueryKeys } from "@/lib/queries/business";
import type { Business } from "@/lib/interfases";
import type { BusinessUpdatedPayload } from "@/lib/types/businessRealtime";

/**
 * Suscripción única por negocio: invalida o parchea la caché React Query
 * cuando la API emite business:updated (usuario, agente u otro cliente).
 */
export function useBusinessRealtimeSync(businessSlug: string | null) {
  const queryClient = useQueryClient();
  const {
    subscribeToBusiness,
    unsubscribeFromBusiness,
    onBusinessUpdated,
    onReconnect,
  } = useWebSocketContext();

  useEffect(() => {
    if (!businessSlug) return;

    subscribeToBusiness(businessSlug);

    const offUpdated = onBusinessUpdated((payload: BusinessUpdatedPayload) => {
      if (payload.businessId !== businessSlug) return;

      const key = businessQueryKeys.detail(businessSlug);

      if (payload.scope === "apps" && payload.installedApps) {
        queryClient.setQueryData<Business | null>(key, (old) => {
          if (!old) return old ?? null;
          return { ...old, installedApps: payload.installedApps };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: key });
      }

      if (payload.actor === "agent" && payload.scope === "apps") {
        toast.info("El asistente actualizó las apps instaladas");
      }
    });

    const offReconnect = onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.detail(businessSlug) });
    });

    return () => {
      offUpdated();
      offReconnect();
      unsubscribeFromBusiness(businessSlug);
    };
  }, [
    businessSlug,
    queryClient,
    subscribeToBusiness,
    unsubscribeFromBusiness,
    onBusinessUpdated,
    onReconnect,
  ]);
}
