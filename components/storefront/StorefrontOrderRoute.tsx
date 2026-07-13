"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { StorefrontLoading } from "@/components/storefront/StorefrontLoading";
import { fetchStorefrontCatalog } from "@/lib/storefront/api";
import { getStorefrontTheme } from "@/lib/storefront/themes/registry";

export function StorefrontOrderRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const businessSlug = params?.businessId as string;
  const orderId = params?.orderId as string;
  const paid = searchParams.get("paid") === "1";
  const [themeId, setThemeId] = useState<string>();
  const [businessName, setBusinessName] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStorefrontCatalog(businessSlug)
      .then((data) => {
        if (cancelled) return;
        setThemeId(data.storefrontTheme ?? "default");
        setBusinessName(data.businessName);
      })
      .catch(() => {
        if (cancelled) return;
        setThemeId("default");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  if (loading) {
    return <StorefrontLoading label="Cargando confirmación" />;
  }

  const theme = getStorefrontTheme(themeId);
  const OrderPage = theme.OrderPage;

  return (
    <OrderPage
      businessSlug={businessSlug}
      businessName={businessName}
      orderId={orderId}
      paid={paid}
    />
  );
}
