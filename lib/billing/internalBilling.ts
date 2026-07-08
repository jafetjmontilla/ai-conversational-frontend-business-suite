import { APP_SUITE_MODULES, type AppSuiteModule } from "@/lib/data/appSuiteApps";

export const INTERNAL_BILLING_APP_ID = "facturacion-inventario";

/** Límite por defecto alineado con api-business-suite APP_DEFAULT_MAX_RECORDS. */
export const INTERNAL_BILLING_DEFAULT_MAX_RECORDS = 2000;

export function getInternalBillingModule(): AppSuiteModule | undefined {
  return APP_SUITE_MODULES.find((m) => m.id === INTERNAL_BILLING_APP_ID);
}

export function getInternalBillingUsage(
  limits?: { current_usage?: number; max_records?: number } | null
): { usage: number; max: number; percent: number } {
  const usage = limits?.current_usage ?? 0;
  const max = limits?.max_records ?? INTERNAL_BILLING_DEFAULT_MAX_RECORDS;
  const percent = max > 0 ? Math.min(100, Math.round((usage / max) * 100)) : 0;
  return { usage, max, percent };
}
