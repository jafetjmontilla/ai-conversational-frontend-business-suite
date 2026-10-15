import * as z from "zod";
import type { CseProfile } from "@/lib/interfases";

export const CSE_EXTERNAL_ROLES = ["customer", "staff", "admin"] as const;
export type CseExternalRole = (typeof CSE_EXTERNAL_ROLES)[number];

/** Espejo de MCP_SISCAV_ROLE_TOOLS (api productTenantMcpSiscav) para alinear tools al cambiar rol. */
const SISCAV_CUSTOMER_TOOLS = [
  "search_products",
  "get_product",
  "list_product_categories",
  "get_exchange_rates",
  "list_services",
];
const SISCAV_STAFF_TOOLS = [
  ...SISCAV_CUSTOMER_TOOLS,
  "search_clients",
  "get_client",
  "list_accounts_receivable",
  "search_invoices",
  "get_invoice",
  "get_sales_summary",
  "get_top_products",
  "get_cash_summary",
  "list_low_stock_products",
  "get_product_sales_history",
  "create_client",
  "update_client",
  "get_write_status",
];

export const SISCAV_ROLE_TOOLS: Record<CseExternalRole, string[]> = {
  customer: SISCAV_CUSTOMER_TOOLS,
  staff: SISCAV_STAFF_TOOLS,
  admin: [...SISCAV_STAFF_TOOLS, "set_dollar_rate"],
};

export function isSiscavSeededProfileId(profileId: string): boolean {
  return /^siscav-(customer|staff|admin)$/.test(profileId);
}

export const cseProfileFormSchema = z.object({
  name: z.string().trim().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  active: z.boolean(),
  externalRole: z.union([z.enum(CSE_EXTERNAL_ROLES), z.literal("")]),
  customInstructions: z.string().max(8000, "Máximo 8000 caracteres"),
  tools: z.array(z.string()),
  knowledgeSourceIds: z.array(z.string()),
  escalationEnabled: z.boolean(),
  escalationOnNoData: z.boolean(),
});

export type CseProfileFormValues = z.infer<typeof cseProfileFormSchema>;

export function cseProfileToFormValues(profile: CseProfile): CseProfileFormValues {
  const role = profile.externalRole?.trim() ?? "";
  const externalRole =
    role === "customer" || role === "staff" || role === "admin" ? role : "";
  return {
    name: profile.name,
    active: profile.active,
    externalRole,
    customInstructions: profile.customInstructions ?? "",
    tools: [...profile.tools],
    knowledgeSourceIds: [...profile.knowledgeSourceIds],
    escalationEnabled: profile.escalation.enabled,
    escalationOnNoData: profile.escalation.onNoData,
  };
}
