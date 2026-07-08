"use client";

import { useParams } from "next/navigation";
import { BillingConfigContent } from "@/components/billing/BillingConfigContent";
import { CommerceAgentSettings } from "@/components/billing/CommerceAgentSettings";

export default function BillingConfiguracionPage() {
  const params = useParams();
  const businessSlug = params?.businessId as string;

  return (
    <div className="p-4 md:p-6 space-y-8">
      <BillingConfigContent />
      <CommerceAgentSettings businessSlug={businessSlug} />
    </div>
  );
}
