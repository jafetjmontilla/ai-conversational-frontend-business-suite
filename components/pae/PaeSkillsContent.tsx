"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeSkillListResult, PaeSkillRow } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 25;

export function PaeSkillsContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [skills, setSkills] = useState<PaeSkillRow[]>([]);
  const [skillsTotal, setSkillsTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [skillOpen, setSkillOpen] = useState(false);
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

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Skills ({skillsTotal})</CardTitle>
            <CardDescription>Plantillas que el planificador PAE puede reutilizar (memoria procedural).</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            {canEditCurrentBusiness() && (
              <Button size="sm" onClick={() => setSkillOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva skill
              </Button>
            )}
          </div>
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
                    {canEditCurrentBusiness() && (
                      <Button variant="ghost" size="icon" onClick={() => void deleteSkill(row.id)}>
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
