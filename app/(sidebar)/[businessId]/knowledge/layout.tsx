"use client";

import { useParams } from "next/navigation";
import { KNOWLEDGE_SOURCE_TYPES } from "@/lib/knowledgeTypes";
import {
  SectionTabDivider,
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

const ADMIN_TABS = [
  { id: "fuentes", label: "Config. fuentes" },
  { id: "rag", label: "Búsqueda RAG" },
] as const;

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/knowledge`;

  return (
    <SectionTabLayout
      base={base}
      nav={
        <SectionTabNav>
          {KNOWLEDGE_SOURCE_TYPES.map(({ sourceId, label }) => (
            <SectionTabLink key={sourceId} href={`${base}/${sourceId}`}>
              {label}
            </SectionTabLink>
          ))}
          <SectionTabDivider />
          {ADMIN_TABS.map(({ id, label }) => (
            <SectionTabLink key={id} href={`${base}/${id}`}>
              {label}
            </SectionTabLink>
          ))}
        </SectionTabNav>
      }
    >
      {children}
    </SectionTabLayout>
  );
}
