"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Redirige a la pestaña por defecto de saldos. */
export default function InventoryIndexPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) router.replace(`/${businessId}/inventory/stock`);
  }, [businessId, router]);

  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
