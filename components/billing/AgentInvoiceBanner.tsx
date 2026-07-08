"use client";

import Link from "next/link";
import { Bot, ExternalLink, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/lib/interfases";

type Props = {
  invoice: Pick<Invoice, "source" | "conversationId" | "status" | "createdByName">;
  businessSlug: string;
};

export function AgentInvoiceBanner({ invoice, businessSlug }: Props) {
  if (invoice.source !== "agent") return null;

  const checkoutHref = invoice.conversationId
    ? `/${businessSlug}/ops/checkout?conversationId=${encodeURIComponent(invoice.conversationId)}`
    : `/${businessSlug}/ops/checkout`;

  return (
    <Alert className="mb-4 border-violet-200 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/30">
      <Bot className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Factura creada por el agente
        {invoice.status === "draft" && (
          <span className="text-xs font-normal text-amber-700 dark:text-amber-400">
            — pendiente de cobro en caja
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="text-sm">
          {invoice.createdByName || "Agente IA"} tomó el pedido por chat
          {invoice.conversationId ? ` (${invoice.conversationId})` : ""}. Revisa líneas y registra el
          pago aquí para descontar stock.
        </p>
        <div className="flex flex-wrap gap-2">
          {invoice.conversationId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={checkoutHref}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Auditoría checkout
                <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
              </Link>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
