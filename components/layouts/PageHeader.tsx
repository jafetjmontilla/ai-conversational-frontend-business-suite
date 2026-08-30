import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { TypographyH3 } from "../Typography";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("shrink-0 space-y-1 pb-2", className)}>
      <div className="flex items-start justify-between gap-4">
        <TypographyH3>{title}</TypographyH3>
        {actions}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
