"use client";

import { useParams } from "next/navigation";
import { SectionTabLayout } from "@/components/layouts/SectionTabLayout";

const OPS_TABS = [
  { id: "logs", label: "Logs de prompts" },
  { id: "checkout", label: "Auditoría checkout" },
] as const;

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/ops`;

  return (
    <SectionTabLayout base={base} tabs={OPS_TABS}>
      {children}
    </SectionTabLayout>
  );
}
