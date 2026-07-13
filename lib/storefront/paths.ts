export function storefrontPaths(businessSlug: string) {
  const base = `/${businessSlug}/tienda`;

  return {
    base,
    cart: `${base}/cart`,
    checkout: `${base}/checkout`,
    order: (orderId: string) => `${base}/order/${orderId}`,
    cartAdd: (sku: string) => `${base}/cart?add=${encodeURIComponent(sku)}`,
  };
}
