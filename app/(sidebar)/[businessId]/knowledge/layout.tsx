"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { KNOWLEDGE_SOURCE_TYPES } from "@/lib/knowledgeTypes";
import { cn } from "@/lib/utils";

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const businessId = params?.businessId as string;
  const base = `/${businessId}/knowledge`;

  return (
    <div className="flex flex-col h-full">
      <nav className="border-b bg-muted/30 px-2 py-2 flex flex-wrap gap-1">
        {KNOWLEDGE_SOURCE_TYPES.map(({ sourceId, label }) => {
          const href = `${base}/${sourceId}`;
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={sourceId}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
