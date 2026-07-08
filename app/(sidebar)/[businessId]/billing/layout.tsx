"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { InternalBillingAppGate } from "@/components/billing/InternalBillingAppGate";
import { InternalBillingAppPrompt } from "@/components/billing/InternalBillingAppPrompt";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { INTERNAL_BILLING_APP_ID } from "@/lib/billing/internalBilling";

const BILLING_TABS = [
  { id: "facturas", label: "Facturas" },
  { id: "pagos", label: "Pagos" },
  { id: "resumen", label: "Resumen" },
  { id: "configuracion", label: "Configuración" },
] as const;

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/billing`;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { hasApp, installApp, loading } = useBusinessApps(businessId);
  const [installing, setInstalling] = useState(false);

  const installed = hasApp(INTERNAL_BILLING_APP_ID);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await installApp(INTERNAL_BILLING_APP_ID);
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!installed) {
    return (
      <div className="h-full overflow-y-auto">
        <InternalBillingAppPrompt
          businessSlug={businessId}
          canInstall={canEditCurrentBusiness()}
          installing={installing}
          onInstall={handleInstall}
          variant="page"
        />
      </div>
    );
  }

  return (
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <SectionTabNav>
          {BILLING_TABS.map(({ id, label }) => (
            <SectionTabLink key={id} href={`${base}/${id}`}>
              {label}
            </SectionTabLink>
          ))}
        </SectionTabNav>
      }
    >
      <div className="h-full pt-1.5 overflow-y-auto min-h-0">
        <InternalBillingAppGate businessSlug={businessId}>{children}</InternalBillingAppGate>
      </div>
    </SectionTabLayout>
  );
}
