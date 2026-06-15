"use client";

import { useParams } from "next/navigation";
import {
  SectionTabLayout,
  SectionTabLink,
  SectionTabNav,
} from "@/components/layouts/SectionTabLayout";

const OPS_TABS = [
  { id: "logs", label: "Logs de prompts" },
  { id: "checkout", label: "Auditoría checkout" },
] as const;

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/ops`;

  return (
    <SectionTabLayout
      base={base}
      variant="line"
      nav={
        <SectionTabNav>
          {OPS_TABS.map(({ id, label }) => (
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
