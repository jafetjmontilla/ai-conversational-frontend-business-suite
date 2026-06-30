"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CAPABILITY_REQUIRED_APPS,
  getAppTitle,
  hasCapability,
  type BusinessInstalledApp,
  type Capability,
} from "@/lib/app-suite/capabilities";

type FeatureGateProps = {
  capability: Capability;
  installedApps?: BusinessInstalledApp[] | null;
  businessId: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Muestra siempre el contenido hijo. Si la capability no está activa, deshabilita
 * controles interactivos y muestra qué app(s) la habilitan.
 * Ver reglas en .cursor/rules/app-suite-capabilities.mdc
 */
export function FeatureGate({
  capability,
  installedApps,
  businessId,
  children,
  className,
}: FeatureGateProps) {
  const enabled = hasCapability(installedApps, capability);
  const requiredApps = CAPABILITY_REQUIRED_APPS[capability] ?? [];

  if (enabled) {
    return <div className={className}>{children}</div>;
  }

  const appsLabel =
    requiredApps.length === 1
      ? getAppTitle(requiredApps[0])
      : requiredApps.map(getAppTitle).join(" o ");

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="pointer-events-none opacity-60 [&_button]:cursor-not-allowed [&_input]:cursor-not-allowed [&_label]:cursor-not-allowed"
        aria-disabled
      >
        {children}
      </div>
      <p className="text-xs text-muted-foreground">
        Disponible con la app{" "}
        <span className="font-medium text-foreground">{appsLabel}</span>.{" "}
        <Link
          href={`/${businessId}/app-suite`}
          className="text-primary underline-offset-2 hover:underline"
        >
          Ver en Suite de aplicaciones
        </Link>
      </p>
    </div>
  );
}
