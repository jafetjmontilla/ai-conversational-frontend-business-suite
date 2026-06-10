"use client";

import { useParams } from "next/navigation";
import { SectionTabLayout } from "@/components/layouts/SectionTabLayout";

const MEMORY_TABS = [
  { id: "datos", label: "Datos" },
  { id: "ajustes", label: "Ajustes" },
  { id: "episodios", label: "Episodios" },
  { id: "skills", label: "Skills" },
  { id: "workflows", label: "Workflows" },
  { id: "rutinas", label: "Rutinas proactivas" },
] as const;

export default function AiMemoryLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/ai/memory`;

  return (
    <SectionTabLayout base={base} tabs={MEMORY_TABS}>
      {children}
    </SectionTabLayout>
  );
}
