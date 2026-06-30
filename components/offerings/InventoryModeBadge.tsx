import { Badge } from "@/components/ui/badge";
import type { InventoryModeBadge as ModeBadge } from "@/lib/offerings/inventoryModeLabels";
import { cn } from "@/lib/utils";

type InventoryModeBadgeProps = {
  mode: ModeBadge;
  className?: string;
};

export function InventoryModeBadge({ mode, className }: InventoryModeBadgeProps) {
  return (
    <Badge
      variant={mode.variant}
      className={cn("text-[10px] font-normal px-1.5 py-0", className)}
      title={mode.title}
    >
      {mode.label}
    </Badge>
  );
}
