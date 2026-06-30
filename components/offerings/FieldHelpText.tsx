import { cn } from "@/lib/utils";

type FieldHelpTextProps = {
  children: React.ReactNode;
  className?: string;
};

/** Texto auxiliar bajo un campo de formulario. */
export function FieldHelpText({ children, className }: FieldHelpTextProps) {
  return (
    <p className={cn("text-xs text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
}
