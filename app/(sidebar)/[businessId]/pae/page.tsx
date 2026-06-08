"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  PaeEpisodeListResult,
  PaeProactiveRoutineRow,
  PaeProactiveSettings,
  PaeSkillListResult,
  PaeSkillRow,
  PaeWorkflowRunListResult,
} from "@/lib/interfases";
import { toast } from "sonner";
import { Clock, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const PAGE_SIZE = 25;

const EMPTY_ROUTINE: PaeProactiveRoutineRow = {
  cron: "0 8 * * *",
  prompt:
    "Buenos días. Inicia tú la conversación con un mensaje breve y útil: resume lo relevante de episodios recientes y sugiere un siguiente paso concreto para hoy.",
  enabled: true,
};

export default function PaeAdminPage() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [episodes, setEpisodes] = useState<PaeEpisodeListResult["items"]>([]);
  const [episodesTotal, setEpisodesTotal] = useState(0);
  const [skills, setSkills] = useState<PaeSkillRow[]>([]);
  const [skillsTotal, setSkillsTotal] = useState(0);
  const [workflows, setWorkflows] = useState<PaeWorkflowRunListResult["items"]>([]);
  const [workflowsTotal, setWorkflowsTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [debouncedUserFilter, setDebouncedUserFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [skillOpen, setSkillOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillTemplate, setSkillTemplate] = useState("");
  const [skillHints, setSkillHints] = useState("");
  const [savingSkill, setSavingSkill] = useState(false);

  const [proactiveSettings, setProactiveSettings] = useState<PaeProactiveSettings | null>(null);
  const [proactiveRoutines, setProactiveRoutines] = useState<PaeProactiveRoutineRow[]>([]);
  const [savingRoutines, setSavingRoutines] = useState(false);
  const [loadingProactive, setLoadingProactive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserFilter(userFilter.trim()), 400);
    return () => clearTimeout(t);
  }, [userFilter]);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const [ep, sk, wf] = await Promise.all([
        fetchApiV1({
          query: queries.listPaeEpisodes,
          type: "json",
          variables: {
            businessDocId: businessIdDoc,
            skip: 0,
            limit: PAGE_SIZE,
            userIdContains: debouncedUserFilter || undefined,
          },
        }) as Promise<PaeEpisodeListResult | undefined>,
        fetchApiV1({
          query: queries.listPaeSkills,
          type: "json",
          variables: { businessDocId: businessIdDoc, skip: 0, limit: PAGE_SIZE },
        }) as Promise<PaeSkillListResult | undefined>,
        fetchApiV1({
          query: queries.listPaeWorkflowRuns,
          type: "json",
          variables: { businessDocId: businessIdDoc, skip: 0, limit: PAGE_SIZE },
        }) as Promise<PaeWorkflowRunListResult | undefined>,
      ]);
      setEpisodes(ep?.items ?? []);
      setEpisodesTotal(ep?.totalCount ?? 0);
      setSkills(sk?.items ?? []);
      setSkillsTotal(sk?.totalCount ?? 0);
      setWorkflows(wf?.items ?? []);
      setWorkflowsTotal(wf?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar datos PAE");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, debouncedUserFilter]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const updateProactiveRoutine = (
    index: number,
    patch: Partial<PaeProactiveRoutineRow>
  ) => {
    setProactiveRoutines((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const removeProactiveRoutine = (index: number) => {
    setProactiveRoutines((prev) => prev.filter((_, i) => i !== index));
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
      setSkillOpen(false);
      setSkillName("");
      setSkillDescription("");
      setSkillTemplate("");
      setSkillHints("");
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

  if (!canViewCurrentBusiness) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            PAE — memoria episódica y workflows
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Episodios, skills, workflows y rutinas que inician turnos PAE sin mensaje del usuario.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="episodes">
        <TabsList>
          <TabsTrigger value="episodes">Episodios ({episodesTotal})</TabsTrigger>
          <TabsTrigger value="skills">Skills ({skillsTotal})</TabsTrigger>
          <TabsTrigger value="workflows">Workflows ({workflowsTotal})</TabsTrigger>
          <TabsTrigger value="proactive">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Rutinas proactivas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="episodes">
          <Card>
            <CardHeader>
              <CardTitle>Episodios recientes</CardTitle>
              <CardDescription>Memoria episódica por usuario (retrieval semántico en conversación).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Filtrar por userId…"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="max-w-sm"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Resumen</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Conversación</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {episodes.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                      <TableCell className="max-w-md truncate">{row.summary}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                        {row.openQuestions?.length ? row.openQuestions.join('; ') : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.conversationId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {episodes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sin episodios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Skills (memoria procedural)</CardTitle>
                <CardDescription>Plantillas que el planificador PAE puede reutilizar.</CardDescription>
              </div>
              {canEditCurrentBusiness && (
                <Button size="sm" onClick={() => setSkillOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva skill
                </Button>
              )}
            </CardHeader>
            <CardContent>
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
                        {canEditCurrentBusiness && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void deleteSkill(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {skills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Sin skills
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflows en background</CardTitle>
              <CardDescription>Ejecuciones encoladas desde intención &quot;automatiza&quot;.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="text-xs font-medium uppercase">{row.status}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{row.goal}</TableCell>
                      <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground text-sm">
                        {row.resultText ?? row.errorMessage ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {workflows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sin workflows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proactive">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Rutinas proactivas</CardTitle>
                <CardDescription>
                  Programación cron (UTC) que dispara turnos PAE completos para usuarios con conversación
                  activa reciente. El asistente inicia la conversación sin esperar un mensaje.
                </CardDescription>
              </div>
              {canEditCurrentBusiness && (
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
                  <Link href={`/${businessSlug}/config`} className="underline font-medium">
                    Configuración → Motor del agente
                  </Link>{" "}
                  para que las rutinas se ejecuten.
                </div>
              )}

              {proactiveSettings?.usesDefaultRoutine && (
                <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-muted-foreground">
                  Sin rutinas personalizadas, el worker usa el resumen matutino por defecto (
                  <code className="text-xs">{proactiveSettings.defaultRoutineCron}</code> UTC). Añade rutinas
                  abajo para sustituir ese comportamiento.
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
                            disabled={!canEditCurrentBusiness}
                            onCheckedChange={(checked) =>
                              updateProactiveRoutine(index, { enabled: checked })
                            }
                          />
                          <Label htmlFor={`routine-enabled-${index}`} className="text-xs">
                            Activa
                          </Label>
                        </div>
                        {canEditCurrentBusiness && (
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
                        disabled={!canEditCurrentBusiness}
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
                        disabled={!canEditCurrentBusiness}
                        onChange={(e) => updateProactiveRoutine(index, { prompt: e.target.value })}
                        rows={4}
                        placeholder="Instrucción que recibe el grafo PAE al iniciar el turno…"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {canEditCurrentBusiness && (
                <Button type="button" variant="outline" size="sm" onClick={addProactiveRoutine}>
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir rutina
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={skillOpen} onOpenChange={setSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva skill PAE</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={skillName} onChange={(e) => setSkillName(e.target.value)} />
            <Input
              placeholder="Descripción breve"
              value={skillDescription}
              onChange={(e) => setSkillDescription(e.target.value)}
            />
            <Textarea
              placeholder="Plantilla / pasos para el planificador"
              value={skillTemplate}
              onChange={(e) => setSkillTemplate(e.target.value)}
              rows={4}
            />
            <Input
              placeholder="Triggers (separados por coma)"
              value={skillHints}
              onChange={(e) => setSkillHints(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveSkill()} disabled={savingSkill}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
