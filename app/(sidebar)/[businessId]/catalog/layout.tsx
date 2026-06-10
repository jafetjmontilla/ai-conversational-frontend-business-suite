"use client";

import { useParams } from "next/navigation";
import { SectionTabLayout } from "@/components/layouts/SectionTabLayout";

const CATALOG_TABS = [
  { id: "productos", label: "Productos" },
  { id: "servicios", label: "Servicios" },
  { id: "atributos", label: "Atributos" },
] as const;

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/catalog`;

  return (
    <SectionTabLayout base={base} tabs={CATALOG_TABS}>
      {children}
    </SectionTabLayout>
  );
}
