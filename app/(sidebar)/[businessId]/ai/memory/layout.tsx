"use client";

import { useParams } from "next/navigation";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

const MEMORY_TABS = [
  { id: "datos", label: "Datos" },
  { id: "ajustes", label: "Ajustes" },
  { id: "episodios", label: "Episodios" },
  { id: "contactos", label: "Contactos" },
  { id: "skills", label: "Skills" },
  { id: "workflows", label: "Workflows" },
  { id: "rutinas", label: "Rutinas proactivas" },
] as const;

export default function AiMemoryLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/ai/memory`;

  return (
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <SectionTabNav>
          {MEMORY_TABS.map(({ id, label }) => (
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
