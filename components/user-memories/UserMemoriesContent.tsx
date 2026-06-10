"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import type { UserMemoryListResult, UserMemoryRecordRow } from "@/lib/interfases";
import { toast } from "sonner";
import { Brain, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import Link from "next/link";

const PAGE_SIZE = 30;

export function UserMemoriesContent() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [items, setItems] = useState<UserMemoryRecordRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filterInput, setFilterInput] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UserMemoryRecordRow | null>(null);
  const [factsText, setFactsText] = useState("");
  const [saving, setSaving] = useState(false);

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
    setEditOpen(true);
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
      setEditOpen(false);
      setEditing(null);
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

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memoria de usuarios
          </CardTitle>
          <CardDescription>
            Hechos y preferencias que el worker guarda por usuario (WhatsApp / genérico). La configuración de límites y activación está en{" "}
            <Link href={`/${businessSlug}/ai/memory/ajustes`} className="underline text-primary">
              Ajustes
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:max-w-md">
              <label className="text-sm text-muted-foreground" htmlFor="um-filter">
                Filtrar por clave de usuario
              </label>
              <Input
                id="um-filter"
                placeholder="Teléfono, uid, etc."
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Actualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
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
                    <TableRow key={row.id}>
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
                        {canEditCurrentBusiness() ? (
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

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar hechos</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Clave:</span>{" "}
                <span className="font-mono text-xs break-all">{editing.userKey}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Rol:</span> {editing.role || "—"}
              </p>
              <div className="space-y-1">
                <label className="text-muted-foreground" htmlFor="um-facts">
                  Un hecho por línea (máx. 50; se normalizan duplicados al guardar en servidor)
                </label>
                <Textarea id="um-facts" rows={10} value={factsText} onChange={(e) => setFactsText(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveFacts()} disabled={saving || !editing}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
