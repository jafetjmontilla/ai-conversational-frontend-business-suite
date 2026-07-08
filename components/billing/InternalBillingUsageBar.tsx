"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getInternalBillingUsage } from "@/lib/billing/internalBilling";
import type { BusinessInstalledApp } from "@/lib/app-suite/capabilities";
import { cn } from "@/lib/utils";

type InternalBillingUsageBarProps = {
  record?: BusinessInstalledApp | null;
  businessSlug: string;
  compact?: boolean;
  className?: string;
};

export function InternalBillingUsageBar({
  record,
  businessSlug,
  compact,
  className,
}: InternalBillingUsageBarProps) {
  const { usage, max, percent } = getInternalBillingUsage(record?.limits);
  const nearLimit = percent >= 90;

  if (compact) {
    return (
      <Badge
        variant={nearLimit ? "destructive" : "secondary"}
        className={cn("text-[10px] font-medium tabular-nums", className)}
      >
        {usage} / {max} facturas
      </Badge>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-muted/30 px-3 py-2.5 text-sm", className)}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-muted-foreground">Uso del plan</span>
        <span className={cn("font-medium tabular-nums", nearLimit && "text-destructive")}>
          {usage} / {max} facturas ({percent}%)
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            nearLimit ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {nearLimit ? (
        <p className="mt-2 text-xs text-destructive">
          Cerca del límite.{" "}
          <Link href={`/${businessSlug}/app-suite`} className="underline underline-offset-2">
            Revisa tu plan en Suite
          </Link>
        </p>
      ) : null}
    </div>
  );
}
