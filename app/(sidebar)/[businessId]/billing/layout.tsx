"use client";

import { useParams } from "next/navigation";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

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
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <SectionTabNav>
          {BILLING_TABS.map(({ id, label }) => (
            <SectionTabLink key={id} href={`${base}/${id}`}>
              {label}
            </SectionTabLink>
          ))}
        </SectionTabNav>
      }
    >
      <div className="h-full pt-1.5 overflow-y-auto">{children}</div>
    </SectionTabLayout>
  );
}
