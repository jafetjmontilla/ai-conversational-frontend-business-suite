"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { StorefrontLoading } from "@/components/storefront/StorefrontLoading";
import {
  addSkuToCart,
  readCart,
} from "@/lib/storefront/cart-storage";
import { fetchStorefrontCatalog } from "@/lib/storefront/api";
import { getStorefrontTheme } from "@/lib/storefront/themes/registry";
import type { StorefrontCartLine, StorefrontCatalogItem } from "@/lib/storefront/types";

export function StorefrontCatalogRoute() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const [items, setItems] = useState<StorefrontCatalogItem[]>([]);
  const [cart, setCart] = useState<StorefrontCartLine[]>([]);
  const [businessName, setBusinessName] = useState<string>();
  const [enabled, setEnabled] = useState(false);
  const [themeId, setThemeId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCart(readCart(businessSlug));
    fetchStorefrontCatalog(businessSlug)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setBusinessName(data.businessName);
        setEnabled(data.webCheckoutEnabled === true);
        setThemeId(data.storefrontTheme ?? "default");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError((err as { message?: string })?.message || "No se pudo cargar el catálogo");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  const onAddToCart = useCallback(
    (sku: string) => {
      const lines = addSkuToCart(businessSlug, sku);
      setCart(lines);
      const item = items.find((entry) => entry.sku === sku);
      toast.success(item ? `${item.name} agregado` : "Producto agregado");
    },
    [businessSlug, items]
  );

  if (loading) {
    return <StorefrontLoading label="Cargando catálogo" />;
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
  const CatalogPage = theme.CatalogPage;

  return (
    <CatalogPage
      businessSlug={businessSlug}
      businessName={businessName}
      items={items}
      enabled={enabled}
      cart={cart}
      onAddToCart={onAddToCart}
      onCartChange={setCart}
    />
  );
}
