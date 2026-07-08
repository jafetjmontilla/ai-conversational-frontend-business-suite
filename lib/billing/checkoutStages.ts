/** Etapas de checkout (referencia UI; lógica en worker checkoutStateService). */
export type CheckoutStageKey =
  | "idle"
  | "browsing"
  | "quote_ready"
  | "await_cart_confirm"
  | "payment_instructions"
  | "payment_pending"
  | "paid_verified"
  | "shipping_collect"
  | "await_shipping_confirm"
  | "shipping_submitted"
  | "done";

export interface CheckoutStageMeta {
  key: CheckoutStageKey;
  label: string;
  description: string;
  toolsHint: string;
}

export const CHECKOUT_STAGES_META: CheckoutStageMeta[] = [
  {
    key: "browsing",
    label: "Exploración",
    description: "Consulta de catálogo y armado inicial del pedido. No se confirma factura aún.",
    toolsHint: "Catálogo, create_or_update_quote (sin confirm_quote)",
  },
  {
    key: "quote_ready",
    label: "Cotización lista",
    description: "Pedido activo con totales. El agente resume y pide confirmación.",
    toolsHint: "create_or_update_quote, confirm_quote, catálogo",
  },
  {
    key: "await_cart_confirm",
    label: "Esperando confirmación",
    description: "El cliente debe confirmar explícitamente antes de facturar.",
    toolsHint: "confirm_quote, ajustes al pedido",
  },
  {
    key: "payment_instructions",
    label: "Instrucciones de pago",
    description: "Factura borrador creada. El agente comparte transferencia/Zelle/efectivo; el staff cobra en caja.",
    toolsHint: "get_payment_methods, submit_payment_notification",
  },
  {
    key: "payment_pending",
    label: "Pago pendiente",
    description: "Comprobante enviado o verificación en curso.",
    toolsHint: "verify_payment_status, get_order_status",
  },
  {
    key: "paid_verified",
    label: "Pago verificado",
    description: "Cobro registrado; puede seguir envío si aplica.",
    toolsHint: "submit_shipping",
  },
  {
    key: "done",
    label: "Completado",
    description: "Flujo cerrado.",
    toolsHint: "Consultas de estado",
  },
];
