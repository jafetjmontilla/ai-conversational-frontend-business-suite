"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInternalBillingModule } from "@/lib/billing/internalBilling";
import { cn } from "@/lib/utils";
import { ArrowRight, FileText } from "lucide-react";

type InternalBillingAppPromptProps = {
  businessSlug: string;
  canInstall: boolean;
  installing?: boolean;
  onInstall?: () => void;
  variant?: "card" | "page";
  className?: string;
};

export function InternalBillingAppPrompt({
  businessSlug,
  canInstall,
  installing,
  onInstall,
  variant = "page",
  className,
}: InternalBillingAppPromptProps) {
  const billingModule = getInternalBillingModule();
  const Icon = billingModule?.icon ?? FileText;

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        variant === "page" ? "justify-center px-4 py-12 md:py-16 max-w-lg mx-auto" : "py-4",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-tr shadow-md mb-4",
          variant === "page" ? "h-14 w-14" : "h-11 w-11",
          billingModule?.iconGradient ?? "from-teal-500 to-emerald-600"
        )}
      >
        <Icon className={cn("text-white", variant === "page" ? "h-7 w-7" : "h-5 w-5")} />
      </div>

      <h2 className={cn("font-semibold text-foreground", variant === "page" ? "text-xl" : "text-base")}>
        {billingModule?.title ?? "Facturación Interna"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {billingModule?.description ??
          "Registra ventas internas y cobros en Bs o USD. No sustituye tu facturación fiscal legal."}
      </p>

      {variant === "page" && billingModule?.features?.length ? (
        <ul className="mt-4 w-full text-left text-sm text-muted-foreground space-y-1.5">
          {billingModule.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={cn("flex flex-wrap items-center justify-center gap-2", variant === "page" ? "mt-6" : "mt-4")}>
        {canInstall && onInstall ? (
          <Button size="sm" onClick={onInstall} disabled={installing}>
            {installing ? "Instalando…" : "Instalar Facturación Interna"}
          </Button>
        ) : null}
        <Button asChild variant={canInstall && onInstall ? "outline" : "default"} size="sm">
          <Link href={`/${businessSlug}/app-suite`}>
            {canInstall && onInstall ? "Ver en Suite" : "Ir a Suite de aplicaciones"}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {!canInstall ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Pide a un administrador del negocio que instale la app en Suite.
        </p>
      ) : null}
    </div>
  );
}
