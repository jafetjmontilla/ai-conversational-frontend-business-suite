import * as React from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type InfoNoticeProps = {
  /** Texto o contenido (puede incluir enlaces u otros elementos inline). */
  children: React.ReactNode;
  /** Título opcional encima del mensaje. */
  title?: string;
  className?: string;
};

/**
 * Aviso informativo reutilizable (requisitos, pasos previos, enlaces a Suite, etc.).
 */
export function InfoNotice({ title, children, className }: InfoNoticeProps) {
  return (
    <div className="px-2 sm:px-8">

      <Alert
        className={cn(
          "border-primary/25 bg-primary/5 text-foreground flex gap-3",
          className
        )}
      >
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 min-h-full space-y-1 flex items-center">
            {title ? <AlertTitle className="mb-0">{title}</AlertTitle> : null}
            <AlertDescription className="text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
              {children}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
