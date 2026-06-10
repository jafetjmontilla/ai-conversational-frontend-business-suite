"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyInvoiceRedirect() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) router.replace(`/${businessId}/billing/facturas`);
  }, [businessId, router]);

  return (
    <div className="p-4 md:p-6 flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirigiendo a facturación…</p>
    </div>
  );
}
