import type { StorefrontCartLine } from "./types";

export function cartStorageKey(businessSlug: string) {
  return `cart:${businessSlug}`;
}

export function readCart(businessSlug: string): StorefrontCartLine[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(cartStorageKey(businessSlug));
  return raw ? (JSON.parse(raw) as StorefrontCartLine[]) : [];
}

export function writeCart(businessSlug: string, lines: StorefrontCartLine[]) {
  localStorage.setItem(cartStorageKey(businessSlug), JSON.stringify(lines));
}

export function clearCart(businessSlug: string) {
  localStorage.removeItem(cartStorageKey(businessSlug));
}

export function cartItemCount(lines: StorefrontCartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function addSkuToCart(businessSlug: string, sku: string, qty = 1): StorefrontCartLine[] {
  const lines = readCart(businessSlug);
  const existing = lines.find((line) => line.sku === sku);
  if (existing) {
    existing.quantity += qty;
  } else {
    lines.push({ sku, quantity: qty });
  }
  writeCart(businessSlug, lines);
  return lines;
}

export function setSkuQuantity(
  businessSlug: string,
  sku: string,
  quantity: number
): StorefrontCartLine[] {
  const nextQty = Math.max(0, Math.floor(quantity));
  let lines = readCart(businessSlug);
  if (nextQty === 0) {
    lines = lines.filter((line) => line.sku !== sku);
  } else {
    const existing = lines.find((line) => line.sku === sku);
    if (existing) {
      existing.quantity = nextQty;
    } else {
      lines.push({ sku, quantity: nextQty });
    }
  }
  writeCart(businessSlug, lines);
  return lines;
}

export function removeSkuFromCart(businessSlug: string, sku: string): StorefrontCartLine[] {
  const lines = readCart(businessSlug).filter((line) => line.sku !== sku);
  writeCart(businessSlug, lines);
  return lines;
}
