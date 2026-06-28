"use client";

import { useParams } from "next/navigation";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";
import { OfferingsLayoutToolbar } from "@/components/offerings/OfferingsLayoutToolbar";

const OFFERINGS_TABS = [
  { id: "products", label: "Productos" },
  { id: "services", label: "Servicios" },
  { id: "modifiers", label: "Modificadores" },
  { id: "attributes", label: "Atributos" },
] as const;

export default function OfferingsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/offerings`;

  return (
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <>
          <SectionTabNav>
            {OFFERINGS_TABS.map(({ id, label }) => (
              <SectionTabLink key={id} href={`${base}/${id}`}>
                {label}
              </SectionTabLink>
            ))}
          </SectionTabNav>
          <OfferingsLayoutToolbar businessId={businessId} />
        </>
      }
    >
      <div className="h-full pt-1.5 overflow-y-auto">{children}</div>
    </SectionTabLayout>
  );
}
