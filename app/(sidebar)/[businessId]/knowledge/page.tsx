"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirige /knowledge a /knowledge/protocols para que la primera pantalla sea Protocolos.
 */
export default function KnowledgeIndexPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) {
      router.replace(`/${businessId}/knowledge/protocols`);
    }
  }, [businessId, router]);

  return (
    <div className="p-4 md:p-6 flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirigiendo a Protocolos…</p>
    </div>
  );
}
