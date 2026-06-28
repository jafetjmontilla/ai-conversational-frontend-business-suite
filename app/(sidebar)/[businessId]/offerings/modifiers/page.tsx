"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { ModifierGroup } from "@/lib/interfases";
import { toast } from "sonner";
import { Layers, Plus, Pencil } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";

export default function ModifiersListPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canEdit = canEditCurrentBusiness();
  const { businessIdDoc } = useBusinessApps(businessId);

  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const res = await fetchApiV1({
        query: queries.getModifierGroups,
        type: "json",
        variables: { id: businessIdDoc, includeInactive: false },
      });
      setGroups(Array.isArray(res) ? res : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessIdDoc) load();
  }, [businessIdDoc]);

  const handleCreate = async () => {
    if (!newName.trim() || !businessIdDoc) return;
    setCreating(true);
    try {
      const created = await fetchApiV1({
        query: queries.createModifierGroup,
        type: "json",
        variables: {
          id: businessIdDoc,
          args: { name: newName.trim(), selectionType: "MULTIPLE", maxSelections: 3 },
        },
      });
      const g = created as { _id: string };
      toast.success("Grupo creado");
      setCreateOpen(false);
      setNewName("");
      router.push(`/${businessId}/offerings/modifiers/${g._id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Modificadores y adicionales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grupos reutilizables de extras, opciones y complementos para productos y servicios.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo grupo
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grupos configurados</CardTitle>
          <CardDescription>
            Vincula estos grupos desde la ficha de cada producto o servicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay grupos. Crea uno para empezar (ej. &quot;Salsas extra&quot;, &quot;Servicios VIP&quot;).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Selección</TableHead>
                  <TableHead>Opciones</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g._id}>
                    <TableCell className="font-medium">
                      {g.name}
                      {g.isRequired && (
                        <span className="ml-2 text-xs text-muted-foreground">(obligatorio)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {g.selectionType === "SINGLE" ? "Una" : `${g.minSelections}–${g.maxSelections}`}
                    </TableCell>
                    <TableCell>{g.options?.length ?? 0}</TableCell>
                    <TableCell className="text-sm">
                      {g.priceBehavior === "INCLUDED"
                        ? `${g.includedQuantity} incl.`
                        : "Adicional"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${businessId}/offerings/modifiers/${g._id}`}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo grupo de modificadores</DialogTitle>
            <DialogDescription>
              Ej: &quot;Elige tus salsas&quot;, &quot;Extras de barbería&quot;, &quot;Garantía extendida&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre del grupo</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creando…" : "Crear y configurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
