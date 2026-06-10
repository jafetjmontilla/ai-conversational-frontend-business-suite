"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function AiMemoryIndexPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = params?.businessId as string;
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (!businessId) return;
    if (tab === "settings") {
      router.replace(`/${businessId}/ai/memory/ajustes`);
      return;
    }
    router.replace(`/${businessId}/ai/memory/datos`);
  }, [businessId, router, tab]);

  return (
    <div className="p-4 md:p-6 flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirigiendo…</p>
    </div>
  );
}
