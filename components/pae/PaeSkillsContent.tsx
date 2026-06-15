"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeSkillListResult, PaeSkillRow } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export function PaeSkillsContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [skills, setSkills] = useState<PaeSkillRow[]>([]);
  const [skillsTotal, setSkillsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillTemplate, setSkillTemplate] = useState("");
  const [skillHints, setSkillHints] = useState("");
  const [savingSkill, setSavingSkill] = useState(false);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const sk = (await fetchApiV1({
        query: queries.listPaeSkills,
        type: "json",
        variables: { businessDocId: businessIdDoc, skip: 0, limit: PAGE_SIZE },
      })) as PaeSkillListResult | undefined;
      setSkills(sk?.items ?? []);
      setSkillsTotal(sk?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar skills PAE");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetSkillForm = () => {
    setSkillName("");
    setSkillDescription("");
    setSkillTemplate("");
    setSkillHints("");
  };

  const saveSkill = async () => {
    if (!businessIdDoc || !skillName.trim()) return;
    setSavingSkill(true);
    try {
      await fetchApiV1({
        query: queries.upsertPaeSkill,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          input: {
            name: skillName.trim(),
            description: skillDescription.trim(),
            template: skillTemplate.trim(),
            triggerHints: skillHints
              .split(",")
              .map((h) => h.trim())
              .filter(Boolean),
          },
        },
      });
      toast.success("Skill guardada");
      resetSkillForm();
      setMobileFormOpen(false);
      void load();
    } catch {
      toast.error("No se pudo guardar la skill");
    } finally {
      setSavingSkill(false);
    }
  };

  const deleteSkill = async (skillId: string) => {
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.deletePaeSkill,
        type: "json",
        variables: { businessDocId: businessIdDoc, skillId },
      });
      toast.success("Skill eliminada");
      void load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  const canEdit = canEditCurrentBusiness();

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderSkillFormCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>Nueva skill</CardTitle>
            <CardDescription>
              Plantillas que el planificador PAE puede reutilizar (memoria procedural).
            </CardDescription>
          </div>
          {options?.onClose ? (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={options.onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-3">
        <div className="space-y-2">
          <Label htmlFor="skill-name">Nombre</Label>
          <Input id="skill-name" placeholder="Nombre" value={skillName} onChange={(e) => setSkillName(e.target.value)} disabled={savingSkill} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill-desc">Descripción breve</Label>
          <Input id="skill-desc" placeholder="Descripción breve" value={skillDescription} onChange={(e) => setSkillDescription(e.target.value)} disabled={savingSkill} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill-template">Plantilla / pasos</Label>
          <Textarea id="skill-template" placeholder="Plantilla / pasos para el planificador" value={skillTemplate} onChange={(e) => setSkillTemplate(e.target.value)} rows={4} disabled={savingSkill} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill-hints">Triggers (separados por coma)</Label>
          <Input id="skill-hints" placeholder="recordatorio, agenda, …" value={skillHints} onChange={(e) => setSkillHints(e.target.value)} disabled={savingSkill} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => { resetSkillForm(); options?.onClose?.(); }} disabled={savingSkill}>
            Limpiar
          </Button>
          <Button type="button" onClick={() => void saveSkill()} disabled={savingSkill || !skillName.trim()}>
            {savingSkill ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Skills ({skillsTotal})
            </div>
            <div className="flex items-center gap-2">
              {canEdit ? (
                <Button type="button" variant="outline" size="sm" className="flex md:hidden" onClick={() => setMobileFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva skill
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void load()}
                disabled={loading}
                aria-label="Actualizar"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Plantillas reutilizables por el planificador PAE.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="max-w-md truncate">{row.description}</TableCell>
                    <TableCell>{row.usageCount}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => void deleteSkill(row.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {skills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Sin skills
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
          {renderSkillFormCard()}
        </div>
      ) : null}

      <AnimatePresence>
        {canEdit && mobileFormOpen ? (
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
              {renderSkillFormCard({
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
