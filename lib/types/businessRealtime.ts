import type { BusinessInstalledApp } from "@/lib/app-suite/capabilities";
import type { BusinessChannel } from "@/lib/interfases";

export type BusinessUpdatedScope = "apps" | "channels" | "config" | "all";

export type BusinessUpdatedActor = "user" | "agent" | "system";

export type BusinessUpdatedPayload = {
  /** Slug del negocio (businessId de URL / Mongo). */
  businessId: string;
  scope: BusinessUpdatedScope;
  actor?: BusinessUpdatedActor;
  installedApps?: BusinessInstalledApp[];
  channels?: BusinessChannel[];
};
