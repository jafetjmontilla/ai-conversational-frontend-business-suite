"use client";

import { useParams } from "next/navigation";
import { SectionTabLayout } from "@/components/layouts/SectionTabLayout";

const BILLING_TABS = [
  { id: "facturas", label: "Facturas" },
  { id: "pagos", label: "Pagos" },
  { id: "resumen", label: "Resumen" },
] as const;

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/billing`;

  return (
    <SectionTabLayout base={base} tabs={BILLING_TABS}>
      {children}
    </SectionTabLayout>
  );
}
