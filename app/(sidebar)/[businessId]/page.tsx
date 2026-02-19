"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function BusinessScopePage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) router.replace(`/${businessId}/edit`);
  }, [businessId, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
