"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  PaeSkillListResult,
  PaeSkillRow,
  PaeSubAgentCatalogResult,
  PaeSubAgentRow,
  PaeSubAgentTriggerPreviewResult,
} from "@/lib/interfases";
import { toast } from "sonner";
import { Bot, FlaskConical, Pencil, Plus, RefreshCw, Send, Trash2, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<string, string> = {
  graph: "Grafo (built-in)",
  tools: "Tools (genérico)",
  http: "Webhook HTTP",
  workflow: "Workflow",
};

const APPROVAL_ACTIONS = ["send_message", "delete", "purchase", "shell", "mutate"];

interface FormState {
  agentId: string;
  name: string;
  description: string;
  mode: string;
  intents: string[];
  patterns: string;
  skillIds: string[];
  allowedTools: string[];
  planTemplate: string;
  webhookUrl: string;
  webhookSecret: string;
  clearWebhookSecret: boolean;
  hasWebhookSecret: boolean;
  async: boolean;
  maxToolSteps: string;
  maxDurationSec: string;
  maxCostUsd: string;
  requireApprovalFor: string[];
  summaryField: string;
  deliveryTemplate: string;
  priority: string;
  enabled: boolean;
  instructions: string;
  callableAgents: string[];
}

const EMPTY_FORM: FormState = {
  agentId: "",
  name: "",
  description: "",
  mode: "tools",
  intents: [],
  patterns: "",
  skillIds: [],
  allowedTools: [],
  planTemplate: "",
  webhookUrl: "",
  webhookSecret: "",
  clearWebhookSecret: false,
  hasWebhookSecret: false,
  async: false,
  maxToolSteps: "",
  maxDurationSec: "",
  maxCostUsd: "",
  requireApprovalFor: [],
  summaryField: "userSummary",
  deliveryTemplate: "",
  priority: "0",
  enabled: true,
  instructions: "",
  callableAgents: [],
};

function rowToForm(row: PaeSubAgentRow): FormState {
  return {
    agentId: row.agentId,
    name: row.name,
    description: row.description,
    mode: row.execution.mode,
    intents: row.triggers.intents,
    patterns: row.triggers.patterns.join("\n"),
    skillIds: row.triggers.skillIds,
    allowedTools: row.execution.allowedTools,
    planTemplate: row.execution.planTemplate ?? "",
    webhookUrl: row.execution.webhookUrl ?? "",
    webhookSecret: "",
    clearWebhookSecret: false,
    hasWebhookSecret: row.execution.hasWebhookSecret,
    async: row.policy.async,
    maxToolSteps: row.policy.maxToolSteps != null ? String(row.policy.maxToolSteps) : "",
    maxDurationSec: row.policy.maxDurationMs != null ? String(row.policy.maxDurationMs / 1000) : "",
    maxCostUsd: row.policy.maxCostUsd != null ? String(row.policy.maxCostUsd) : "",
    requireApprovalFor: row.policy.requireApprovalFor,
    summaryField: row.output.summaryField,
    deliveryTemplate: row.output.deliveryTemplate ?? "",
    priority: String(row.priority),
    enabled: row.enabled,
    instructions: row.instructions ?? "",
    callableAgents: row.callableAgents ?? [],
  };
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function optionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
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
              "rounded-md border px-2 py-0.5 text-xs transition-colors",
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

export function PaeSubAgentsContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [catalog, setCatalog] = useState<PaeSubAgentCatalogResult | null>(null);
  const [skills, setSkills] = useState<PaeSkillRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewIntent, setPreviewIntent] = useState("none");
  const [preview, setPreview] = useState<PaeSubAgentTriggerPreviewResult | null>(null);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const [cat, sk] = await Promise.all([
        fetchApiV1({
          query: queries.getPaeSubAgentCatalog,
          type: "json",
          variables: { businessDocId: businessIdDoc },
        }) as Promise<PaeSubAgentCatalogResult | undefined>,
        fetchApiV1({
          query: queries.listPaeSkills,
          type: "json",
          variables: { businessDocId: businessIdDoc, skip: 0, limit: 100 },
        }) as Promise<PaeSkillListResult | undefined>,
      ]);
      setCatalog(cat ?? null);
      setSkills(sk?.items ?? []);
    } catch {
      toast.error("Error al cargar el catálogo de sub-agentes");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc]);

  useEffect(() => {
    void load();
  }, [load]);

  const skillNameById = useMemo(() => new Map(skills.map((s) => [s.id, s.name])), [skills]);

  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (row: PaeSubAgentRow) => {
    setForm(rowToForm(row));
    setEditingId(row.agentId);
    setMobileFormOpen(true);
  };

  const save = async () => {
    if (!businessIdDoc) return;
    setSaving(true);
    try {
      const maxDurationSec = optionalNumber(form.maxDurationSec);
      await fetchApiV1({
        query: queries.upsertPaeSubAgentDefinition,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          input: {
            agentId: form.agentId.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            enabled: form.enabled,
            priority: optionalNumber(form.priority) ?? 0,
            triggers: {
              intents: form.intents,
              patterns: form.patterns
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean),
              skillIds: form.skillIds,
            },
            mode: form.mode,
            allowedTools: form.mode === "tools" ? form.allowedTools : [],
            planTemplate: form.planTemplate.trim(),
            webhookUrl: form.mode === "http" ? form.webhookUrl.trim() : null,
            webhookSecret: form.clearWebhookSecret ? "" : form.webhookSecret.trim() || null,
            async: form.mode !== "workflow" && form.async,
            maxToolSteps: optionalNumber(form.maxToolSteps),
            maxDurationMs: maxDurationSec != null ? Math.round(maxDurationSec * 1000) : null,
            maxCostUsd: optionalNumber(form.maxCostUsd),
            requireApprovalFor: form.requireApprovalFor,
            summaryField: form.summaryField,
            deliveryTemplate: form.deliveryTemplate.trim(),
            instructions: form.instructions.trim(),
            callableAgents: form.mode === "tools" ? form.callableAgents : [],
          },
        },
      });
      toast.success(editingId ? "Sub-agente actualizado" : "Sub-agente creado");
      resetForm();
      setMobileFormOpen(false);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el sub-agente");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (agentId: string) => {
    if (!businessIdDoc || !window.confirm(`¿Eliminar el sub-agente "${agentId}"?`)) return;
    try {
      await fetchApiV1({
        query: queries.deletePaeSubAgentDefinition,
        type: "json",
        variables: { businessDocId: businessIdDoc, agentId },
      });
      toast.success("Sub-agente eliminado");
      if (editingId === agentId) resetForm();
      void load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const setEnabled = async (row: PaeSubAgentRow, enabled: boolean) => {
    if (!businessIdDoc) return;
    setCatalog((prev) =>
      prev
        ? { ...prev, items: prev.items.map((i) => (i.agentId === row.agentId ? { ...i, enabled } : i)) }
        : prev
    );
    try {
      await fetchApiV1({
        query: queries.setPaeSubAgentEnabled,
        type: "json",
        variables: { businessDocId: businessIdDoc, agentId: row.agentId, enabled },
      });
    } catch {
      toast.error("No se pudo cambiar el estado");
      void load();
    }
  };

  const publish = async (agentId: string) => {
    if (!businessIdDoc) return;
    try {
      await fetchApiV1({
        query: queries.publishPaeAgent,
        type: "json",
        variables: { businessDocId: businessIdDoc, agentId },
      });
      toast.success("Agente publicado");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo publicar");
    }
  };

  const runPreview = async () => {
    if (!businessIdDoc || !previewMessage.trim()) return;
    try {
      const out = (await fetchApiV1({
        query: queries.previewPaeSubAgentTriggers,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          message: previewMessage.trim(),
          intent: previewIntent === "none" ? null : previewIntent,
        },
      })) as PaeSubAgentTriggerPreviewResult | undefined;
      setPreview(out ?? null);
    } catch {
      toast.error("No se pudo evaluar el mensaje");
    }
  };

  if (!canViewCurrentBusiness()) {
    return <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>;
  }

  const canEdit = canEditCurrentBusiness();
  const items = catalog?.items ?? [];
  const intents = catalog?.intents ?? [];
  const modes = catalog?.modes ?? ["tools", "http", "workflow"];
  const availableTools = catalog?.availableTools ?? [];
  const callableOptions = items
    .filter((i) => i.agentId !== form.agentId && !i.execution.requiresLocalRuntime)
    .map((i) => i.agentId);
  const nameByAgentId = new Map(items.map((i) => [i.agentId, i.name]));

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderFormCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>{editingId ? `Editar ${editingId}` : "Nuevo sub-agente"}</CardTitle>
            <CardDescription>
              Agentes especializados sin desplegar código: tools PAE/MCP, webhook propio o workflow.
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="sa-id">Id</Label>
            <Input
              id="sa-id"
              placeholder="crm_sync"
              value={form.agentId}
              onChange={(e) => patch({ agentId: e.target.value.toLowerCase() })}
              disabled={saving || Boolean(editingId)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sa-name">Nombre</Label>
            <Input id="sa-name" placeholder="Sincronizar CRM" value={form.name} onChange={(e) => patch({ name: e.target.value })} disabled={saving} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sa-desc">Descripción</Label>
          <Input id="sa-desc" value={form.description} onChange={(e) => patch({ description: e.target.value })} disabled={saving} />
        </div>

        <div className="space-y-2">
          <Label>Modo de ejecución</Label>
          <Select value={form.mode} onValueChange={(mode) => patch({ mode })} disabled={saving}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modes.map((m) => (
                <SelectItem key={m} value={m}>
                  {MODE_LABELS[m] ?? m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Triggers · intents</Label>
          <ChipGroup options={intents} selected={form.intents} onToggle={(v) => patch({ intents: toggleValue(form.intents, v) })} disabled={saving} />
          <p className="text-xs text-muted-foreground">
            Solo con intent (sin patterns ni skills) el agente sustituye al built-in de ese intent.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sa-patterns">Triggers · patterns (regex, uno por línea)</Label>
          <Textarea id="sa-patterns" rows={3} placeholder={"sincroniza.*crm\n\\bleads?\\b"} value={form.patterns} onChange={(e) => patch({ patterns: e.target.value })} disabled={saving} />
        </div>
        {skills.length > 0 ? (
          <div className="space-y-2">
            <Label>Triggers · skills</Label>
            <ChipGroup
              options={skills.map((s) => s.id)}
              selected={form.skillIds}
              onToggle={(v) => patch({ skillIds: toggleValue(form.skillIds, v) })}
              labelFor={(id) => skillNameById.get(id) ?? id}
              disabled={saving}
            />
          </div>
        ) : null}

        {form.mode === "tools" ? (
          <div className="space-y-2">
            <Label>Tools permitidas</Label>
            <ChipGroup
              options={availableTools}
              selected={form.allowedTools}
              onToggle={(v) => patch({ allowedTools: toggleValue(form.allowedTools, v) })}
              labelFor={(t) => (t === "mcp:*" ? "Todas las MCP del tenant" : t)}
              disabled={saving}
            />
          </div>
        ) : null}

        {form.mode === "http" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sa-url">Webhook (https)</Label>
              <Input id="sa-url" placeholder="https://erp.example.com/pae-agent" value={form.webhookUrl} onChange={(e) => patch({ webhookUrl: e.target.value })} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-secret">Secreto HMAC (cabecera X-Pae-Signature)</Label>
              <Input
                id="sa-secret"
                type="password"
                autoComplete="new-password"
                placeholder={form.hasWebhookSecret ? "•••••• guardado (vacío = conservar)" : "Opcional"}
                value={form.webhookSecret}
                onChange={(e) => patch({ webhookSecret: e.target.value, clearWebhookSecret: false })}
                disabled={saving || form.clearWebhookSecret}
              />
              {form.hasWebhookSecret ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.clearWebhookSecret}
                    onChange={(e) => patch({ clearWebhookSecret: e.target.checked, webhookSecret: "" })}
                    disabled={saving}
                  />
                  Eliminar secreto guardado
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="sa-template">
            {form.mode === "workflow" ? "Objetivo / pasos del workflow" : "Instrucciones"}
          </Label>
          <Textarea
            id="sa-template"
            rows={4}
            placeholder="Cómo debe resolver la tarea este agente…"
            value={form.planTemplate}
            onChange={(e) => patch({ planTemplate: e.target.value })}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sa-instructions">Instrucciones del autor (opcional)</Label>
          <Textarea
            id="sa-instructions"
            rows={3}
            placeholder="Tono, criterios o pasos preferidos. Nunca pueden saltarse las políticas del sistema."
            value={form.instructions}
            onChange={(e) => patch({ instructions: e.target.value })}
            disabled={saving}
          />
        </div>

        {form.mode === "tools" ? (
          <div className="space-y-2">
            <Label>Puede delegar en</Label>
            <ChipGroup
              options={callableOptions}
              selected={form.callableAgents}
              onToggle={(v) => patch({ callableAgents: toggleValue(form.callableAgents, v) })}
              labelFor={(id) => nameByAgentId.get(id) ?? id}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Se exponen como tools agent__… Requiere la colaboración entre agentes activa (pestaña Colaboración).
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="sa-steps">Máx. pasos</Label>
            <Input id="sa-steps" type="number" min={1} max={8} placeholder="4" value={form.maxToolSteps} onChange={(e) => patch({ maxToolSteps: e.target.value })} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sa-duration">Tiempo máx. (s)</Label>
            <Input id="sa-duration" type="number" min={1} max={120} placeholder="—" value={form.maxDurationSec} onChange={(e) => patch({ maxDurationSec: e.target.value })} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sa-cost">Coste máx. (USD)</Label>
            <Input id="sa-cost" type="number" min={0} max={100} step={0.01} placeholder="—" value={form.maxCostUsd} onChange={(e) => patch({ maxCostUsd: e.target.value })} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sa-priority">Prioridad</Label>
            <Input id="sa-priority" type="number" min={-100} max={100} value={form.priority} onChange={(e) => patch({ priority: e.target.value })} disabled={saving} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pedir aprobación para</Label>
          <ChipGroup
            options={APPROVAL_ACTIONS}
            selected={form.requireApprovalFor}
            onToggle={(v) => patch({ requireApprovalFor: toggleValue(form.requireApprovalFor, v) })}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Texto de entrega</Label>
            <Select value={form.summaryField} onValueChange={(summaryField) => patch({ summaryField })} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="userSummary">Respuesta redactada</SelectItem>
                <SelectItem value="summary">Resumen corto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center justify-between gap-2 text-sm">
              Segundo plano
              <Switch checked={form.async && form.mode !== "workflow"} onCheckedChange={(v) => patch({ async: v })} disabled={saving || form.mode === "workflow"} />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm">
              Activo
              <Switch checked={form.enabled} onCheckedChange={(v) => patch({ enabled: v })} disabled={saving} />
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sa-delivery">Plantilla de entrega (opcional)</Label>
          <Input
            id="sa-delivery"
            placeholder="✅ {{agentName}}: {{userSummary}}"
            value={form.deliveryTemplate}
            onChange={(e) => patch({ deliveryTemplate: e.target.value })}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            Variables: {"{{userSummary}} {{summary}} {{agentName}} {{agentId}} {{userMessage}}"}. Se usa al entregar resultados en segundo plano.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              options?.onClose?.();
            }}
            disabled={saving}
          >
            {editingId ? "Cancelar" : "Limpiar"}
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving || !form.agentId.trim() || !form.name.trim()}>
            {saving ? "Guardando…" : "Guardar"}
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
              <Bot className="h-5 w-5" />
              Sub-agentes ({items.length})
            </div>
            <div className="flex items-center gap-2">
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex md:hidden"
                  onClick={() => {
                    resetForm();
                    setMobileFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => void load()} disabled={loading} aria-label="Actualizar">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Catálogo del asistente personal: built-ins y agentes propios del negocio. Los cambios se aplican en ~30 s.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 gap-4 overflow-x-hidden">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead className="text-right">Runs 7d</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.agentId}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {row.name}
                        {row.builtIn ? <Badge variant="secondary">built-in</Badge> : null}
                        {row.status === "draft" ? <Badge variant="outline">borrador</Badge> : null}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{row.agentId}</div>
                      {row.promotedFrom ? (
                        <div className="text-xs text-muted-foreground">promovido de un agente personal</div>
                      ) : null}
                      {row.callableAgents?.length ? (
                        <div className="text-xs text-muted-foreground">
                          delega en: {row.callableAgents.map((id) => nameByAgentId.get(id) ?? id).join(", ")}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{MODE_LABELS[row.execution.mode] ?? row.execution.mode}</Badge>
                      {row.policy.async ? <div className="text-xs text-muted-foreground mt-1">segundo plano</div> : null}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {row.triggers.intents.map((i) => (
                          <span key={`i-${i}`} className="rounded bg-muted px-1.5 py-0.5">{i}</span>
                        ))}
                        {row.triggers.patterns.map((p) => (
                          <span key={`p-${p}`} className="rounded bg-muted px-1.5 py-0.5 font-mono truncate max-w-[10rem]">/{p}/</span>
                        ))}
                        {row.triggers.skillIds.map((s) => (
                          <span key={`s-${s}`} className="rounded bg-muted px-1.5 py-0.5">skill:{skillNameById.get(s) ?? s}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.runsLast7d}</TableCell>
                    <TableCell>
                      <Switch checked={row.enabled} onCheckedChange={(v) => void setEnabled(row, v)} disabled={!canEdit} aria-label={`Activar ${row.name}`} />
                    </TableCell>
                    <TableCell>
                      {canEdit && !row.builtIn ? (
                        <div className="flex justify-end gap-1">
                          {row.status === "draft" ? (
                            <Button variant="ghost" size="icon" onClick={() => void publish(row.agentId)} aria-label="Publicar">
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" onClick={() => startEdit(row)} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => void remove(row.agentId)} aria-label="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {loading ? "Cargando…" : "Sin sub-agentes"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="h-4 w-4" />
              Probar triggers
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Mensaje de ejemplo del usuario"
                value={previewMessage}
                onChange={(e) => setPreviewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runPreview();
                }}
              />
              <Select value={previewIntent} onValueChange={setPreviewIntent}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin intent</SelectItem>
                  {intents.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => void runPreview()} disabled={!previewMessage.trim()}>
                Evaluar
              </Button>
            </div>
            {preview ? (
              preview.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ningún sub-agente: lo resolvería el asistente principal.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {preview.matches.map((m) => (
                    <li key={m.agentId} className="flex flex-wrap items-center gap-2">
                      <span className={cn("font-medium", m.agentId === preview.selectedAgentId && "text-primary")}>
                        {m.agentId === preview.selectedAgentId ? "→ " : ""}
                        {m.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {m.reasons.join(" · ")} · score {m.score.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
            <p className="text-xs text-muted-foreground">
              Aproximación: las skills y las reglas finas de los built-ins (p. ej. URL directa) se evalúan solo en el worker.
            </p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">{renderFormCard()}</div>
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
              {renderFormCard({
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
