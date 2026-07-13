"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { StorefrontLoading } from "@/components/storefront/StorefrontLoading";
import { addSkuToCart, readCart } from "@/lib/storefront/cart-storage";
import { fetchStorefrontCatalog } from "@/lib/storefront/api";
import { storefrontPaths } from "@/lib/storefront/paths";
import { getStorefrontTheme } from "@/lib/storefront/themes/registry";
import type { StorefrontCartLine, StorefrontCatalogItem } from "@/lib/storefront/types";

export function StorefrontCartRoute() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessSlug = params?.businessId as string;
  const [cart, setCart] = useState<StorefrontCartLine[]>([]);
  const [items, setItems] = useState<StorefrontCatalogItem[]>([]);
  const [businessName, setBusinessName] = useState<string>();
  const [themeId, setThemeId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let lines = readCart(businessSlug);
    const addSku = searchParams.get("add");
    if (addSku) {
      lines = addSkuToCart(businessSlug, addSku);
      toast.success("Producto agregado");
      router.replace(storefrontPaths(businessSlug).cart);
    }
    setCart(lines);
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
        setError((err as { message?: string })?.message || "No se pudo cargar el carrito");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessSlug, searchParams, router]);

  if (loading) {
    return <StorefrontLoading label="Cargando carrito" />;
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
  const CartPage = theme.CartPage;

  return (
    <CartPage
      businessSlug={businessSlug}
      businessName={businessName}
      cart={cart}
      items={items}
      onCartChange={setCart}
    />
  );
}
