"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type InvoiceLineNoteFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export function InvoiceLineNoteField({
  value,
  onChange,
  disabled,
  compact,
  className,
}: InvoiceLineNoteFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
        Nota de caja
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Ej. término medio, poca salsa…"
        className={compact ? "h-7 text-xs" : "h-8 text-sm"}
        maxLength={120}
      />
    </div>
  );
}
