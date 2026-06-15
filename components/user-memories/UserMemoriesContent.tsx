"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { UserMemoryListResult, UserMemoryRecordRow } from "@/lib/interfases";
import { toast } from "sonner";
import { Brain, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PAGE_SIZE = 30;

export function UserMemoriesContent() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [items, setItems] = useState<UserMemoryRecordRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filterInput, setFilterInput] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<UserMemoryRecordRow | null>(null);
  const [factsText, setFactsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filterInput.trim()), 400);
    return () => clearTimeout(t);
  }, [filterInput]);

  useEffect(() => {
    setSkip(0);
  }, [debouncedFilter]);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const res = (await fetchApiV1({
        query: queries.listUserMemories,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          skip,
          limit: PAGE_SIZE,
          userKeyContains: debouncedFilter || undefined,
        },
      })) as UserMemoryListResult | undefined;
      setItems(res?.items ?? []);
      setTotalCount(res?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar la memoria de usuarios");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, skip, debouncedFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (row: UserMemoryRecordRow) => {
    setEditing(row);
    setFactsText(row.facts?.length ? row.facts.join("\n") : "");
    setMobileEditOpen(true);
  };

  const closeEdit = () => {
    setEditing(null);
    setMobileEditOpen(false);
  };

  const saveFacts = async () => {
    if (!businessIdDoc || !editing) return;
    const lines = factsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    setSaving(true);
    try {
      await fetchApiV1({
        query: queries.updateUserMemoryRecord,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          userKey: editing.userKey,
          role: editing.role || "",
          facts: lines,
        },
      });
      toast.success("Memoria actualizada");
      closeEdit();
      void load();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error al guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row: UserMemoryRecordRow) => {
    if (!businessIdDoc) return;
    if (!confirm(`¿Eliminar la memoria de «${row.userKey}» (${row.role || "sin rol"})?`)) return;
    try {
      await fetchApiV1({
        query: queries.deleteUserMemoryRecord,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          userKey: row.userKey,
          role: row.role || "",
        },
      });
      toast.success("Registro eliminado");
      if (editing?.id === row.id) closeEdit();
      void load();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error al eliminar";
      toast.error(msg);
    }
  };

  if (!businessSlug) return null;

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver esta sección.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canPrev = skip > 0;
  const canNext = skip + items.length < totalCount;
  const canEdit = canEditCurrentBusiness();

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderEditCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>Editar hechos</CardTitle>
            <CardDescription>
              {editing
                ? "Un hecho por línea. Se normalizan duplicados al guardar en servidor."
                : "Selecciona un registro y pulsa editar para ver o modificar sus hechos."}
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
        {editing ? (
          <>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Clave:</span>{" "}
                <span className="font-mono text-xs break-all">{editing.userKey}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Rol:</span> {editing.role || "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="um-facts">Hechos</Label>
              <Textarea
                id="um-facts"
                rows={12}
                value={factsText}
                onChange={(e) => setFactsText(e.target.value)}
                className="font-mono text-xs"
                disabled={!canEdit || saving}
              />
            </div>
            {canEdit && (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeEdit} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void saveFacts()} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Ningún registro seleccionado.
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
              <Brain className="h-5 w-5" />
              Memoria de usuarios
            </div>
            <div className="flex items-center gap-2">
              {canEdit && editing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex md:hidden"
                  onClick={() => setMobileEditOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
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
          <CardDescription>
            Hechos y preferencias que el worker guarda por usuario (WhatsApp / genérico). Límites y activación en{" "}
            <Link href={`/${businessSlug}/ai/memory/ajustes`} className="underline text-primary">
              Ajustes
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 space-y-4 overflow-x-hidden">
          <div className="max-w-md">
            <Label htmlFor="um-filter">Filtrar por clave de usuario</Label>
            <Input
              id="um-filter"
              className="mt-1"
              placeholder="Teléfono, uid, etc."
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario (clave)</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Hechos</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay registros{debouncedFilter ? " para este filtro" : ""}.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(editing?.id === row.id && "bg-muted/50")}
                    >
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={row.userKey}>
                        {row.userKey}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.role || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.facts?.length ?? 0}</TableCell>
                      <TableCell className="text-sm capitalize">{row.source === "extracted" ? "IA" : "Manual"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleString("es") : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {canEdit ? (
                          <>
                            <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Editar hechos">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => void removeRow(row)} aria-label="Eliminar">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Solo lectura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {totalCount === 0 ? "0" : `${skip + 1}–${skip + items.length}`} de {totalCount}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}>
                Anterior
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!canNext || loading} onClick={() => setSkip((s) => s + PAGE_SIZE)}>
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
          {renderEditCard()}
        </div>
      ) : null}

      <AnimatePresence>
        {canEdit && mobileEditOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel"
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={mobilePanelTransition}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={closeEdit}
            />
            <motion.div
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "100%" }}
              transition={mobilePanelTransition}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
            >
              {renderEditCard({
                className: "h-full rounded-none border-0 border-l",
                onClose: closeEdit,
              })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
