"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyPromptLogsRedirect() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) router.replace(`/${businessId}/ops/logs`);
  }, [businessId, router]);

  return (
    <div className="p-4 md:p-6 flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirigiendo a Logs y auditoría…</p>
    </div>
  );
}
