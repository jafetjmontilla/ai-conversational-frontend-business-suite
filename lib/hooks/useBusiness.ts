import { useCallback, useEffect, useState } from "react";
import { fetchApiV1, queries } from "../Fetching";
import type { Business } from "../interfases";
import { toast } from "sonner";

async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  let b = (await fetchApiV1({
    query: queries.getBusiness,
    type: "json",
    variables: { id: slug },
  })) as Business | null;
  if (!b) {
    b = (await fetchApiV1({
      query: queries.getBusiness,
      type: "json",
      variables: { businessId: slug },
    })) as Business | null;
  }
  return b || null;
}

export function useBusiness(businessId: string | null) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(!!businessId);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setBusiness(null);
      return null;
    }
    setLoading(true);
    try {
      const b = await fetchBusinessBySlug(businessId);
      setBusiness(b);
      return b;
    } catch {
      toast.error("Error al cargar el negocio");
      return null;
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchBusinessBySlug(businessId)
      .then((b) => {
        if (!cancelled) setBusiness(b);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar el negocio");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const businessIdDoc = business?._id ?? null;

  return { business, businessIdDoc, loading, refetch };
}
