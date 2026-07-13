"use client";

import { useParams } from "next/navigation";
import { OrdersContent } from "@/components/billing/OrdersContent";
import { useBusiness } from "@/lib/hooks/useBusiness";

export default function BillingPedidosPage() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessIdDoc } = useBusiness(businessSlug);

  if (!businessIdDoc) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <OrdersContent businessId={businessIdDoc} businessSlug={businessSlug} />;
}
