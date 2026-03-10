import { useEffect, useState } from "react";
import { fetchApiV1, queries } from "../Fetching";
import type { Business } from "../interfases";
import { toast } from "sonner";

export function useBusiness(businessId: string | null) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(!!businessId);

  useEffect(() => {
    if (!businessId) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let b = (await fetchApiV1({
          query: queries.getBusiness,
          type: "json",
          variables: { id: businessId },
        })) as Business | null;
        if (!b && businessId) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          })) as Business | null;
        }
        if (cancelled) return;
        setBusiness(b || null);
      } catch {
        if (!cancelled) toast.error("Error al cargar el negocio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  const businessIdDoc = business?._id ?? null;

  return { business, businessIdDoc, loading };
}
