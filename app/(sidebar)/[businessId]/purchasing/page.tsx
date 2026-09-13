"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PurchasingIndexPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;

  useEffect(() => {
    if (businessId) router.replace(`/${businessId}/purchasing/suppliers`);
  }, [businessId, router]);

  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
