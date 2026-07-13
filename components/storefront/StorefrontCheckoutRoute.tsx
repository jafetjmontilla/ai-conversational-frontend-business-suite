"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StorefrontLoading } from "@/components/storefront/StorefrontLoading";
import { readCart } from "@/lib/storefront/cart-storage";
import { fetchStorefrontCatalog } from "@/lib/storefront/api";
import { getStorefrontTheme } from "@/lib/storefront/themes/registry";
import type { StorefrontCartLine, StorefrontCatalogItem } from "@/lib/storefront/types";

export function StorefrontCheckoutRoute() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const [cart, setCart] = useState<StorefrontCartLine[]>([]);
  const [items, setItems] = useState<StorefrontCatalogItem[]>([]);
  const [businessName, setBusinessName] = useState<string>();
  const [themeId, setThemeId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCart(readCart(businessSlug));
    setLoading(true);
    setError(null);
    fetchStorefrontCatalog(businessSlug)
      .then((data) => {
        if (cancelled) return;
        setThemeId(data.storefrontTheme ?? "default");
        setItems(data.items ?? []);
        setBusinessName(data.businessName);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError((err as { message?: string })?.message || "No se pudo cargar el checkout");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  if (loading) {
    return <StorefrontLoading label="Cargando checkout" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">No se pudo cargar</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const theme = getStorefrontTheme(themeId);
  const CheckoutPage = theme.CheckoutPage;

  return (
    <CheckoutPage
      businessSlug={businessSlug}
      businessName={businessName}
      cart={cart}
      items={items}
    />
  );
}
