"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputSearch } from "@/components/InputSearch";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import {
  createSupplierMutation,
  fetchSuppliers,
  purchasingQueryKeys,
  updateSupplierMutation,
} from "@/lib/queries/purchasing";
import type { Supplier } from "@/lib/interfases";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const emptyForm = { name: "", taxId: "", email: "", phone: "", notes: "" };

export function SuppliersContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { business, loading: businessLoading } = useBusiness(businessSlug);
  const businessIdDoc = business?._id;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = !!canEditCurrentBusiness?.();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: suppliers = [], isLoading, refetch } = useQuery({
    queryKey: purchasingQueryKeys.suppliers(businessIdDoc ?? null, { q: q.trim() || undefined }),
    queryFn: () => fetchSuppliers(businessIdDoc!, { q: q.trim() || undefined, includeInactive: true }),
    enabled: !!businessIdDoc,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      taxId: s.taxId ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!businessIdDoc) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateSupplierMutation(businessIdDoc, editing._id, form);
        toast.success("Proveedor actualizado");
      } else {
        await createSupplierMutation(businessIdDoc, form);
        toast.success("Proveedor creado");
      }
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: purchasingQueryKeys.all });
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (s: Supplier) => {
    if (!businessIdDoc || !canEdit) return;
    try {
      await updateSupplierMutation(businessIdDoc, s._id, { status: !s.status });
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar el estado");
    }
  };

  if (businessLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Maestros de abastecimiento. Las recepciones alimentan el inventario.
          </p>
        </div>
        {canEdit && (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        )}
      </div>

      <InputSearch
        placeholder="Buscar por nombre, RIF, email o teléfono"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RIF / ID</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay proveedores.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.taxId || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[s.email, s.phone].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={s.status}
                      disabled={!canEdit}
                      onCheckedChange={() => void toggleStatus(s)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nombre</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>RIF / ID fiscal</Label>
              <Input
                className="mt-1"
                value={form.taxId}
                onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Email</Label>
                <Input
                  className="mt-1"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  className="mt-1"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
