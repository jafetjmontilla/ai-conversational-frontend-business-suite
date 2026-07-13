import type {
  StorefrontCatalogResponse,
  StorefrontCheckoutPayload,
  StorefrontCheckoutResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/graphql.*$/, "") || "http://localhost:2005";

export async function fetchStorefrontCatalog(
  businessSlug: string
): Promise<StorefrontCatalogResponse> {
  const res = await fetch(`${API_BASE}/api/storefront/${businessSlug}/catalog`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Error al cargar catálogo");
  }
  return data;
}

export async function createStorefrontCheckout(
  businessSlug: string,
  payload: StorefrontCheckoutPayload
): Promise<StorefrontCheckoutResponse> {
  const res = await fetch(`${API_BASE}/api/storefront/${businessSlug}/checkout/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Error en checkout");
  }
  return data;
}
