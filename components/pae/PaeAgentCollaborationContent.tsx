"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  PaeAgentCollaborationSettings,
  PaeAgentMessageRow,
  PaeAgentRunNode,
  PaeAgentRunTreeSummary,
  PaeAgentTarget,
  PaeSubAgentCatalogResult,
  PaeSubAgentRow,
} from "@/lib/interfases";
import { toast } from "sonner";
import { ArrowUpRight, Ban, GitBranch, Network, Pencil, RefreshCw, Send, Trash2, UserRound } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = new Set(["pending", "running", "waiting"]);

const STATUS_LABELS: Record<string, string> = {
  pending: "pendiente",
  running: "en curso",
  waiting: "esperando",
  completed: "completado",
  failed: "falló",
  cancelled: "cancelado",
};

interface PolicyForm {
  enabled: boolean;
  maxDelegationDepth: string;
  maxTreeAgentCalls: string;
  allowPersonalAgents: boolean;
  maxPersonalAgentsPerUser: string;
  personalAllowedTools: string[];
  asyncMessagingEnabled: boolean;
  asyncDeadlineMin: string;
}

interface AgentForm {
  slug: string;
  name: string;
  description: string;
  instructions: string;
  intents: string[];
  patterns: string;
  allowedTools: string[];
  callableAgents: string[];
  maxToolSteps: string;
}

const EMPTY_AGENT: AgentForm = {
  slug: "",
  name: "",
  description: "",
  instructions: "",
  intents: [],
  patterns: "",
  allowedTools: [],
  callableAgents: [],
  maxToolSteps: "",
};

function policyToForm(p: PaeAgentCollaborationSettings): PolicyForm {
  return {
    enabled: p.enabled,
    maxDelegationDepth: String(p.maxDelegationDepth),
    maxTreeAgentCalls: String(p.maxTreeAgentCalls),
    allowPersonalAgents: p.allowPersonalAgents,
    maxPersonalAgentsPerUser: String(p.maxPersonalAgentsPerUser),
    personalAllowedTools: p.personalAllowedTools,
    asyncMessagingEnabled: p.asyncMessagingEnabled,
    asyncDeadlineMin: String(Math.round(p.asyncDefaultDeadlineMs / 60000)),
  };
}

function slugOf(agentId: string): string {
  return agentId.slice(agentId.lastIndexOf(":") + 1);
}

function rowToAgentForm(row: PaeSubAgentRow): AgentForm {
  return {
    slug: slugOf(row.agentId),
    name: row.name,
    description: row.description,
    instructions: row.instructions ?? "",
    intents: row.triggers.intents,
    patterns: row.triggers.patterns.join("\n"),
    allowedTools: row.execution.allowedTools,
    callableAgents: row.callableAgents ?? [],
    maxToolSteps: row.policy.maxToolSteps != null ? String(row.policy.maxToolSteps) : "",
  };
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function intOrNull(raw: string): number | null {
  const n = Number(raw.trim());
  return raw.trim() && Number.isFinite(n) ? Math.round(n) : null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

function ChipGroup({
  options,
  selected,
  onToggle,
  disabled,
  labelFor,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  labelFor?: (value: string) => string;
}) {
  if (options.length === 0) return <p className="text-xs text-muted-foreground">Sin opciones disponibles.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(opt)}
            aria-pressed={active}
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs transition-colors disabled:opacity-50",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {labelFor ? labelFor(opt) : opt}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "failed" ? "destructive" : ACTIVE_STATUSES.has(status) ? "default" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function PaeAgentCollaborationContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);
  const isAdmin = canEditCurrentBusiness();

  const [settings, setSettings] = useState<PaeAgentCollaborationSettings | null>(null);
  const [policyForm, setPolicyForm] = useState<PolicyForm | null>(null);
  const [intents, setIntents] = useState<string[]>([]);
  const [mine, setMine] = useState<PaeSubAgentRow[]>([]);
  const [promotable, setPromotable] = useState<PaeSubAgentRow[]>([]);
  const [targets, setTargets] = useState<PaeAgentTarget[]>([]);
  const [runs, setRuns] = useState<PaeAgentRunTreeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentForm>(EMPTY_AGENT);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [savingAgent, setSavingAgent] = useState(false);
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [tree, setTree] = useState<PaeAgentRunNode[]>([]);
  const [messages, setMessages] = useState<PaeAgentMessageRow[]>([]);

  const call = useCallback(
    async <T,>(query: string, variables: Record<string, unknown>): Promise<T | undefined> =>
      (await fetchApiV1({ query, type: "json", variables: { businessDocId: businessIdDoc, ...variables } })) as
        | T
        | undefined,
    [businessIdDoc]
  );

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const [s, cat, own, tg, rs, promo] = await Promise.all([
        call<PaeAgentCollaborationSettings>(queries.getPaeAgentCollaboration, {}),
        call<PaeSubAgentCatalogResult>(queries.getPaeSubAgentCatalog, {}),
        call<PaeSubAgentRow[]>(queries.paeAgents, { scope: "personal" }),
        call<PaeAgentTarget[]>(queries.paeAgentCallableTargets, {}),
        call<PaeAgentRunTreeSummary[]>(queries.paeAgentRuns, { limit: 20 }),
        isAdmin ? call<PaeSubAgentRow[]>(queries.paeAgents, { scope: "promotable" }) : Promise.resolve([]),
      ]);
      setSettings(s ?? null);
      setPolicyForm(s ? policyToForm(s) : null);
      setIntents(cat?.intents ?? []);
      setMine(own ?? []);
      setTargets(tg ?? []);
      setRuns(rs ?? []);
      setPromotable(promo ?? []);
    } catch {
      toast.error("Error al cargar la colaboración entre agentes");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, call, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const openTree = useCallback(
    async (rootRunId: string) => {
      setSelectedRoot(rootRunId);
      try {
        const [nodes, msgs] = await Promise.all([
          call<PaeAgentRunNode[]>(queries.paeAgentRunTree, { rootRunId }),
          call<PaeAgentMessageRow[]>(queries.paeAgentMessages, { rootRunId }),
        ]);
        setTree(nodes ?? []);
        setMessages(msgs ?? []);
      } catch {
        toast.error("No se pudo cargar el árbol de ejecución");
      }
    },
    [call]
  );

  const savePolicy = async () => {
    if (!policyForm) return;
    setSavingPolicy(true);
    try {
      const deadlineMin = intOrNull(policyForm.asyncDeadlineMin);
      const out = await call<PaeAgentCollaborationSettings>(queries.updatePaeAgentCollaboration, {
        input: {
          enabled: policyForm.enabled,
          maxDelegationDepth: intOrNull(policyForm.maxDelegationDepth),
          maxTreeAgentCalls: intOrNull(policyForm.maxTreeAgentCalls),
          allowPersonalAgents: policyForm.allowPersonalAgents,
          maxPersonalAgentsPerUser: intOrNull(policyForm.maxPersonalAgentsPerUser),
          personalAllowedTools: policyForm.personalAllowedTools,
          asyncMessagingEnabled: policyForm.asyncMessagingEnabled,
          asyncDefaultDeadlineMs: deadlineMin != null ? deadlineMin * 60000 : null,
        },
      });
      if (out) {
        setSettings(out);
        setPolicyForm(policyToForm(out));
      }
      toast.success("Política guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la política");
    } finally {
      setSavingPolicy(false);
    }
  };

  const resetAgentForm = () => {
    setAgentForm(EMPTY_AGENT);
    setEditingAgentId(null);
  };

  const saveAgent = async () => {
    setSavingAgent(true);
    try {
      const input = {
        slug: agentForm.slug.trim(),
        name: agentForm.name.trim(),
        description: agentForm.description.trim(),
        instructions: agentForm.instructions.trim(),
        intents: agentForm.intents,
        patterns: agentForm.patterns
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean),
        allowedTools: agentForm.allowedTools,
        callableAgents: agentForm.callableAgents,
        maxToolSteps: intOrNull(agentForm.maxToolSteps),
      };
      if (editingAgentId) {
        await call(queries.updatePaeAgent, { agentId: editingAgentId, input });
        toast.success("Guardado como borrador; publícalo para activarlo");
      } else {
        await call(queries.createPaeAgent, { input });
        toast.success("Agente creado en borrador");
      }
      resetAgentForm();
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el agente");
    } finally {
      setSavingAgent(false);
    }
  };

  const publishAgent = async (agentId: string) => {
    try {
      await call(queries.publishPaeAgent, { agentId });
      toast.success("Agente publicado");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo publicar");
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!window.confirm(`¿Eliminar el agente "${slugOf(agentId)}"?`)) return;
    try {
      await call(queries.deletePaeAgent, { agentId });
      if (editingAgentId === agentId) resetAgentForm();
      void load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const promoteAgent = async (row: PaeSubAgentRow) => {
    const newAgentId = window.prompt("Id del nuevo agente del negocio (minúsculas y _):", slugOf(row.agentId));
    if (!newAgentId) return;
    try {
      await call(queries.promotePaeAgent, { agentId: row.agentId, newAgentId: newAgentId.trim() });
      toast.success("Copiado como borrador desactivado en Sub-agentes para revisión");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo promover");
    }
  };

  const cancelRun = async (rootRunId: string) => {
    if (!window.confirm("¿Cancelar todos los agentes de esta ejecución?")) return;
    try {
      const out = await call<{ runsCancelled: number; messagesCancelled: number }>(queries.cancelPaeAgentRun, {
        rootRunId,
      });
      toast.success(`Cancelado: ${out?.runsCancelled ?? 0} ejecuciones, ${out?.messagesCancelled ?? 0} encargos`);
      void load();
      void openTree(rootRunId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar");
    }
  };

  const personalToolOptions = useMemo(() => {
    const allowed = settings?.personalAllowedTools ?? [];
    const available = settings?.availableTools ?? [];
    if (allowed.includes("mcp:*")) {
      return [...new Set([...allowed.filter((t) => t !== "mcp:*"), ...available.filter((t) => !t.startsWith("pae_") && t !== "mcp:*")])];
    }
    return allowed;
  }, [settings]);

  const targetName = useMemo(() => new Map(targets.map((t) => [t.agentId, t.name])), [targets]);
  const callableOptions = targets.filter((t) => t.agentId !== editingAgentId).map((t) => t.agentId);

  if (!canViewCurrentBusiness()) {
    return <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>;
  }

  const personalBlocked = !settings?.enabled || !settings?.allowPersonalAgents;
  const atLimit = Boolean(settings && !editingAgentId && settings.myPersonalAgentCount >= settings.maxPersonalAgentsPerUser);
  const selectedSummary = runs.find((r) => r.rootRunId === selectedRoot);

  return (
    <div className="flex min-w-0 flex-col gap-3 w-full pb-6">
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Colaboración entre agentes
            </span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => void load()} disabled={loading} aria-label="Actualizar">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </CardTitle>
          <CardDescription>
            Delegación entre agentes (callableAgents), agentes personales por usuario y encargos asíncronos. Requiere
            además el interruptor de plataforma PAE_AGENT_COLLAB_ENABLED en el worker.
          </CardDescription>
        </CardHeader>
        {policyForm ? (
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                Colaboración activa
                <Switch checked={policyForm.enabled} onCheckedChange={(v) => setPolicyForm({ ...policyForm, enabled: v })} disabled={!isAdmin || savingPolicy} />
              </label>
              <label className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                Agentes personales
                <Switch checked={policyForm.allowPersonalAgents} onCheckedChange={(v) => setPolicyForm({ ...policyForm, allowPersonalAgents: v })} disabled={!isAdmin || savingPolicy} />
              </label>
              <label className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                Encargos asíncronos
                <Switch checked={policyForm.asyncMessagingEnabled} onCheckedChange={(v) => setPolicyForm({ ...policyForm, asyncMessagingEnabled: v })} disabled={!isAdmin || savingPolicy} />
              </label>
            </div>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="cp-depth">Profundidad máx.</Label>
                <Input id="cp-depth" type="number" min={1} max={10} value={policyForm.maxDelegationDepth} onChange={(e) => setPolicyForm({ ...policyForm, maxDelegationDepth: e.target.value })} disabled={!isAdmin || savingPolicy} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-calls">Llamadas por árbol</Label>
                <Input id="cp-calls" type="number" min={1} max={50} value={policyForm.maxTreeAgentCalls} onChange={(e) => setPolicyForm({ ...policyForm, maxTreeAgentCalls: e.target.value })} disabled={!isAdmin || savingPolicy} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-personal">Personales por usuario</Label>
                <Input id="cp-personal" type="number" min={0} max={50} value={policyForm.maxPersonalAgentsPerUser} onChange={(e) => setPolicyForm({ ...policyForm, maxPersonalAgentsPerUser: e.target.value })} disabled={!isAdmin || savingPolicy} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-deadline">Plazo encargos (min)</Label>
                <Input id="cp-deadline" type="number" min={1} max={1440} value={policyForm.asyncDeadlineMin} onChange={(e) => setPolicyForm({ ...policyForm, asyncDeadlineMin: e.target.value })} disabled={!isAdmin || savingPolicy} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tools permitidas en agentes personales</Label>
              <ChipGroup
                options={settings?.availableTools ?? []}
                selected={policyForm.personalAllowedTools}
                onToggle={(v) => setPolicyForm({ ...policyForm, personalAllowedTools: toggleValue(policyForm.personalAllowedTools, v) })}
                labelFor={(t) => (t === "mcp:*" ? "Todas las MCP del tenant" : t)}
                disabled={!isAdmin || savingPolicy}
              />
            </div>
            {isAdmin ? (
              <div className="flex justify-end">
                <Button type="button" onClick={() => void savePolicy()} disabled={savingPolicy}>
                  {savingPolicy ? "Guardando…" : "Guardar política"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Mis agentes ({mine.length}
              {settings ? ` / ${settings.maxPersonalAgentsPerUser}` : ""})
            </CardTitle>
            <CardDescription>
              Solo tú puedes verlos y usarlos. Se guardan en borrador; publica para que el asistente los use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalBlocked ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Este negocio no permite agentes personales. Un administrador puede activarlos en la política de arriba.
              </p>
            ) : null}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mine.map((row) => (
                    <TableRow key={row.agentId}>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{slugOf(row.agentId)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === "draft" ? "outline" : "secondary"}>
                          {row.status === "draft" ? "borrador" : `v${row.version}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {row.status === "draft" ? (
                            <Button variant="ghost" size="icon" onClick={() => void publishAgent(row.agentId)} disabled={personalBlocked} aria-label="Publicar">
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAgentForm(rowToAgentForm(row));
                              setEditingAgentId(row.agentId);
                            }}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => void deleteAgent(row.agentId)} aria-label="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {mine.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        {loading ? "Cargando…" : "Aún no tienes agentes"}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="text-sm font-medium">{editingAgentId ? `Editar ${slugOf(editingAgentId)}` : "Nuevo agente"}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pa-slug">Id</Label>
                  <Input id="pa-slug" placeholder="informe_semanal" value={agentForm.slug} onChange={(e) => setAgentForm({ ...agentForm, slug: e.target.value.toLowerCase() })} disabled={savingAgent || Boolean(editingAgentId) || personalBlocked} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pa-name">Nombre</Label>
                  <Input id="pa-name" value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} disabled={savingAgent || personalBlocked} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pa-desc">Descripción (la ven otros agentes al delegar)</Label>
                <Input id="pa-desc" value={agentForm.description} onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })} disabled={savingAgent || personalBlocked} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pa-instr">Instrucciones</Label>
                <Textarea id="pa-instr" rows={3} value={agentForm.instructions} onChange={(e) => setAgentForm({ ...agentForm, instructions: e.target.value })} disabled={savingAgent || personalBlocked} />
              </div>
              <div className="space-y-2">
                <Label>Triggers · intents</Label>
                <ChipGroup options={intents} selected={agentForm.intents} onToggle={(v) => setAgentForm({ ...agentForm, intents: toggleValue(agentForm.intents, v) })} disabled={savingAgent || personalBlocked} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pa-patterns">Triggers · patterns (regex, uno por línea)</Label>
                <Textarea id="pa-patterns" rows={2} value={agentForm.patterns} onChange={(e) => setAgentForm({ ...agentForm, patterns: e.target.value })} disabled={savingAgent || personalBlocked} />
              </div>
              <div className="space-y-2">
                <Label>Tools</Label>
                <ChipGroup options={personalToolOptions} selected={agentForm.allowedTools} onToggle={(v) => setAgentForm({ ...agentForm, allowedTools: toggleValue(agentForm.allowedTools, v) })} disabled={savingAgent || personalBlocked} />
              </div>
              <div className="space-y-2">
                <Label>Puede delegar en</Label>
                <ChipGroup options={callableOptions} selected={agentForm.callableAgents} onToggle={(v) => setAgentForm({ ...agentForm, callableAgents: toggleValue(agentForm.callableAgents, v) })} labelFor={(id) => targetName.get(id) ?? id} disabled={savingAgent || personalBlocked} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pa-steps">Máx. pasos</Label>
                  <Input id="pa-steps" type="number" min={1} max={8} placeholder="4" value={agentForm.maxToolSteps} onChange={(e) => setAgentForm({ ...agentForm, maxToolSteps: e.target.value })} disabled={savingAgent || personalBlocked} />
                </div>
              </div>
              {atLimit ? <p className="text-xs text-muted-foreground">Has alcanzado el máximo de agentes personales.</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetAgentForm} disabled={savingAgent}>
                  {editingAgentId ? "Cancelar" : "Limpiar"}
                </Button>
                <Button type="button" onClick={() => void saveAgent()} disabled={savingAgent || personalBlocked || atLimit || !agentForm.slug.trim() || !agentForm.name.trim()}>
                  {savingAgent ? "Guardando…" : "Guardar borrador"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Ejecuciones entre agentes
            </CardTitle>
            <CardDescription>
              {isAdmin ? "Árboles recientes del negocio." : "Tus árboles recientes."} Selecciona uno para ver cada agente, su coste y los encargos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raíz</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Agentes</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.rootRunId} className={cn("cursor-pointer", selectedRoot === r.rootRunId && "bg-muted")} onClick={() => void openTree(r.rootRunId)}>
                      <TableCell>
                        <div className="font-medium">{r.rootAgentId || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[14rem]">{r.task ?? ""}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(r.lastActivityAt ?? r.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.activeNodes > 0 ? "running" : r.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.nodes}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.totalCostUsd.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  {runs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        {loading ? "Cargando…" : "Sin ejecuciones con delegación"}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            {selectedRoot ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">Árbol {selectedRoot.slice(0, 8)}</div>
                  {tree.some((n) => ACTIVE_STATUSES.has(n.status)) || (selectedSummary?.activeNodes ?? 0) > 0 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => void cancelRun(selectedRoot)}>
                      <Ban className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  ) : null}
                </div>
                <ul className="space-y-2">
                  {tree.map((n) => (
                    <li key={n.runId} className="rounded-md border p-2 text-sm" style={{ marginLeft: `${Math.min(n.depth, 6) * 1.25}rem` }}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{targetName.get(n.agentId) ?? n.agentId}</span>
                        <StatusBadge status={n.status} />
                        {n.agentScope === "personal" ? <Badge variant="outline">personal</Badge> : null}
                        {n.viaMessageId ? <Badge variant="outline">asíncrono</Badge> : null}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {n.costUsd != null ? `${n.costUsd.toFixed(4)} USD` : ""}
                          {n.durationMs != null ? ` · ${(n.durationMs / 1000).toFixed(1)} s` : ""}
                        </span>
                      </div>
                      {n.task ? <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.task}</div> : null}
                      {n.resultSummary || n.errorMessage ? (
                        <div className={cn("mt-1 text-xs line-clamp-3", n.errorMessage ? "text-destructive" : "")}>
                          {n.errorMessage ?? n.resultSummary}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {messages.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Mensajes</div>
                    <ul className="space-y-1 text-xs">
                      {messages.map((m) => (
                        <li key={m.messageId} className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{m.kind}</Badge>
                          <span>
                            {targetName.get(m.fromAgentId) ?? m.fromAgentId} → {targetName.get(m.toAgentId) ?? m.toAgentId}
                          </span>
                          <span className="text-muted-foreground">{m.status}</span>
                          <span className="text-muted-foreground">{formatDate(m.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {isAdmin && promotable.length > 0 ? (
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Promover agentes personales
            </CardTitle>
            <CardDescription>
              Copia un agente personal publicado al catálogo del negocio como borrador desactivado. El original no se modifica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {promotable.map((row) => (
                <li key={row.agentId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.description}</div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void promoteAgent(row)}>
                    Promover
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
