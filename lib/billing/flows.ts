export const BILLING_INTERNAL_FLOWS = ["carousel", "editor"] as const;

export type BillingInternalFlow = (typeof BILLING_INTERNAL_FLOWS)[number];

export const DEFAULT_BILLING_INTERNAL_FLOW: BillingInternalFlow = "carousel";

export type BillingFlowOption = {
  id: BillingInternalFlow;
  title: string;
  description: string;
};

export const BILLING_FLOW_OPTIONS: BillingFlowOption[] = [
  {
    id: "carousel",
    title: "Caja rápida (carrusel)",
    description:
      "Tarjetas compactas para venta en mostrador. Ideal para cobrar al momento sin salir de la lista.",
  },
  {
    id: "editor",
    title: "Editor de factura",
    description:
      "Página completa por factura. Ideal para borradores, pedidos del agente y revisión detallada.",
  },
];

export function normalizeBillingInternalFlow(
  value?: string | null
): BillingInternalFlow {
  return value === "editor" ? "editor" : "carousel";
}
