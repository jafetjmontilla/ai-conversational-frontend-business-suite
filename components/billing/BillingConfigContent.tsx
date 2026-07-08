"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { BILLING_FLOW_OPTIONS, normalizeBillingInternalFlow } from "@/lib/billing/flows";
import { businessQueryKeys } from "@/lib/queries/business";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import type { Business } from "@/lib/interfases";

export function BillingConfigContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const queryClient = useQueryClient();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { business, businessIdDoc, loading } = useBusiness(businessSlug);

  const currentFlow = normalizeBillingInternalFlow(business?.billingInternalFlow);
  const [selectedFlow, setSelectedFlow] = useState(currentFlow);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedFlow(currentFlow);
  }, [currentFlow]);

  const canEdit = canEditCurrentBusiness?.();

  if (!canViewCurrentBusiness?.()) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No tienes permiso para ver la configuración.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!businessIdDoc || !canEdit) return;
    setSaving(true);
    try {
      const updated = (await fetchApiV1({
        query: queries.updateBusiness,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: { billingInternalFlow: selectedFlow },
        },
      })) as Business;
      queryClient.setQueryData<Business | null>(
        businessQueryKeys.detail(businessSlug),
        (old) => (old ? { ...old, ...updated, billingInternalFlow: selectedFlow } : updated)
      );
      toast.success("Configuración guardada");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const flowDirty = selectedFlow !== currentFlow;

  return (
    <Card className="max-w-2xl border-none shadow-none md:border md:shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5" />
          Configuración de facturación
        </CardTitle>
        <CardDescription>
          Elige cómo tu equipo crea facturas nuevas. Siempre podrás ver facturas pagadas y anuladas
          desde el listado, en cualquier flujo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Label>Flujo para facturas nuevas</Label>
              <div className="space-y-3">
                {BILLING_FLOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setSelectedFlow(opt.id)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 rounded-lg border p-4 transition-colors",
                      selectedFlow === opt.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                      !canEdit && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded-full border-2 shrink-0",
                        selectedFlow === opt.id ? "border-primary bg-primary" : "border-muted-foreground"
                      )}
                    />
                    <div>
                      <p className="font-medium text-sm">{opt.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground space-y-1">
              <p>En ambos flujos:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>El precio unitario viene del catálogo (no editable).</li>
                <li>Modificadores y nota de caja por línea.</li>
                <li>Facturas pagadas y anuladas se abren en el editor (solo lectura si no es borrador).</li>
              </ul>
            </div>

            {canEdit ? (
              <Button onClick={handleSave} disabled={saving || !flowDirty}>
                {saving ? "Guardando…" : "Guardar configuración"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Solo administradores del negocio pueden cambiar esta configuración.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
