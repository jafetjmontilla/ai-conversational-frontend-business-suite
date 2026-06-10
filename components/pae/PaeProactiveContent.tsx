"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeProactiveRoutineRow, PaeProactiveSettings } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const EMPTY_ROUTINE: PaeProactiveRoutineRow = {
  cron: "0 8 * * *",
  prompt:
    "Buenos días. Inicia tú la conversación con un mensaje breve y útil: resume lo relevante de episodios recientes y sugiere un siguiente paso concreto para hoy.",
  enabled: true,
};

export function PaeProactiveContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [proactiveSettings, setProactiveSettings] = useState<PaeProactiveSettings | null>(null);
  const [proactiveRoutines, setProactiveRoutines] = useState<PaeProactiveRoutineRow[]>([]);
  const [savingRoutines, setSavingRoutines] = useState(false);
  const [loadingProactive, setLoadingProactive] = useState(false);

  const loadProactiveSettings = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoadingProactive(true);
    try {
      const settings = (await fetchApiV1({
        query: queries.getPaeProactiveSettings,
        type: "json",
        variables: { businessDocId: businessIdDoc },
      })) as PaeProactiveSettings | undefined;
      if (settings) {
        setProactiveSettings(settings);
        setProactiveRoutines(settings.routines.map((r) => ({ ...r })));
      }
    } catch {
      toast.error("Error al cargar rutinas proactivas");
    } finally {
      setLoadingProactive(false);
    }
  }, [businessIdDoc]);

  useEffect(() => {
    void loadProactiveSettings();
  }, [loadProactiveSettings]);

  const saveProactiveRoutines = async () => {
    if (!businessIdDoc) return;
    setSavingRoutines(true);
    try {
      const updated = (await fetchApiV1({
        query: queries.updatePaeProactiveRoutines,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          routines: proactiveRoutines.map((r) => ({
            cron: r.cron.trim(),
            prompt: r.prompt.trim(),
            enabled: r.enabled,
          })),
        },
      })) as PaeProactiveSettings | undefined;
      if (updated) {
        setProactiveSettings(updated);
        setProactiveRoutines(updated.routines.map((r) => ({ ...r })));
      }
      toast.success("Rutinas proactivas guardadas");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudieron guardar las rutinas";
      toast.error(msg);
    } finally {
      setSavingRoutines(false);
    }
  };

  const addProactiveRoutine = () => {
    setProactiveRoutines((prev) => [...prev, { ...EMPTY_ROUTINE }]);
  };

  const updateProactiveRoutine = (index: number, patch: Partial<PaeProactiveRoutineRow>) => {
    setProactiveRoutines((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeProactiveRoutine = (index: number) => {
    setProactiveRoutines((prev) => prev.filter((_, i) => i !== index));
  };

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Rutinas proactivas</CardTitle>
            <CardDescription>
              Programación cron (UTC) que dispara turnos PAE completos para usuarios con conversación activa reciente.
              El asistente inicia la conversación sin esperar un mensaje.
            </CardDescription>
          </div>
          {canEditCurrentBusiness() && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => void loadProactiveSettings()} disabled={loadingProactive}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingProactive ? "animate-spin" : ""}`} />
                Recargar
              </Button>
              <Button size="sm" onClick={() => void saveProactiveRoutines()} disabled={savingRoutines || loadingProactive}>
                {savingRoutines ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {proactiveSettings?.defaultEngine !== "pae" && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
              El motor del negocio no es PAE. Actívalo en{" "}
              <Link href={`/${businessSlug}/ai/behavior`} className="underline font-medium">
                Comportamiento → Agente / LLM
              </Link>{" "}
              para que las rutinas se ejecuten.
            </div>
          )}

          {proactiveSettings?.usesDefaultRoutine && (
            <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-muted-foreground">
              Sin rutinas personalizadas, el worker usa el resumen matutino por defecto (
              <code className="text-xs">{proactiveSettings.defaultRoutineCron}</code> UTC). Añade rutinas abajo para
              sustituir ese comportamiento.
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Formato cron: minuto hora día mes día-semana (UTC). Ejemplos:{" "}
            <code className="text-xs">0 8 * * *</code> (cada día 8:00),{" "}
            <code className="text-xs">0 9 * * 1-5</code> (lun–vie 9:00).
          </p>

          {proactiveRoutines.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
              No hay rutinas personalizadas.
            </p>
          )}

          <div className="space-y-4">
            {proactiveRoutines.map((routine, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Rutina {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`routine-enabled-${index}`}
                        checked={routine.enabled}
                        disabled={!canEditCurrentBusiness()}
                        onCheckedChange={(checked) => updateProactiveRoutine(index, { enabled: checked })}
                      />
                      <Label htmlFor={`routine-enabled-${index}`} className="text-xs">
                        Activa
                      </Label>
                    </div>
                    {canEditCurrentBusiness() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProactiveRoutine(index)}
                        aria-label="Eliminar rutina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`routine-cron-${index}`}>Cron (UTC)</Label>
                  <Input
                    id={`routine-cron-${index}`}
                    value={routine.cron}
                    disabled={!canEditCurrentBusiness()}
                    onChange={(e) => updateProactiveRoutine(index, { cron: e.target.value })}
                    placeholder="0 8 * * *"
                    className="font-mono text-sm max-w-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`routine-prompt-${index}`}>Prompt proactivo</Label>
                  <Textarea
                    id={`routine-prompt-${index}`}
                    value={routine.prompt}
                    disabled={!canEditCurrentBusiness()}
                    onChange={(e) => updateProactiveRoutine(index, { prompt: e.target.value })}
                    rows={4}
                    placeholder="Instrucción que recibe el grafo PAE al iniciar el turno…"
                  />
                </div>
              </div>
            ))}
          </div>

          {canEditCurrentBusiness() && (
            <Button type="button" variant="outline" size="sm" onClick={addProactiveRoutine}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir rutina
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
