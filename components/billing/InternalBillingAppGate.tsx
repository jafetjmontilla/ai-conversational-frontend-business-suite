"use client";

import { useState } from "react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { INTERNAL_BILLING_APP_ID } from "@/lib/billing/internalBilling";
import { InternalBillingAppPrompt } from "@/components/billing/InternalBillingAppPrompt";
import { InternalBillingUsageBar } from "@/components/billing/InternalBillingUsageBar";

type InternalBillingAppGateProps = {
  businessSlug: string;
  children: React.ReactNode;
  showUsage?: boolean;
};

export function InternalBillingAppGate({
  businessSlug,
  children,
  showUsage = true,
}: InternalBillingAppGateProps) {
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { hasApp, getAppRecord, installApp, loading } = useBusinessApps(businessSlug);
  const [installing, setInstalling] = useState(false);

  const installed = hasApp(INTERNAL_BILLING_APP_ID);
  const record = getAppRecord(INTERNAL_BILLING_APP_ID);

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
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!installed) {
    return (
      <InternalBillingAppPrompt
        businessSlug={businessSlug}
        canInstall={canEditCurrentBusiness()}
        installing={installing}
        onInstall={handleInstall}
        variant="page"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {showUsage ? (
        <div className="px-2 md:px-0 shrink-0">
          <InternalBillingUsageBar record={record} businessSlug={businessSlug} />
        </div>
      ) : null}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
