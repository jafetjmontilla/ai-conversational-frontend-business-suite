"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { businessQueryKeys } from "@/lib/queries/business";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, RotateCcw } from "lucide-react";
import type { Business, BusinessConfig } from "@/lib/interfases";
import {
  DEFAULT_COMMERCE_INSTRUCTIONS,
  resolveCommerceInstructionsForUi,
} from "@/lib/billing/commerceDefaults";
import { CommerceCheckoutGuide } from "@/components/billing/CommerceCheckoutGuide";
import { sanitizeBusinessConfigForUpdate } from "@/lib/sanitizeBusinessConfigForUpdate";

type Props = {
  businessSlug: string;
};

function mergeConfigForSave(
  existing: BusinessConfig | undefined,
  patch: {
    commerceFlow: {
      enabled: boolean;
      commerceInstructions: string;
      notifyStaffOnAgentInvoice: boolean;
    };
  }
): BusinessConfig {
  const base = existing ?? ({} as BusinessConfig);
  return {
    ...base,
    conversationTimeout: base.conversationTimeout ?? 30,
    personality: base.personality ?? { tone: "casual", language: "es", customInstructions: "" },
    knowledgeSources: base.knowledgeSources ?? [],
    globalResponses: base.globalResponses ?? {},
    commerceFlow: {
      ...base.commerceFlow,
      ...patch.commerceFlow,
    },
  };
}

export function CommerceAgentSettings({ businessSlug }: Props) {
  const queryClient = useQueryClient();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness, canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { business, businessIdDoc, loading } = useBusiness(businessSlug);

  const cf = business?.config?.commerceFlow;
  const storedInstructions = resolveCommerceInstructionsForUi(cf?.commerceInstructions);
  const [enabled, setEnabled] = useState(cf?.enabled ?? false);
  const [instructions, setInstructions] = useState(storedInstructions);
  const [notifyStaff, setNotifyStaff] = useState(cf?.notifyStaffOnAgentInvoice !== false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(cf?.enabled ?? false);
    setInstructions(resolveCommerceInstructionsForUi(cf?.commerceInstructions));
    setNotifyStaff(cf?.notifyStaffOnAgentInvoice !== false);
  }, [cf?.enabled, cf?.commerceInstructions, cf?.notifyStaffOnAgentInvoice]);

  const canEdit = canEditCurrentBusiness?.();
  const canView = canViewCurrentBusiness?.();

  if (!canView) return null;
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const dirty =
    enabled !== (cf?.enabled ?? false) ||
    instructions !== storedInstructions ||
    notifyStaff !== (cf?.notifyStaffOnAgentInvoice !== false);

  const handleSave = async () => {
    if (!businessIdDoc || !canEdit) return;
    setSaving(true);
    try {
      const config = sanitizeBusinessConfigForUpdate(
        mergeConfigForSave(business?.config, {
          commerceFlow: {
            enabled,
            commerceInstructions: instructions.trim(),
            notifyStaffOnAgentInvoice: notifyStaff,
          },
        })
      );
      const updated = (await fetchApiV1({
        query: queries.updateBusiness,
        type: "json",
        variables: { id: businessIdDoc, args: { config } },
      })) as Business;
      queryClient.setQueryData<Business | null>(businessQueryKeys.detail(businessSlug), (old) =>
        old ? { ...old, config: updated.config ?? old.config } : updated
      );
      toast.success("Configuración del agente de ventas guardada");
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-none shadow-none md:border md:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5" />
            Agente → factura (handoff)
          </CardTitle>
          <CardDescription>
            El CSE toma pedidos por chat, crea factura borrador y avisa al staff para cobrar en caja.
            Requiere apps Productos/Servicios y Facturación Interna instaladas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Flujo de venta conversacional</Label>
              <p className="text-sm text-muted-foreground">
                Activa etapas de checkout y filtrado de herramientas por etapa en el worker.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!canEdit} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Notificar al staff al confirmar pedido</Label>
              <p className="text-sm text-muted-foreground">
                Envía notificación a administradores/editores cuando el agente genera factura borrador.
              </p>
            </div>
            <Switch checked={notifyStaff} onCheckedChange={setNotifyStaff} disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Instrucciones de venta para el agente</Label>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setInstructions(DEFAULT_COMMERCE_INSTRUCTIONS)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Plantilla
                </Button>
              )}
            </div>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={!canEdit}
              rows={14}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Plantilla precargada: completa bancos, horarios y políticas donde ves{" "}
              <span className="font-medium">___</span>. Se inyecta en el CSE al guardar.
            </p>
          </div>

          {canEdit && (
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Guardando…" : "Guardar agente de ventas"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none md:border md:shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Etapas de checkout</CardTitle>
          <CardDescription>
            Referencia de la máquina de estados que controla qué puede hacer el agente en cada momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommerceCheckoutGuide />
        </CardContent>
      </Card>
    </div>
  );
}
