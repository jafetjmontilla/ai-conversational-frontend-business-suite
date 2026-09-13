"use client";

import { useParams } from "next/navigation";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

const TABS = [
  { id: "suppliers", label: "Proveedores" },
  { id: "orders", label: "Órdenes de compra" },
] as const;

export default function PurchasingLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/purchasing`;

  return (
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <SectionTabNav>
          {TABS.map(({ id, label }) => (
            <SectionTabLink key={id} href={`${base}/${id}`}>
              {label}
            </SectionTabLink>
          ))}
        </SectionTabNav>
      }
    >
      <div className="h-full pt-1.5 overflow-y-auto min-h-0">{children}</div>
    </SectionTabLayout>
  );
}
