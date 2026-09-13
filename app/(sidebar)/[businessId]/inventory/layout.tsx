"use client";

import { useParams } from "next/navigation";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

const INVENTORY_TABS = [
  { id: "stock", label: "Saldos" },
  { id: "movimientos", label: "Movimientos" },
] as const;

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/inventory`;

  return (
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <SectionTabNav>
          {INVENTORY_TABS.map(({ id, label }) => (
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
