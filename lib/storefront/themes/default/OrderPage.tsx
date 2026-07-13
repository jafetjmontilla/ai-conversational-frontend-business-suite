"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { formatOrderRef } from "@/lib/storefront/format";
import { storefrontPaths } from "@/lib/storefront/paths";
import type { StorefrontOrderPageProps } from "../types";

const ease = [0.32, 0.72, 0, 1] as const;

export function DefaultOrderPage({
  businessSlug,
  businessName,
  orderId,
  paid,
}: StorefrontOrderPageProps) {
  const reduceMotion = useReducedMotion();
  const paths = storefrontPaths(businessSlug);
  const brand = businessName?.trim() || "Tienda";
  const ref = formatOrderRef(orderId);

  return (
    <StorefrontShell
      businessSlug={businessSlug}
      businessName={businessName}
      cartCount={0}
      active="order"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="mx-auto max-w-2xl space-y-8"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-foreground shadow-sm">
            <Check className="size-9 stroke-[2.5]" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {paid ? "Gracias por tu compra" : "Pedido registrado"}
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {paid
              ? "Tu pedido fue procesado y ya está en preparación."
              : "Recibirás confirmación cuando se verifique el pago."}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
          <div className="flex flex-col items-start justify-between gap-4 bg-foreground p-6 text-background sm:flex-row sm:items-center sm:p-8">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-background/60">
                Recibo
              </span>
              <h2 className="text-xl font-bold tracking-tight">{brand}</h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="block text-xs text-background/60">ID del pedido</span>
              <code className="text-sm font-bold tracking-widest">{ref}</code>
            </div>
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <p className="text-sm text-muted-foreground">
              Guarda esta referencia si necesitas seguimiento con el negocio.
            </p>
            <Button asChild size="lg" className="w-full rounded-xl active:scale-[0.98] sm:w-auto">
              <Link href={paths.base}>Volver a la tienda</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </StorefrontShell>
  );
}
