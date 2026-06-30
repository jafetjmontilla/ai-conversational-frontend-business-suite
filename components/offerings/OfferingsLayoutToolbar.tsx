"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { OfferingsImportWizard } from "@/components/offerings/OfferingsImportWizard";
import { Sparkles } from "lucide-react";

type OfferingsLayoutToolbarProps = {
  businessId: string;
};

export function OfferingsLayoutToolbar({ businessId }: OfferingsLayoutToolbarProps) {
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusinessApps(businessId);
  const [wizardOpen, setWizardOpen] = useState(false);

  if (!canEditCurrentBusiness?.()) return null;

  return (
    <>
      <div className="flex justify-end px-2 pb-2">
        <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Importar con IA
        </Button>
      </div>
      <OfferingsImportWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        businessId={businessId}
        businessIdDoc={businessIdDoc}
      />
    </>
  );
}
