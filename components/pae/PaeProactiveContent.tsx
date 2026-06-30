"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeProactiveRoutineRow, PaeProactiveSettings } from "@/lib/interfases";
import { toast } from "sonner";
import { CalendarClock, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EMPTY_ROUTINE: PaeProactiveRoutineRow = {
  cron: "0 8 * * *",
  prompt:
    "Buenos días. Inicia tú la conversación con un mensaje breve y útil: resume lo relevante de episodios recientes y sugiere un siguiente paso concreto para hoy.",
  enabled: true,
};

export function PaeProactiveContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [proactiveSettings, setProactiveSettings] = useState<PaeProactiveSettings | null>(null);
  const [proactiveRoutines, setProactiveRoutines] = useState<PaeProactiveRoutineRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [savingRoutines, setSavingRoutines] = useState(false);
  const [loadingProactive, setLoadingProactive] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

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
    const nextIndex = proactiveRoutines.length;
    setProactiveRoutines((prev) => [...prev, { ...EMPTY_ROUTINE }]);
    setSelectedIndex(nextIndex);
    setMobileFormOpen(true);
  };

  const updateProactiveRoutine = (index: number, patch: Partial<PaeProactiveRoutineRow>) => {
    setProactiveRoutines((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeProactiveRoutine = (index: number) => {
    setProactiveRoutines((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const selectRoutine = (index: number) => {
    setSelectedIndex(index);
    setMobileFormOpen(true);
  };

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  const canEdit = canEditCurrentBusiness();
  const selectedRoutine = selectedIndex !== null ? proactiveRoutines[selectedIndex] : null;

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderRoutineFormCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>
              {selectedRoutine ? `Rutina ${(selectedIndex ?? 0) + 1}` : "Editar rutina"}
            </CardTitle>
            <CardDescription>
              Formato cron: minuto hora día mes día-semana (UTC). Ej.: <code className="text-xs">0 8 * * *</code>
            </CardDescription>
          </div>
          {options?.onClose ? (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={options.onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4">
        {selectedRoutine && selectedIndex !== null ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="routine-enabled-panel"
                  checked={selectedRoutine.enabled}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => updateProactiveRoutine(selectedIndex, { enabled: checked })}
                />
                <Label htmlFor="routine-enabled-panel" className="text-sm">Activa</Label>
              </div>
              {canEdit && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeProactiveRoutine(selectedIndex)} aria-label="Eliminar rutina">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="routine-cron-panel">Cron (UTC)</Label>
              <Input
                id="routine-cron-panel"
                value={selectedRoutine.cron}
                disabled={!canEdit}
                onChange={(e) => updateProactiveRoutine(selectedIndex, { cron: e.target.value })}
                placeholder="0 8 * * *"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routine-prompt-panel">Prompt proactivo</Label>
              <Textarea
                id="routine-prompt-panel"
                value={selectedRoutine.prompt}
                disabled={!canEdit}
                onChange={(e) => updateProactiveRoutine(selectedIndex, { prompt: e.target.value })}
                rows={8}
                placeholder="Instrucción que recibe el grafo PAE al iniciar el turno…"
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Selecciona una rutina o añade una nueva.
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Rutinas proactivas
            </div>
            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="outline" size="sm" className="flex md:hidden" onClick={() => { if (selectedIndex === null && proactiveRoutines.length > 0) selectRoutine(0); else setMobileFormOpen(true); }}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => void loadProactiveSettings()} disabled={loadingProactive}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loadingProactive ? "animate-spin" : ""}`} />
                  Recargar
                </Button>
                <Button size="sm" onClick={() => void saveProactiveRoutines()} disabled={savingRoutines || loadingProactive}>
                  {savingRoutines ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Programación cron (UTC) que dispara turnos PAE completos para usuarios con conversación activa reciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 space-y-4 overflow-x-hidden">
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
              <code className="text-xs">{proactiveSettings.defaultRoutineCron}</code> UTC). Añade rutinas para sustituir ese comportamiento.
            </div>
          )}

          {proactiveRoutines.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">
              No hay rutinas personalizadas.
              {canEdit ? " Usa «Añadir rutina» en el panel derecho." : ""}
            </p>
          ) : (
            <div className="space-y-2">
              {proactiveRoutines.map((routine, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/40",
                    selectedIndex === index && "border-primary bg-muted/50"
                  )}
                  onClick={() => selectRoutine(index)}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium">Rutina {index + 1}</span>
                    <Badge variant={routine.enabled ? "default" : "secondary"} className="font-normal text-xs">
                      {routine.enabled ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{routine.cron}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{routine.prompt}</p>
                </button>
              ))}
            </div>
          )}

          {canEdit && (
            <Button type="button" variant="outline" size="sm" className="md:hidden w-fit" onClick={addProactiveRoutine}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir rutina
            </Button>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="hidden md:flex w-full max-w-[33vw] shrink-0 flex-col gap-2 overflow-y-auto">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addProactiveRoutine}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir rutina
            </Button>
          </div>
          {renderRoutineFormCard()}
        </div>
      ) : (
        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
          {renderRoutineFormCard()}
        </div>
      )}

      <AnimatePresence>
        {mobileFormOpen && (canEdit || selectedRoutine) ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel"
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={mobilePanelTransition}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileFormOpen(false)}
            />
            <motion.div
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "100%" }}
              transition={mobilePanelTransition}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
            >
              {renderRoutineFormCard({
                className: "h-full rounded-none border-0 border-l",
                onClose: () => setMobileFormOpen(false),
              })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
