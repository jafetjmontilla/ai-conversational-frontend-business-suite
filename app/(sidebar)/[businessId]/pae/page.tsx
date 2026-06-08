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
  PaeSkillListResult,
  PaeSkillRow,
  PaeWorkflowRunListResult,
} from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 25;

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
            Episodios, plantillas de flujo (skills) y ejecuciones en background.
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
