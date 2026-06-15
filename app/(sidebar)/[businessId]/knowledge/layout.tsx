"use client";

import { useParams } from "next/navigation";
import { KNOWLEDGE_SOURCE_TYPES } from "@/lib/knowledgeTypes";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

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
      variant="line"
      nav={
        <SectionTabNav>
          {KNOWLEDGE_SOURCE_TYPES.map(({ sourceId, label }) => (
            <SectionTabLink key={sourceId} href={`${base}/${sourceId}`}>
              {label}
            </SectionTabLink>
          ))}
        </SectionTabNav>
      }
    >
      <div className="h-full h-full pt-1.5 overflow-y-auto">
        {children}
      </div>
    </SectionTabLayout>
  );
}
