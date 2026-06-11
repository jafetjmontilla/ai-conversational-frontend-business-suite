"use client";

import type { ReactNode } from "react";
import { useBusinessRealtimeSync } from "@/lib/hooks/useBusinessRealtimeSync";

type BusinessProviderProps = {
  businessSlug: string;
  children: ReactNode;
};

/**
 * Montar una vez por negocio activo (p. ej. en SidebarLayout).
 * Centraliza la sync WS → React Query para todos los hijos (sidebar, páginas, suite).
 */
export function BusinessProvider({ businessSlug, children }: BusinessProviderProps) {
  useBusinessRealtimeSync(businessSlug);
  return <>{children}</>;
}
